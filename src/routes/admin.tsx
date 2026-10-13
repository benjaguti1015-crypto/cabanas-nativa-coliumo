import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity,
  CalendarDays,
  Check,
  Lock,
  LogOut,
  Mail,
  MessageCircle,
  Pencil,
  Plus,
  Tag,
  Trash2,
  TrendingUp,
  Wifi,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { BookingCalendar } from "@/components/BookingCalendar";
import { Logo } from "@/components/Brand";
import { ReservationsPanel } from "@/components/ReservationsPanel";
import {
  addExpense,
  checkCloudStatus,
  deleteReservation,
  removeExpense,
  removeOfferDays,
  saveCabin,
  setBlockedDays,
  setOfferDays,
  updateReservationDates,
  useCabinData,
  type CabinData,
} from "@/lib/cloud";
import {
  ADMIN_EMAIL,
  BUSINESS_NAME,
  CHECK_IN,
  CHECK_OUT,
  OWNER_WHATSAPP,
  cabinById,
  expensesInRange,
  formatCLP,
  formatDay,
  formatDayLong,
  incomeInRange,
  periodRange,
  toKey,
  totalForStay,
  type Cabin,
  type CabinId,
  type Expense,
  type Reservation,
} from "@/lib/booking";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Panel de administración — Lugar Secreto" },
      { name: "description", content: "Gestiona reservas y disponibilidad de las cabañas." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminView,
});

