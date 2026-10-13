-- =====================================================================
-- Lugar Secreto Hualqui — esquema completo de Supabase
-- Pegar entero en Supabase > SQL Editor > New query > Run.
-- Es idempotente: se puede volver a ejecutar sin perder datos.
-- =====================================================================

-- ---------- 1. Tablas ----------

-- Cada cabaña con su capacidad y tarifas por noche (editables desde /admin).
CREATE TABLE IF NOT EXISTS public.cabins (
  id text PRIMARY KEY,                      -- ej: 'lugar-secreto'
  name text NOT NULL,
  base_guests int NOT NULL,                 -- personas incluidas en el precio
  max_guests int NOT NULL,
  price_base int NOT NULL,                  -- solo cabaña, por noche
  price_tinaja int NOT NULL,                -- con tinaja; si es igual a price_base, la tinaja va incluida
  extra_person int NOT NULL DEFAULT 0,      -- por persona sobre la base, por noche
  sort int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Una cabaña para 2 personas a $60.000 (editable desde /admin).
-- Para agregar otra cabaña, copia la fila cambiando id, nombre y sort.
INSERT INTO public.cabins (id, name, base_guests, max_guests, price_base, price_tinaja, extra_person, sort) VALUES
  ('lugar-secreto', 'Cabaña con tinaja', 2, 2, 60000, 60000, 0, 1)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cabin_id text NOT NULL REFERENCES public.cabins(id),
  name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  dates text[] NOT NULL DEFAULT '{}',       -- yyyy-mm-dd, una por noche
  nights int NOT NULL DEFAULT 0,
  guests int NOT NULL DEFAULT 2,
  tinaja boolean NOT NULL DEFAULT false,
  total int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'pagado')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blocked_days (
  cabin_id text NOT NULL REFERENCES public.cabins(id) ON DELETE CASCADE,
  day text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (cabin_id, day)
);

