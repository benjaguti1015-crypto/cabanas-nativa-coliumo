export const CHECK_IN = "16:00";
export const CHECK_OUT = "14:00";

/**
 * Datos del negocio.
 * PENDIENTE: completar con los datos reales del dueño antes de publicar.
 */
export const OWNER_WHATSAPP = ""; // formato internacional sin +, ej: 56912345678
export const ADMIN_EMAIL = ""; // correo de contacto y del administrador
export const BUSINESS_NAME = "Cabañas Nativa Coliumo";
export const INSTAGRAM = "cabanasnativacoliumo";

export type CabinId = "chica" | "grande";

export type Cabin = {
  id: CabinId;
  name: string;
  baseGuests: number; // personas incluidas en el precio
  maxGuests: number;
  priceBase: number; // solo cabaña, por noche
  priceTinaja: number; // con tinaja, por noche
  extraPerson: number; // por persona sobre la base, por noche
};

/** Tarifas por defecto (las reales se leen de Supabase y se editan en /admin). */
export const DEFAULT_CABINS: Cabin[] = [
  {
    id: "chica",
    name: "Cabaña 2 a 3 personas",
    baseGuests: 2,
    maxGuests: 3,
    priceBase: 60000,
    priceTinaja: 80000,
    extraPerson: 10000,
  },
  {
    id: "grande",
    name: "Cabaña 4 a 6 personas",
    baseGuests: 4,
    maxGuests: 6,
    priceBase: 80000,
    priceTinaja: 100000,
    extraPerson: 10000,
  },
];

export type Reservation = {
  id: string;
  cabinId: CabinId;
  name: string;
  phone: string;
  email: string;
  dates: string[]; // yyyy-mm-dd
  nights: number;
  guests: number;
  tinaja: boolean;
  total: number;
  createdAt: string;
  status: "pendiente" | "pagado"; // solo las pagadas bloquean el calendario
};

export type Expense = {
  id: string;
  concept: string;
  amount: number;
  date: string; // yyyy-mm-dd
};

/** Ofertas por cabaña: { chica: { "2026-10-20": 50000 } } */
export type Offers = Record<CabinId, Record<string, number>>;
export type DaysByCabin = Record<CabinId, string[]>;

export const cabinById = (cabins: Cabin[], id: CabinId) =>
  cabins.find((c) => c.id === id) ?? DEFAULT_CABINS.find((c) => c.id === id)!;

export const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const parseKey = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
};

/** Precio "solo cabaña" de la noche: oferta del día o tarifa base. */
export const basePriceForDay = (day: string, cabin: Cabin, offers: Record<string, number> = {}) =>
  offers[day] ?? cabin.priceBase;

export const tinajaExtra = (cabin: Cabin) => Math.max(0, cabin.priceTinaja - cabin.priceBase);

export const extraGuests = (cabin: Cabin, guests: number) => Math.max(0, guests - cabin.baseGuests);

/** Precio total de una noche (misma fórmula que reservation_total en Supabase). */
export const priceForNight = (
  day: string,
  cabin: Cabin,
  guests: number,
  tinaja: boolean,
  offers: Record<string, number> = {},
) =>
  basePriceForDay(day, cabin, offers) +
  (tinaja ? tinajaExtra(cabin) : 0) +
  extraGuests(cabin, guests) * cabin.extraPerson;

export const totalForStay = (
  days: string[],
  cabin: Cabin,
  guests: number,
  tinaja: boolean,
  offers: Record<string, number> = {},
) => days.reduce((sum, d) => sum + priceForNight(d, cabin, guests, tinaja, offers), 0);

/** Rango del período actual: semana (lunes a domingo) o mes en curso. */
export const periodRange = (period: "week" | "month", ref: Date = new Date()) => {
  if (period === "month") {
    const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
    return { start: toKey(start), end: toKey(end) };
  }
  const offset = (ref.getDay() + 6) % 7;
  const start = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - offset);
  const end = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - offset + 6);
  return { start: toKey(start), end: toKey(end) };
};

export const inRange = (day: string, range: { start: string; end: string }) =>
  day >= range.start && day <= range.end;

/** Ingresos del período: reparte el total de cada reserva pagada entre sus noches. */
export const incomeInRange = (list: Reservation[], range: { start: string; end: string }) =>
  list
    .filter((r) => r.status === "pagado")
    .reduce(
      (sum, r) =>
        sum + r.dates.filter((d) => inRange(d, range)).length * (r.total / (r.nights || 1)),
      0,
    );

export const expensesInRange = (list: Expense[], range: { start: string; end: string }) =>
  list.filter((e) => inRange(e.date, range)).reduce((s, e) => s + e.amount, 0);

export const formatCLP = (n: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);

export const formatDay = (key: string) =>
  parseKey(key).toLocaleDateString("es-CL", { day: "2-digit", month: "short" });

export const formatDayLong = (key: string) =>
  parseKey(key).toLocaleDateString("es-CL", { weekday: "short", day: "2-digit", month: "short" });

export const whatsappLink = (phone: string, text: string) =>
  `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`;
