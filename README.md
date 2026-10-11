# Cabañas Nativa Coliumo — Reservas

Web de reservas con calendario por cabaña y panel `/admin`. Basada en el proyecto de Cabaña MH.

## Puesta en marcha
1. Crear un proyecto en Supabase.
2. En **SQL Editor** pegar y ejecutar `supabase/schema.sql`.
3. En **Authentication > Users** crear el usuario del dueño y ejecutar la consulta del final de `schema.sql` para darle rol admin.
4. Configurar en el hosting (Vercel) las variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY`.
5. `npm install` y `npm run dev`.

## Pendientes (datos reales)
- `src/lib/booking.ts`: `OWNER_WHATSAPP` y `ADMIN_EMAIL`.
- Logo real (hoy hay uno provisorio en `src/components/Brand.tsx` y `public/favicon.svg`).
- Términos y condiciones / reglas de la cabaña (`src/routes/index.tsx`).
- Fotos y textos para la landing.
