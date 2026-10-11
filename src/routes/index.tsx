import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bath,
  Clock,
  Home,
  Info,
  LogIn,
  LogOut,
  Mail,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  User,
  Users,
  Wifi,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { BookingCalendar } from "@/components/BookingCalendar";
import { Brand, Divider, StatusBadge } from "@/components/Brand";
import { createReservation, lookupReservation, useCabinData } from "@/lib/cloud";
import {
  ADMIN_EMAIL,
  BUSINESS_NAME,
  CHECK_IN,
  CHECK_OUT,
  OWNER_WHATSAPP,
  basePriceForDay,
  cabinById,
  extraGuests,
  formatCLP,
  formatDay,
  tinajaExtra,
  totalForStay,
  whatsappLink,
  type Cabin,
  type CabinId,
  type Reservation,
} from "@/lib/booking";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cabañas Nativa Coliumo — Reserva tu estadía" },
      {
        name: "description",
        content:
          "Reserva online en Cabañas Nativa Coliumo: cabañas para 2 a 3 y 4 a 6 personas, solo cabaña o con tinaja. Disponibilidad en tiempo real.",
      },
      { property: "og:title", content: "Cabañas Nativa Coliumo — Reserva tu estadía" },
      {
        property: "og:description",
        content: "Elige tu cabaña, tus noches y si quieres tinaja. Desde $60.000 la noche.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ClientView,
});

const LAST_ID_KEY = "nativa_last_booking_id";

