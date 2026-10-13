# Lugar Secreto Hualqui — Web y reservas

Landing (`/`), reservas con calendario (`/reservar`) y panel del dueño (`/admin`).

## Puesta en marcha
1. Crear un proyecto en Supabase.
2. En **SQL Editor** pegar y ejecutar `supabase/schema.sql`.
3. En **Authentication > Users** crear el usuario del dueño y ejecutar la consulta del final de `schema.sql` para darle rol admin.
4. En Vercel, importar este repo y agregar las variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY`.
5. Local: `npm install` y `npm run dev`.

## Datos del negocio
Están en `src/lib/booking.ts` (teléfono, Instagram, horarios). Precio y capacidad se editan desde `/admin`.

## Pendientes por confirmar con los dueños
- Horarios de check-in y check-out (hoy 16:00 / 14:00).
- Si el fono +56 9 4003 7495 recibe WhatsApp.
- Cantidad de cabañas, y si tinaja, sauna y piscina tienen costo extra.
- Reglas de la estadía, condiciones de cancelación y correo de contacto.
