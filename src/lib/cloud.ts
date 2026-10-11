import { useCallback, useEffect, useRef, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_CABINS,
  type Cabin,
  type CabinId,
  type DaysByCabin,
  type Expense,
  type Offers,
  type Reservation,
} from "@/lib/booking";

export type CabinData = {
  cabins: Cabin[];
  reservations: Reservation[]; // solo el admin las recibe (RLS)
  booked: DaysByCabin; // noches pagadas, visibles para todos
  blocked: DaysByCabin;
  offers: Offers;
  expenses: Expense[];
};

const emptyDays = (): DaysByCabin => ({ chica: [], grande: [] });

const EMPTY: CabinData = {
  cabins: DEFAULT_CABINS,
  reservations: [],
  booked: emptyDays(),
  blocked: emptyDays(),
  offers: { chica: {}, grande: {} },
  expenses: [],
};

type CabinRow = {
  id: CabinId;
  name: string;
  base_guests: number;
  max_guests: number;
  price_base: number;
  price_tinaja: number;
  extra_person: number;
};

type ReservationRow = {
  id: string;
  cabin_id: CabinId;
  name: string;
  phone: string;
  email: string;
  dates: string[] | null;
  nights: number;
  guests: number;
  tinaja: boolean;
  total: number;
  created_at: string;
  status: "pendiente" | "pagado" | null;
};

const toReservation = (r: ReservationRow): Reservation => ({
  id: r.id,
  cabinId: r.cabin_id,
  name: r.name,
  phone: r.phone,
  email: r.email,
  dates: [...(r.dates ?? [])].sort(),
  nights: r.nights,
  guests: r.guests,
  tinaja: r.tinaja,
  total: r.total,
  createdAt: r.created_at,
  status: r.status ?? "pendiente",
});

const groupDays = (rows: { cabin_id: CabinId; day: string }[]) => {
  const out = emptyDays();
  rows.forEach((r) => out[r.cabin_id]?.push(r.day));
  out.chica.sort();
  out.grande.sort();
  return out;
};

// El cliente generado no conoce estas tablas hasta regenerar types.ts.
const db = supabase as any;

export async function fetchCabinData(): Promise<CabinData> {
  const [cab, res, bkd, blk, off, exp] = await Promise.all([
    db.from("cabins").select("*").order("sort", { ascending: true }),
    db.from("reservations").select("*").order("created_at", { ascending: true }),
    db.rpc("public_booked_days"),
    db.from("blocked_days").select("cabin_id, day"),
    db.from("offer_days").select("cabin_id, day, price"),
    db.from("expenses").select("*").order("created_at", { ascending: true }),
  ]);

  const cabinRows = (cab.data ?? []) as CabinRow[];
  const cabins: Cabin[] = cabinRows.length
    ? cabinRows.map((c) => ({
        id: c.id,
        name: c.name,
        baseGuests: c.base_guests,
        maxGuests: c.max_guests,
        priceBase: c.price_base,
        priceTinaja: c.price_tinaja,
        extraPerson: c.extra_person,
      }))
    : DEFAULT_CABINS;

  const offers: Offers = { chica: {}, grande: {} };
  ((off.data ?? []) as { cabin_id: CabinId; day: string; price: number }[]).forEach((o) => {
    if (offers[o.cabin_id]) offers[o.cabin_id][o.day] = o.price;
  });

  return {
    cabins,
    reservations: ((res.data ?? []) as ReservationRow[]).map(toReservation),
    booked: groupDays((bkd.data ?? []) as { cabin_id: CabinId; day: string }[]),
    blocked: groupDays((blk.data ?? []) as { cabin_id: CabinId; day: string }[]),
    offers,
    expenses: ((exp.data ?? []) as Expense[]).map((e) => ({
      id: e.id,
      concept: e.concept,
      amount: e.amount,
      date: e.date,
    })),
  };
}

/** Datos sincronizados en tiempo real entre todos los dispositivos. */
export function useCabinData() {
  const [data, setData] = useState<CabinData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reload = useCallback(async () => {
    const next = await fetchCabinData();
    setData(next);
    setLoading(false);
    return next;
  }, []);

  useEffect(() => {
    let alive = true;
    void fetchCabinData().then((next) => {
      if (!alive) return;
      setData(next);
      setLoading(false);
    });

    const schedule = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void fetchCabinData().then((next) => {
          if (alive) setData(next);
        });
      }, 120);
    };

    const channel = supabase.channel("nativa-sync");
    ["cabins", "reservations", "blocked_days", "offer_days", "expenses"].forEach((table) => {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, schedule);
    });
    channel.subscribe();

    const onFocus = () => schedule();
    window.addEventListener("focus", onFocus);

    return () => {
      alive = false;
      if (timer.current) clearTimeout(timer.current);
      window.removeEventListener("focus", onFocus);
      void supabase.removeChannel(channel);
    };
  }, []);

  return { data, loading, reload };
}