function ClientView() {
  const { data, loading } = useCabinData();
  const [cabinId, setCabinId] = useState<CabinId>("chica");
  const [tinaja, setTinaja] = useState(false);
  const [guests, setGuests] = useState(2);
  const [selected, setSelected] = useState<string[]>([]);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [lastBookingId, setLastBookingId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(LAST_ID_KEY);
    } catch {
      return null;
    }
  });

  const [showLookupModal, setShowLookupModal] = useState(false);
  const [lookupIdInput, setLookupIdInput] = useState("");
  const [searchedReservation, setSearchedReservation] = useState<Reservation | null>(null);

  const cabin = cabinById(data.cabins, cabinId);
  const offers = data.offers[cabinId];
  const occupied = useMemo(
    () => [...data.booked[cabinId], ...data.blocked[cabinId]],
    [data.booked, data.blocked, cabinId],
  );

  const nights = selected.length;
  const total = useMemo(
    () => totalForStay(selected, cabin, guests, tinaja, offers),
    [selected, cabin, guests, tinaja, offers],
  );
  const extras = extraGuests(cabin, guests);

  const chooseCabin = (id: CabinId) => {
    if (id === cabinId) return;
    const next = cabinById(data.cabins, id);
    setCabinId(id);
    setSelected([]); // cada cabaña tiene su propia disponibilidad
    setGuests(next.baseGuests);
  };

  /** Cada noche se elige por separado. */
  const toggle = (day: string) => {
    setSelected((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    );
  };

  const confirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;

    if (!nights) {
      toast.error("Selecciona al menos una noche.");
      return;
    }
    if (guests < 1 || guests > cabin.maxGuests) {
      toast.error(`Esta cabaña recibe máximo ${cabin.maxGuests} personas.`);
      return;
    }
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim()) {
      toast.error("Completa todos los campos.");
      return;
    }
    const rawPhone = form.phone.trim().replace(/[^0-9]/g, "");
    if (rawPhone.length < 8) {
      toast.error("Teléfono no válido.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Correo no válido.");
      return;
    }
    if (!acceptTerms || !acceptPrivacy) {
      toast.error("Debes aceptar los términos y la política de privacidad.");
      return;
    }

    setSending(true);
    const dates = [...selected].sort();
    const result = await createReservation({
      cabinId,
      name: form.name.trim(),
      phone: `+56${rawPhone}`,
      email: form.email.trim(),
      dates,
      guests,
      tinaja,
      total,
    });
    setSending(false);

    if (result.error === "conflict") {
      setSelected([]);
      toast.error("Alguien acaba de tomar esas noches. El calendario ya se actualizó.");
      return;
    }
    if (result.error === "spam") {
      toast.error("Tienes varias reservas pendientes. Escríbenos por WhatsApp para continuar.");
      return;
    }
    if (result.error || !result.id) {
      toast.error("No pudimos guardar la reserva. Intenta de nuevo.");
      return;
    }

    setLastBookingId(result.id);
    try {
      localStorage.setItem(LAST_ID_KEY, result.id);
    } catch {
      // sin almacenamiento local: el ID igual se muestra en pantalla
    }

    setSelected([]);
    setForm({ name: "", phone: "", email: "" });
    setAcceptTerms(false);
    setAcceptPrivacy(false);
    setDone(true);
    toast.success("¡Reserva solicitada! Guarda tu ID de reserva.");
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const queryId = (lookupIdInput || lastBookingId || "").trim();
    const found = /^[0-9a-f-]{36}$/i.test(queryId) ? await lookupReservation(queryId) : null;
    setSearchedReservation(found);
    if (found) toast.success("¡Reserva encontrada!");
    else toast.error("No se encontró ninguna reserva con ese ID.");
  };

  const bookingMessage = (id: string | null) =>
    `Hola, acabo de solicitar una reserva en ${BUSINESS_NAME} (ID: ${id ?? "N/A"}). ¡Quedo atento!`;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <Brand />
          <button
            onClick={() => setShowLookupModal(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground shadow-sm transition-all hover:bg-accent"
          >
            <Search className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">Consultar mi reserva</span>
            <span className="sm:hidden">Mi reserva</span>
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-5 sm:py-10">
        <section className="mb-8 text-center sm:mb-10">
          <h1 className="text-hero text-4xl sm:text-5xl">Reserva tu estadía</h1>
          <p className="text-script mt-2 text-4xl sm:text-5xl">en Coliumo</p>
          <Divider />
          <p className="mx-auto max-w-xl text-sm text-muted-foreground sm:text-base">
            Elige tu cabaña, marca las noches disponibles y confirma en menos de un minuto.
          </p>
          <p className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Wifi className="h-3.5 w-3.5 shrink-0 text-primary" />
            {loading ? "Cargando disponibilidad…" : "Disponibilidad sincronizada en tiempo real"}
          </p>

          <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
            <InfoCard
              icon={<LogIn className="h-4 w-4" />}
              label="Check-in"
              value={`${CHECK_IN} hrs`}
            />
            <InfoCard
              icon={<LogOut className="h-4 w-4" />}
              label="Check-out"
              value={`${CHECK_OUT} hrs`}
            />
            <InfoCard
              icon={<Clock className="h-4 w-4" />}
              label="Desde"
              value={formatCLP(Math.min(...data.cabins.map((c) => c.priceBase)))}
              hint="por noche"
            />
          </div>
        </section>

        {/* 1. Elegir cabaña */}
        <section className="mb-6">
          <StepTitle n={1} title="Elige tu cabaña" />
          <div className="grid gap-3 sm:grid-cols-2">
            {data.cabins.map((c) => (
              <CabinCard
                key={c.id}
                cabin={c}
                active={c.id === cabinId}
                onClick={() => chooseCabin(c.id)}
              />
            ))}
          </div>
          <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            Valores por noche. Cada persona adicional sobre la capacidad base suma{" "}
            {formatCLP(cabin.extraPerson)} por noche.
          </p>
        </section>

        {/* 2. Modalidad */}
        <section className="mb-8">
          <StepTitle n={2} title="¿Con o sin tinaja?" />
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-card p-1.5 shadow-soft sm:max-w-md">
            {(
              [
                [false, "Solo cabaña", cabin.priceBase, <Home key="h" className="h-4 w-4" />],
                [true, "Con tinaja", cabin.priceTinaja, <Bath key="b" className="h-4 w-4" />],
              ] as const
            ).map(([value, label, price, icon]) => (
              <button
                key={label}
                type="button"
                onClick={() => setTinaja(value)}
                aria-pressed={tinaja === value}
                className={[
                  "flex flex-col items-center gap-0.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all active:scale-[0.98]",
                  tinaja === value
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                ].join(" ")}
              >
                <span className="flex items-center gap-1.5">
                  {icon} {label}
                </span>
                <span className="text-xs font-normal opacity-90">{formatCLP(price)} / noche</span>
              </button>
            ))}
          </div>
        </section>

        {/* 3. Calendario + datos */}
        <StepTitle n={3} title="Elige tus noches y completa tus datos" />
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="mb-2 text-xs text-muted-foreground">
              Calendario de: <strong className="text-foreground">{cabin.name}</strong>
            </p>
            <BookingCalendar
              occupied={occupied}
              selected={selected}
              onSelect={toggle}
              offers={offers}
            />
          </div>

          <form
            onSubmit={confirm}
            className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-6"
          >
            <h2 className="text-hero text-2xl">Tus datos</h2>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-input bg-background px-4 py-3">
              <span className="flex min-w-0 items-center gap-2 text-sm">
                <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0">
                  Personas
                  <span className="block text-[11px] text-muted-foreground">
                    Máximo {cabin.maxGuests} · base {cabin.baseGuests}
                  </span>
                </span>
              </span>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  aria-label="Quitar persona"
                  disabled={guests <= 1}
                  onClick={() => setGuests((g) => Math.max(1, g - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border transition-colors hover:bg-accent disabled:opacity-40"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-6 text-center font-semibold tabular-nums">{guests}</span>
                <button
                  type="button"
                  aria-label="Agregar persona"
                  disabled={guests >= cabin.maxGuests}
                  onClick={() => setGuests((g) => Math.min(cabin.maxGuests, g + 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border transition-colors hover:bg-accent disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-3 space-y-3">
              <Field
                icon={<User className="h-4 w-4" />}
                placeholder="Nombre y apellido"
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
              />
              <div>
                <label className="flex items-center gap-3 rounded-xl border border-input bg-background px-4 py-3 focus-within:ring-2 focus-within:ring-ring">
                  <span className="shrink-0 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                  </span>
                  <span className="select-none text-sm font-medium text-muted-foreground">+56</span>
                  <input
                    required
                    type="tel"
                    inputMode="numeric"
                    placeholder="912345678"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value.replace(/[^0-9]/g, "") })
                    }
                    className="w-full min-w-0 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground sm:text-sm"
                  />
                </label>
                <p className="mt-1 pl-1 text-[11px] text-muted-foreground">
                  Ingresa tu número sin el +56 (ej: 912345678)
                </p>
              </div>
              <Field
                icon={<Mail className="h-4 w-4" />}
                placeholder="Correo electrónico"
                type="email"
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
              />
            </div>

            {/* PENDIENTE: reemplazar por las reglas reales de Cabañas Nativa */}
            <div className="mt-4 rounded-xl border border-border bg-background p-4 text-sm">
              <p className="mb-2 font-medium">Términos y condiciones de la estadía</p>
              <p className="text-xs text-muted-foreground">
                Check-in {CHECK_IN} hrs · Check-out {CHECK_OUT} hrs. La reserva queda confirmada al
                recibir el pago. Las condiciones de cancelación y reglas de la cabaña se informan al
                confirmar.
              </p>
              <div className="mt-3 space-y-2 border-t border-border pt-3">
                <label className="flex cursor-pointer items-center gap-2 font-medium">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  <span>Acepto los términos y condiciones</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 font-medium">
                  <input
                    type="checkbox"
                    checked={acceptPrivacy}
                    onChange={(e) => setAcceptPrivacy(e.target.checked)}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  <span>
                    He leído y acepto la{" "}
                    <a href="#politica-privacidad" className="text-primary underline">
                      Política de Privacidad
                    </a>
                  </span>
                </label>
              </div>
            </div>

            {/* Resumen */}
            <div className="mt-6 rounded-xl bg-secondary p-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>
                  {cabin.name} · {tinaja ? "con tinaja" : "solo cabaña"}
                </span>
                <span className="shrink-0">{nights} noche(s)</span>
              </div>
              {nights > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {selected.map((d) => {
                    const base = basePriceForDay(d, cabin, offers);
                    const isOffer = base < cabin.priceBase;
                    return (
                      <li key={d} className="flex justify-between gap-2">
                        <span className="min-w-0 truncate">{formatDay(d)}</span>
                        <span className={isOffer ? "shrink-0 text-terracotta" : "shrink-0"}>
                          {formatCLP(base + (tinaja ? tinajaExtra(cabin) : 0))}
                          {isOffer ? " · oferta" : ""}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
              {extras > 0 && nights > 0 && (
                <div className="mt-2 flex justify-between gap-2 text-xs text-terracotta">
                  <span>
                    {extras} persona(s) adicional(es) × {nights} noche(s)
                  </span>
                  <span className="shrink-0">{formatCLP(extras * cabin.extraPerson * nights)}</span>
                </div>
              )}
              <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-border pt-3">
                <span className="font-medium">Total</span>
                <span className="text-hero shrink-0 text-3xl">{formatCLP(total)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground transition-all hover:shadow-lift active:scale-[0.99] disabled:opacity-60"
            >
              <MessageCircle className="h-4 w-4" />
              {sending ? "Guardando…" : "Confirmar reserva"}
            </button>

            {done && (
              <div className="mt-4 space-y-3 rounded-xl border border-primary/40 bg-secondary p-4 text-center">
                <p className="text-sm font-medium">¡Reserva solicitada con éxito!</p>
                {lastBookingId && (
                  <div className="rounded-lg border border-border bg-background p-2.5 text-xs">
                    <span className="text-muted-foreground">Tu ID de reserva es:</span>
                    <p className="mt-0.5 break-all font-mono text-sm font-bold text-primary">
                      {lastBookingId}
                    </p>
                  </div>
                )}
                {OWNER_WHATSAPP && (
                  <a
                    href={whatsappLink(OWNER_WHATSAPP, bookingMessage(lastBookingId))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-xs font-medium text-[#0b3d1f] transition-opacity hover:opacity-90"
                  >
                    <MessageCircle className="h-4 w-4" /> Avisar por WhatsApp para coordinar el pago
                  </a>
                )}
                <p className="text-xs font-medium text-terracotta">
                  Mientras no se confirme el pago, las noches siguen disponibles para otros.
                </p>
              </div>
            )}
          </form>
        </div>

        {showLookupModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-hero flex items-center gap-2 text-xl">
                  <Search className="h-5 w-5 text-primary" /> Consultar reserva
                </h3>
                <button
                  aria-label="Cerrar"
                  onClick={() => {
                    setShowLookupModal(false);
                    setSearchedReservation(null);
                    setLookupIdInput("");
                  }}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Ingresa el ID de tu reserva para ver su estado, fechas y detalles.
              </p>
              <form onSubmit={handleLookup} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej: f47ac10b-58cc..."
                  value={lookupIdInput || (lastBookingId ?? "")}
                  onChange={(e) => setLookupIdInput(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 font-mono text-xs outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground hover:shadow-lift"
                >
                  Buscar
                </button>
              </form>

              {searchedReservation && (
                <div className="space-y-3 rounded-xl border border-border bg-secondary p-4 text-xs">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <span className="text-sm font-semibold">{searchedReservation.name}</span>
                    <StatusBadge status={searchedReservation.status} />
                  </div>
                  <div className="space-y-1.5 text-muted-foreground">
                    <p>
                      <strong>Cabaña:</strong>{" "}
                      {cabinById(data.cabins, searchedReservation.cabinId).name} ·{" "}
                      {searchedReservation.tinaja ? "con tinaja" : "solo cabaña"}
                    </p>
                    <p>
                      <strong>Personas:</strong> {searchedReservation.guests}
                    </p>
                    <p>
                      <strong>Fechas:</strong>{" "}
                      <span className="font-bold text-foreground">
                        {searchedReservation.dates.map(formatDay).join(" · ")}
                      </span>
                    </p>
                    <p>
                      <strong>Total:</strong>{" "}
                      <span className="font-bold text-foreground">
                        {formatCLP(searchedReservation.total)}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <section
          id="politica-privacidad"
          className="mt-16 scroll-mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8"
        >
          <h2 className="text-hero mb-4 flex items-center gap-2 text-2xl">
            <ShieldCheck className="h-6 w-6 text-primary" /> Política de Privacidad
          </h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              Solo pedimos los datos necesarios para gestionar tu reserva: nombre, teléfono y correo
              electrónico. Los usamos para coordinar y confirmar tu estadía y contactarte si hay
              cambios. Nunca se venden ni se comparten con terceros.
            </p>
            <p>
              Tus datos se guardan en una base de datos protegida, con acceso solo para la
              administración. Puedes pedir en cualquier momento ver, corregir o eliminar tus datos
              {ADMIN_EMAIL ? (
                <>
                  {" "}
                  escribiendo a <strong className="text-foreground">{ADMIN_EMAIL}</strong>
                </>
              ) : (
                " escribiéndonos por WhatsApp"
              )}
              .
            </p>
            <p>Al enviar el formulario de reserva aceptas esta política.</p>
          </div>
        </section>
      </main>

      <footer className="mt-16 border-t border-border bg-card/50 px-4 py-8 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-5xl space-y-2">
          <p className="text-script text-3xl">¡Nos vemos pronto!</p>
          <p className="font-medium text-foreground">
            {BUSINESS_NAME} · © {new Date().getFullYear()}
          </p>
          <p>
            Check-in <strong className="text-foreground">{CHECK_IN} hrs</strong> · Check-out{" "}
            <strong className="text-foreground">{CHECK_OUT} hrs</strong>
          </p>
        </div>
      </footer>
    </div>
  );
}

function StepTitle({ n, title }: { n: number; title: string }) {
  return (
    <h2 className="text-hero mb-3 flex items-center gap-3 text-2xl">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-terracotta font-sans text-sm font-bold text-card">
        {n}
      </span>
      {title}
    </h2>
  );
}

function CabinCard({
  cabin,
  active,
  onClick,
}: {
  cabin: Cabin;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "rounded-2xl border p-4 text-left shadow-soft transition-all active:scale-[0.99] sm:p-5",
        active
          ? "border-primary bg-card ring-2 ring-primary/40"
          : "border-border bg-card/70 hover:bg-card",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-hero text-2xl leading-tight">{cabin.name}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5 shrink-0" /> {cabin.baseGuests} a {cabin.maxGuests}{" "}
            personas
          </p>
        </div>
        <span
          className={[
            "mt-1 h-5 w-5 shrink-0 rounded-full border-2",
            active
              ? "border-primary bg-primary shadow-[inset_0_0_0_3px_var(--card)]"
              : "border-border",
          ].join(" ")}
        />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-secondary px-3 py-2">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Solo cabaña</p>
          <p className="font-semibold">{formatCLP(cabin.priceBase)}</p>
        </div>
        <div className="rounded-xl bg-secondary px-3 py-2">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Con tinaja</p>
          <p className="font-semibold">{formatCLP(cabin.priceTinaja)}</p>
        </div>
      </div>
    </button>
  );
}

function InfoCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        {icon} {label}
      </div>
      <p className="text-hero mt-2 text-2xl">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Field({
  icon,
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-input bg-background px-4 py-3 focus-within:ring-2 focus-within:ring-ring">
      <span className="shrink-0 text-muted-foreground">{icon}</span>
      <input
        required
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground sm:text-sm"
      />
    </label>
  );
}