-- Precio especial de "solo cabaña" para un día; la tinaja suma su diferencia normal.
CREATE TABLE IF NOT EXISTS public.offer_days (
  cabin_id text NOT NULL REFERENCES public.cabins(id) ON DELETE CASCADE,
  day text NOT NULL,
  price int NOT NULL CHECK (price > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (cabin_id, day)
);

CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  concept text NOT NULL,
  amount int NOT NULL,
  date text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- 2. Seguridad (RLS) ----------

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
$$;

ALTER TABLE public.cabins       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_days   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses     ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.cabins, public.reservations, public.blocked_days,
  public.offer_days, public.expenses FROM anon;
GRANT SELECT ON public.cabins, public.blocked_days, public.offer_days TO anon;
GRANT INSERT ON public.reservations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cabins, public.reservations,
  public.blocked_days, public.offer_days, public.expenses TO authenticated;
GRANT ALL ON public.cabins, public.reservations, public.blocked_days,
  public.offer_days, public.expenses TO service_role;

DROP POLICY IF EXISTS admin_all ON public.cabins;
DROP POLICY IF EXISTS admin_all ON public.reservations;
DROP POLICY IF EXISTS admin_all ON public.blocked_days;
DROP POLICY IF EXISTS admin_all ON public.offer_days;
DROP POLICY IF EXISTS admin_all ON public.expenses;
DROP POLICY IF EXISTS public_read ON public.cabins;
DROP POLICY IF EXISTS public_read ON public.blocked_days;
DROP POLICY IF EXISTS public_read ON public.offer_days;
DROP POLICY IF EXISTS public_insert ON public.reservations;

CREATE POLICY admin_all ON public.cabins       FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY admin_all ON public.reservations FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY admin_all ON public.blocked_days FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY admin_all ON public.offer_days   FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY admin_all ON public.expenses     FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY public_read ON public.cabins       FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY public_read ON public.blocked_days FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY public_read ON public.offer_days   FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY public_insert ON public.reservations FOR INSERT TO anon, authenticated WITH CHECK (true);

-- ---------- 3. Funciones públicas sin datos personales ----------

-- Noches pagadas de cada cabaña (lo único que el público ve de las reservas).
CREATE OR REPLACE FUNCTION public.public_booked_days()
RETURNS TABLE (cabin_id text, day text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.cabin_id, unnest(r.dates) FROM public.reservations r WHERE r.status = 'pagado'
$$;

-- Consulta de una reserva por su ID (uuid imposible de adivinar).
CREATE OR REPLACE FUNCTION public.lookup_reservation(p_id uuid)
RETURNS SETOF public.reservations
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.reservations WHERE id = p_id
$$;

REVOKE ALL ON FUNCTION public.public_booked_days(), public.lookup_reservation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_booked_days(), public.lookup_reservation(uuid) TO anon, authenticated;

-- ---------- 4. Precio calculado en el servidor ----------

CREATE OR REPLACE FUNCTION public.reservation_total(
  p_cabin text, p_dates text[], p_guests int, p_tinaja boolean
) RETURNS int
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c public.cabins;
  d text;
  p int;
  sum_total int := 0;
BEGIN
  SELECT * INTO c FROM public.cabins WHERE id = p_cabin;
  IF c.id IS NULL THEN RAISE EXCEPTION 'INVALID_CABIN'; END IF;
  FOREACH d IN ARRAY p_dates LOOP
    SELECT price INTO p FROM public.offer_days WHERE cabin_id = p_cabin AND day = d;
    sum_total := sum_total
      + coalesce(p, c.price_base)
      + CASE WHEN p_tinaja THEN c.price_tinaja - c.price_base ELSE 0 END
      + greatest(p_guests - c.base_guests, 0) * c.extra_person;
  END LOOP;
  RETURN sum_total;
END $$;

-- Validación de cada reserva nueva del público.
CREATE OR REPLACE FUNCTION public.validate_new_reservation() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c public.cabins;
  d text;
BEGIN
  -- El admin puede crear reservas manuales sin estas restricciones.
  IF public.is_admin() THEN
    NEW.nights := cardinality(NEW.dates);
    RETURN NEW;
  END IF;

  NEW.name := btrim(NEW.name);
  NEW.email := btrim(NEW.email);
  NEW.phone := btrim(NEW.phone);
  IF length(NEW.name) NOT BETWEEN 2 AND 80 THEN RAISE EXCEPTION 'INVALID_NAME'; END IF;
  IF NEW.email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' OR length(NEW.email) > 120 THEN RAISE EXCEPTION 'INVALID_EMAIL'; END IF;
  IF NEW.phone !~ '^\+?[0-9]{8,15}$' THEN RAISE EXCEPTION 'INVALID_PHONE'; END IF;

  SELECT * INTO c FROM public.cabins WHERE id = NEW.cabin_id;
  IF c.id IS NULL THEN RAISE EXCEPTION 'INVALID_CABIN'; END IF;
  IF NEW.guests < 1 OR NEW.guests > c.max_guests THEN RAISE EXCEPTION 'INVALID_CAPACITY'; END IF;

  IF cardinality(NEW.dates) NOT BETWEEN 1 AND 30 THEN RAISE EXCEPTION 'INVALID_DATES'; END IF;
  IF (SELECT count(DISTINCT x) FROM unnest(NEW.dates) x) <> cardinality(NEW.dates) THEN RAISE EXCEPTION 'INVALID_DATES'; END IF;

  FOREACH d IN ARRAY NEW.dates LOOP
    IF d !~ '^\d{4}-\d{2}-\d{2}$' THEN RAISE EXCEPTION 'INVALID_DATES'; END IF;
    IF d::date < (now() AT TIME ZONE 'America/Santiago')::date THEN RAISE EXCEPTION 'INVALID_DATES'; END IF;
    IF EXISTS (SELECT 1 FROM public.blocked_days WHERE cabin_id = NEW.cabin_id AND day = d)
       OR EXISTS (SELECT 1 FROM public.reservations
                  WHERE cabin_id = NEW.cabin_id AND status = 'pagado' AND d = ANY (dates))
    THEN RAISE EXCEPTION 'DATES_TAKEN'; END IF;
  END LOOP;

  -- Freno anti-spam: máximo 5 reservas pendientes por correo o teléfono.
  IF (SELECT count(*) FROM public.reservations
      WHERE status = 'pendiente' AND (lower(email) = lower(NEW.email) OR phone = NEW.phone)) >= 5
  THEN RAISE EXCEPTION 'TOO_MANY_PENDING'; END IF;

  NEW.nights := cardinality(NEW.dates);
  NEW.total := public.reservation_total(NEW.cabin_id, NEW.dates, NEW.guests, NEW.tinaja);
  NEW.status := 'pendiente';
  NEW.created_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_validate_new_reservation ON public.reservations;
CREATE TRIGGER trg_validate_new_reservation BEFORE INSERT ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.validate_new_reservation();

-- Evita marcar como pagada una reserva cuyas noches ya están pagadas en la misma cabaña.
CREATE OR REPLACE FUNCTION public.prevent_double_paid() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'pagado' AND EXISTS (
    SELECT 1 FROM public.reservations r
    WHERE r.id <> NEW.id AND r.cabin_id = NEW.cabin_id AND r.status = 'pagado' AND r.dates && NEW.dates
  ) THEN
    RAISE EXCEPTION 'DATES_TAKEN';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_prevent_double_paid ON public.reservations;
CREATE TRIGGER trg_prevent_double_paid BEFORE INSERT OR UPDATE OF status, dates, cabin_id ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.prevent_double_paid();

-- ---------- 5. Tiempo real ----------

ALTER TABLE public.cabins       REPLICA IDENTITY FULL;
ALTER TABLE public.reservations REPLICA IDENTITY FULL;
ALTER TABLE public.blocked_days REPLICA IDENTITY FULL;
ALTER TABLE public.offer_days   REPLICA IDENTITY FULL;
ALTER TABLE public.expenses     REPLICA IDENTITY FULL;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['cabins', 'reservations', 'blocked_days', 'offer_days', 'expenses'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                   WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

-- ---------- 6. Usuario administrador ----------
-- DESPUÉS de crear el usuario en Authentication > Users, ejecutar UNA vez
-- (cambiando el correo por el del dueño):
--   UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'
--   WHERE email = 'CORREO_DEL_ADMIN';