/* ------------------------- Mutaciones ------------------------- */

export async function createReservation(input: {
  cabinId: CabinId;
  name: string;
  phone: string;
  email: string;
  dates: string[];
  guests: number;
  tinaja: boolean;
  total: number;
}) {
  // El visitante no puede leer la tabla, así que el ID se genera aquí.
  const id = crypto.randomUUID();
  const { error } = await db.from("reservations").insert({
    id,
    cabin_id: input.cabinId,
    name: input.name,
    phone: input.phone,
    email: input.email,
    dates: input.dates,
    nights: input.dates.length,
    guests: input.guests,
    tinaja: input.tinaja,
    total: input.total, // el servidor lo recalcula
    status: "pendiente",
  });

  if (error) {
    console.error("Error al crear reserva:", error);
    const msg = String(error.message);
    if (msg.includes("DATES_TAKEN")) return { error: "conflict" as const };
    if (msg.includes("TOO_MANY_PENDING")) return { error: "spam" as const };
    return { error: "failed" as const };
  }
  return { id };
}

/** Busca una reserva por su ID (función pública que solo devuelve esa fila). */
export async function lookupReservation(id: string): Promise<Reservation | null> {
  const { data, error } = await db.rpc("lookup_reservation", { p_id: id });
  const r = (data as ReservationRow[] | null)?.[0];
  if (error || !r) return null;
  return toReservation(r);
}

export async function updateReservationDates(id: string, dates: string[], total: number) {
  const { error } = await db
    .from("reservations")
    .update({ dates, nights: dates.length, total })
    .eq("id", id);
  return !error;
}

export async function updateReservationStatus(id: string, status: "pendiente" | "pagado") {
  const { error } = await db.from("reservations").update({ status }).eq("id", id);
  if (error) console.error("Error al actualizar estado:", error);
  return { ok: !error, conflict: String(error?.message ?? "").includes("DATES_TAKEN") };
}

export async function deleteReservation(id: string) {
  const { error } = await db.from("reservations").delete().eq("id", id);
  if (error) console.error("Error al eliminar reserva:", error);
  return !error;
}

export async function setBlockedDays(cabinId: CabinId, days: string[], block: boolean) {
  if (!days.length) return true;
  const { error } = block
    ? await db.from("blocked_days").upsert(
        days.map((day) => ({ cabin_id: cabinId, day })),
        { onConflict: "cabin_id,day" },
      )
    : await db.from("blocked_days").delete().eq("cabin_id", cabinId).in("day", days);
  return !error;
}

export async function setOfferDays(cabinId: CabinId, days: string[], price: number) {
  const { error } = await db.from("offer_days").upsert(
    days.map((day) => ({ cabin_id: cabinId, day, price: Math.max(1, Math.round(price)) })),
    { onConflict: "cabin_id,day" },
  );
  return !error;
}

export async function removeOfferDays(cabinId: CabinId, days: string[]) {
  const { error } = await db.from("offer_days").delete().eq("cabin_id", cabinId).in("day", days);
  return !error;
}

export async function saveCabin(cabin: Cabin) {
  const { error } = await db
    .from("cabins")
    .update({
      name: cabin.name,
      base_guests: cabin.baseGuests,
      max_guests: cabin.maxGuests,
      price_base: cabin.priceBase,
      price_tinaja: cabin.priceTinaja,
      extra_person: cabin.extraPerson,
      updated_at: new Date().toISOString(),
    })
    .eq("id", cabin.id);
  return !error;
}

export async function addExpense(concept: string, amount: number, date: string) {
  const { error } = await db.from("expenses").insert({ concept, amount, date });
  return !error;
}

export async function removeExpense(id: string) {
  const { error } = await db.from("expenses").delete().eq("id", id);
  return !error;
}

/** Diagnóstico simple de la conexión con la nube para el panel. */
export async function checkCloudStatus() {
  const started = Date.now();
  const { error } = await db.from("cabins").select("id").limit(1);
  return { ok: !error, ms: Date.now() - started, message: error?.message ?? "Conexión correcta" };
}