function AdminView() {
  const [logged, setLogged] = useState(false);
  useEffect(() => {
    const check = (session: Session | null) =>
      setLogged(session?.user.app_metadata["role"] === "admin");
    void supabase.auth.getSession().then(({ data }) => check(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => check(session));
    return () => data.subscription.unsubscribe();
  }, []);
  return logged ? <Dashboard onLogout={() => setLogged(false)} /> : <Login />;
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error || data.user?.app_metadata["role"] !== "admin") {
      if (!error) await supabase.auth.signOut();
      toast.error("Credenciales incorrectas.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8"
      >
        <Logo className="mx-auto h-16 w-auto" />
        <h1 className="mt-4 text-center text-hero text-2xl">Acceso administrador</h1>
        <p className="mt-1 text-center text-xs text-muted-foreground">{BUSINESS_NAME}</p>

        <div className="mt-6 space-y-3">
          <input
            type="email"
            required
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm text-foreground"
          />
          <input
            type="password"
            required
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm text-foreground"
          />
        </div>

        <button
          type="submit"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground transition-all hover:shadow-lift"
        >
          <Lock className="h-4 w-4" /> Ingresar
        </button>

        <Link
          to="/"
          className="mt-4 block text-center text-xs text-muted-foreground hover:underline"
        >
          Volver al sitio
        </Link>
      </form>
    </div>
  );
}

const PRICE_FIELDS: [keyof Cabin, string][] = [
  ["priceBase", "Precio por noche"],
  ["priceTinaja", "Con tinaja (igual = incluida)"],
  ["extraPerson", "Persona adicional"],
  ["baseGuests", "Personas incluidas"],
  ["maxGuests", "Capacidad máxima"],
];

function RatesForm({ cabin, reload }: { cabin: Cabin; reload: () => Promise<unknown> }) {
  const [values, setValues] = useState<Record<string, string>>({});
  useEffect(() => {
    setValues(Object.fromEntries(PRICE_FIELDS.map(([k]) => [k, String(cabin[k])])));
  }, [cabin]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const nums = Object.fromEntries(PRICE_FIELDS.map(([k]) => [k, Math.round(Number(values[k]))]));
    // La persona adicional puede valer 0; el resto debe ser mayor a cero.
    if (
      PRICE_FIELDS.some(
        ([k]) => !Number.isFinite(nums[k]) || nums[k]! < (k === "extraPerson" ? 0 : 1),
      )
    ) {
      toast.error("Revisa los valores: deben ser números mayores a cero.");
      return;
    }
    if (nums["priceTinaja"]! < nums["priceBase"]!) {
      toast.error("El precio con tinaja no puede ser menor que el precio por noche.");
      return;
    }
    if (nums["baseGuests"]! > nums["maxGuests"]!) {
      toast.error("Las personas incluidas no pueden superar la capacidad máxima.");
      return;
    }
    const ok = await saveCabin({ ...cabin, ...nums } as Cabin);
    if (!ok) {
      toast.error("No pudimos guardar las tarifas.");
      return;
    }
    await reload();
    toast.success(`Tarifas de "${cabin.name}" actualizadas.`);
  };

  return (
    <form
      onSubmit={save}
      className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:items-end"
    >
      {PRICE_FIELDS.map(([k, label]) => (
        <label key={k} className="text-xs text-muted-foreground">
          {label}
          <input
            value={values[k] ?? ""}
            onChange={(e) => setValues({ ...values, [k]: e.target.value.replace(/[^0-9]/g, "") })}
            inputMode="numeric"
            className="mt-1 block w-full rounded-xl border border-input bg-background px-3 py-2.5 text-base text-foreground outline-none focus:ring-2 focus:ring-ring sm:text-sm"
          />
        </label>
      ))}
      <button
        type="submit"
        className="col-span-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-all hover:shadow-lift sm:col-span-1"
      >
        Guardar
      </button>
    </form>
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const { data, loading, reload } = useCabinData();
  const { reservations, cabins } = data;

  const [pickedCabin, setCabinId] = useState<CabinId>("");
  const [mode, setMode] = useState<"block" | "offer">("block");
  const [offerInput, setOfferInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDates, setEditDates] = useState<string[]>([]);

  const cabin = cabinById(cabins, pickedCabin);
  const cabinId = cabin.id;
  const blocked = data.blocked[cabinId] ?? [];
  const offers = data.offers[cabinId] ?? {};
  const cabinReservations = reservations.filter((r) => r.cabinId === cabinId);
  const booked = cabinReservations.flatMap((r) => r.dates);

  const paid = reservations.filter((r) => r.status === "pagado");
  const income = paid.reduce((sum, r) => sum + r.total, 0);
  const editing = reservations.find((r) => r.id === editingId) ?? null;
  const editCabin = editing ? cabinById(cabins, editing.cabinId) : cabin;
  const editTotal = editing
    ? totalForStay(
        editDates,
        editCabin,
        editing.guests,
        editing.tinaja,
        data.offers[editing.cabinId],
      )
    : 0;

  const startEdit = (r: Reservation) => {
    setEditingId(r.id);
    setEditDates([...r.dates].sort());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDates([]);
  };

  const del = async (id: string) => {
    if (await deleteReservation(id)) {
      toast.success("Reserva eliminada con éxito.");
      await reload();
    } else {
      toast.error("No se pudo eliminar la reserva.");
    }
  };

  const toggleEditDay = (day: string) => {
    if (!editing) return;
    const takenByOthers = reservations
      .filter((r) => r.id !== editing.id && r.cabinId === editing.cabinId)
      .flatMap((r) => r.dates);
    setEditDates((prev) => {
      if (prev.includes(day)) return prev.filter((d) => d !== day);
      if (takenByOthers.includes(day) || (data.blocked[editing.cabinId] ?? []).includes(day)) {
        toast.error("Ese día no está libre en esta cabaña.");
        return prev;
      }
      return [...prev, day].sort();
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (!editDates.length) {
      toast.error("Selecciona al menos una noche.");
      return;
    }
    if (!(await updateReservationDates(editing.id, [...editDates].sort(), editTotal))) {
      toast.error("No pudimos actualizar la reserva.");
      return;
    }
    cancelEdit();
    await reload();
    toast.success("Reserva actualizada con las nuevas fechas.");
  };

  const onDayClick = async (day: string) => {
    if (booked.includes(day)) {
      toast.error("Ese día tiene una reserva en esta cabaña.");
      return;
    }

    if (mode === "offer") {
      if (offers[day] !== undefined) {
        await removeOfferDays(cabinId, [day]);
        await reload();
        toast.success("Oferta quitada de ese día.");
        return;
      }
      const value = Number(offerInput);
      if (!Number.isFinite(value) || value <= 0) {
        toast.error("Escribe primero el precio de oferta.");
        return;
      }
      await setOfferDays(cabinId, [day], value);
      await reload();
      toast.success(`Día en oferta a ${formatCLP(Math.round(value))}.`);
      return;
    }

    const willBlock = !blocked.includes(day);
    await setBlockedDays(cabinId, [day], willBlock);
    await reload();
    toast.success(willBlock ? "Día marcado como ocupado." : "Día habilitado.");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <Logo className="h-10 w-auto shrink-0" />
            <div className="min-w-0">
              <p className="text-hero truncate text-base leading-tight sm:text-lg">
                Panel de administración
              </p>
              <p className="truncate text-xs text-muted-foreground">{BUSINESS_NAME}</p>
            </div>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              onLogout();
            }}
            className="flex shrink-0 items-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:px-4"
          >
            <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-5 sm:py-8">
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Wifi className="h-3.5 w-3.5 text-primary" />
          {loading ? "Cargando datos de la nube…" : "Datos sincronizados en tiempo real"}
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Reservas" value={String(reservations.length)} />
          <Stat label="Noches pagadas" value={String(paid.reduce((n, r) => n + r.nights, 0))} />
          <Stat label="Ingresos pagados" value={formatCLP(income)} />
        </div>

        <Finance reservations={reservations} expenses={data.expenses} reload={reload} />

        {/* Selector de cabaña: aplica a tarifas, calendario y ofertas */}
        {cabins.length > 1 && (
          <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-1.5 shadow-soft">
            {cabins.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCabinId(c.id)}
                className={[
                  "flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                  c.id === cabinId
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent",
                ].join(" ")}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        <section className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-6">
          <h2 className="flex items-center gap-2 text-hero text-xl">
            <Tag className="h-5 w-5" /> Tarifas por noche · {cabin.name}
          </h2>
          <RatesForm cabin={cabin} reload={reload} />
        </section>

        {editing && (
          <section className="rounded-2xl border border-primary/40 bg-card p-4 shadow-soft sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-hero text-xl">
                <Pencil className="h-5 w-5" /> Mover reserva de {editing.name}
              </h2>
              <button
                type="button"
                onClick={cancelEdit}
                className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <X className="h-4 w-4" /> Cancelar
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {editCabin.name} · {editing.tinaja ? "con tinaja · " : ""}
              {editing.guests} persona(s). Toca los días para quitar o agregar noches.
            </p>
            <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_1fr]">
              <BookingCalendar
                occupied={[
                  ...reservations
                    .filter((r) => r.id !== editing.id && r.cabinId === editing.cabinId)
                    .flatMap((r) => r.dates),
                  ...(data.blocked[editing.cabinId] ?? []),
                ]}
                selected={editDates}
                onSelect={toggleEditDay}
                offers={data.offers[editing.cabinId] ?? {}}
                allowPast
              />
              <div className="rounded-xl bg-secondary p-4 text-sm">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Nuevas fechas
                </p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {editDates.length === 0 ? (
                    <li>Sin noches seleccionadas.</li>
                  ) : (
                    editDates.map((d) => <li key={d}>{formatDayLong(d)}</li>)
                  )}
                </ul>
                <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
                  <span className="font-medium">Nuevo total</span>
                  <span className="text-hero text-2xl">{formatCLP(editTotal)}</span>
                </div>
                <button
                  type="button"
                  onClick={saveEdit}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-all hover:shadow-lift"
                >
                  <Check className="h-4 w-4" /> Guardar cambios
                </button>
              </div>
            </div>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="mb-3 flex items-center gap-2 text-hero text-xl">
              <CalendarDays className="h-5 w-5" /> Disponibilidad y ofertas
            </h2>

            <div className="mb-3 flex flex-wrap items-center gap-3">
              <div className="flex rounded-full border border-border p-1">
                {(
                  [
                    ["block", "Ocupar días"],
                    ["offer", "Marcar oferta"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMode(value)}
                    className={[
                      "rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
                      mode === value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {mode === "offer" && (
                <input
                  value={offerInput}
                  onChange={(e) => setOfferInput(e.target.value.replace(/[^0-9]/g, ""))}
                  inputMode="numeric"
                  placeholder="Precio de oferta"
                  className="w-44 rounded-xl border border-input bg-background px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm text-foreground"
                />
              )}
            </div>

            <BookingCalendar
              occupied={[...booked, ...blocked]}
              selected={[]}
              onSelect={onDayClick}
              offers={offers}
              allowOccupied
              allowPast
            />
            <p className="mt-3 text-xs text-muted-foreground">
              {mode === "block"
                ? "Toca un día para marcarlo como ocupado o liberarlo. Los días con reserva no se pueden bloquear."
                : "Escribe el precio de oferta por noche y toca los días. Toca un día en oferta para quitarla."}
            </p>
            {Object.keys(offers).length > 0 && (
              <div className="mt-4 rounded-xl border border-border p-4">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Días en oferta
                </p>
                <ul className="mt-2 space-y-1 text-sm">
                  {Object.entries(offers)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([day, value]) => (
                      <li key={day} className="flex items-center justify-between gap-3">
                        <span>{formatDay(day)}</span>
                        <span className="flex items-center gap-3">
                          <span className="text-leaf">{formatCLP(value)}</span>
                          <button
                            type="button"
                            aria-label="Quitar oferta"
                            onClick={async () => {
                              await removeOfferDays(cabinId, [day]);
                              await reload();
                              toast.success("Oferta quitada.");
                            }}
                            className="text-destructive transition-opacity hover:opacity-70"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>

          <ReservationsPanel
            cabins={cabins}
            reservations={reservations}
            reload={reload}
            onEdit={startEdit}
            onDelete={del}
          />
        </div>

        <SystemStatus data={data} loading={loading} />
      </main>
    </div>
  );
}

function SystemStatus({ data, loading }: { data: CabinData; loading: boolean }) {
  const [cloud, setCloud] = useState<{ ok: boolean; ms: number; message: string } | null>(null);
  const [checking, setChecking] = useState(false);

  const run = async () => {
    setChecking(true);
    setCloud(await checkCloudStatus());
    setChecking(false);
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-6">
      <h2 className="flex items-center gap-2 text-hero text-xl">
        <Activity className="h-5 w-5" /> Estado del sistema
      </h2>
      <ul className="mt-4 space-y-2 text-sm">
        <Row
          label="Sincronización en la nube"
          value={loading ? "Conectando…" : `Activa · ${data.reservations.length} reservas`}
          ok={!loading}
        />
        <Row
          label="WhatsApp del dueño"
          value={OWNER_WHATSAPP ? `+${OWNER_WHATSAPP}` : "Pendiente de configurar"}
          ok={Boolean(OWNER_WHATSAPP)}
          icon={<MessageCircle className="h-3.5 w-3.5" />}
        />
        <Row
          label="Correo de contacto"
          value={ADMIN_EMAIL || "Pendiente de configurar"}
          ok={Boolean(ADMIN_EMAIL)}
          icon={<Mail className="h-3.5 w-3.5" />}
        />
        <Row label="Horarios" value={`Check-in ${CHECK_IN} · Check-out ${CHECK_OUT}`} ok />
        {cloud && (
          <Row
            label="Última prueba de conexión"
            value={`${cloud.message} (${cloud.ms} ms)`}
            ok={cloud.ok}
          />
        )}
      </ul>
      <button
        type="button"
        onClick={run}
        disabled={checking}
        className="mt-4 w-full rounded-xl border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-60 sm:w-auto"
      >
        {checking ? "Probando…" : "Probar conexión"}
      </button>
    </section>
  );
}

function Row({
  label,
  value,
  ok,
  icon,
}: {
  label: string;
  value: string;
  ok: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 last:border-0">
      <span className="flex items-center gap-2 text-muted-foreground">
        {icon} {label}
      </span>
      <span className={ok ? "text-primary" : "text-destructive"}>{value}</span>
    </li>
  );
}

function Finance({
  reservations,
  expenses,
  reload,
}: {
  reservations: Reservation[];
  expenses: Expense[];
  reload: () => Promise<unknown>;
}) {
  const [period, setPeriod] = useState<"week" | "month">("month");
  const [concept, setConcept] = useState("");
  const [amount, setAmount] = useState("");

  const range = periodRange(period);
  const income = incomeInRange(reservations, range);
  const spent = expensesInRange(expenses, range);
  const profit = income - spent;
  const periodExpenses = expenses
    .filter((e) => e.date >= range.start && e.date <= range.end)
    .slice()
    .reverse();

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (concept.trim().length < 2) {
      toast.error("Escribe un concepto válido.");
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Ingresa un monto mayor a cero.");
      return;
    }
    const ok = await addExpense(concept.trim().slice(0, 60), Math.round(value), toKey(new Date()));
    if (!ok) {
      toast.error("No pudimos guardar el gasto.");
      return;
    }
    setConcept("");
    setAmount("");
    await reload();
    toast.success("Gasto registrado.");
  };

  const del = async (id: string) => {
    await removeExpense(id);
    await reload();
    toast.success("Gasto eliminado.");
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-hero text-xl">
          <TrendingUp className="h-5 w-5" /> Finanzas
        </h2>
        <div className="flex rounded-full border border-border p-1">
          {(
            [
              ["week", "Semanal"],
              ["month", "Mensual"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setPeriod(value)}
              className={[
                "rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
                period === value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Período: {formatDay(range.start)} — {formatDay(range.end)}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Ingresos del período" value={formatCLP(income)} />
        <Stat label="Gastos del período" value={formatCLP(spent)} />
        <Stat label="Utilidad estimada" value={formatCLP(profit)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <form onSubmit={add} className="space-y-3">
          <h3 className="text-sm font-medium">Registrar gasto</h3>
          <input
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            maxLength={60}
            placeholder="Concepto (ej: mantención tinaja)"
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm text-foreground"
          />
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
            inputMode="numeric"
            placeholder="Monto en CLP"
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm text-foreground"
          />
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-all hover:shadow-lift"
          >
            <Plus className="h-4 w-4" /> Agregar gasto
          </button>
        </form>

        <div>
          <h3 className="mb-3 text-sm font-medium">Gastos del período</h3>
          {periodExpenses.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Sin gastos registrados en este período.
            </p>
          ) : (
            <ul className="space-y-2">
              {periodExpenses.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{e.concept}</p>
                    <p className="text-xs text-muted-foreground">{formatDay(e.date)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm">{formatCLP(e.amount)}</span>
                    <button
                      type="button"
                      aria-label="Eliminar gasto"
                      onClick={() => del(e.id)}
                      className="text-destructive transition-opacity hover:opacity-70"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 text-hero text-2xl">{value}</p>
    </div>
  );
}
