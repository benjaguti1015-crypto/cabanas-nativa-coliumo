import { useState } from "react";
import {
  Bath,
  ChevronDown,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { StatusBadge } from "@/components/Brand";
import { updateReservationStatus } from "@/lib/cloud";
import {
  BUSINESS_NAME,
  cabinById,
  formatCLP,
  formatDay,
  parseKey,
  toKey,
  whatsappLink,
  type Cabin,
  type Reservation,
} from "@/lib/booking";

type Filter = "upcoming" | "pending" | "past" | "all";
const PAGE_SIZE = 15;
const FILTERS: [Filter, string][] = [
  ["upcoming", "Próximas"],
  ["pending", "Sin pagar"],
  ["past", "Pasadas"],
  ["all", "Todas"],
];

const isPast = (r: Reservation, today: string) => (r.dates[r.dates.length - 1] ?? "") < today;

const range = (r: Reservation) => {
  const first = r.dates[0];
  const last = r.dates[r.dates.length - 1];
  if (!first || !last) return "Sin fechas";
  return first === last ? formatDay(first) : `${formatDay(first)} → ${formatDay(last)}`;
};

/** Lista compacta de reservas: buscador, filtros, filas que se abren y "mostrar más". */
export function ReservationsPanel({
  cabins,
  reservations,
  reload,
  onEdit,
  onDelete,
}: {
  cabins: Cabin[];
  reservations: Reservation[];
  reload: () => Promise<unknown>;
  onEdit: (r: Reservation) => void;
  onDelete: (id: string) => Promise<void>;
}) {
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState(""); // "yyyy-mm" o vacío = todos
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const today = toKey(new Date());
  const matches: Record<Filter, (r: Reservation) => boolean> = {
    upcoming: (r) => !isPast(r, today),
    pending: (r) => r.status === "pendiente",
    past: (r) => isPast(r, today),
    all: () => true,
  };

  // Meses que tienen alguna noche reservada
  const months = [
    ...new Set(reservations.flatMap((r) => r.dates.map((d) => d.slice(0, 7)))),
  ].sort();
  const scoped = month
    ? reservations.filter((r) => r.dates.some((d) => d.startsWith(month)))
    : reservations;

  const q = query.trim().toLowerCase();
  const list = scoped
    .filter(matches[filter])
    .filter((r) => !q || `${r.name} ${r.email} ${r.phone} ${r.id}`.toLowerCase().includes(q))
    .sort((a, b) => {
      const byDate = (a.dates[0] ?? "").localeCompare(b.dates[0] ?? "");
      return filter === "past" || filter === "all" ? -byDate : byDate;
    });

  return (
    <div>
      <h2 className="mb-3 text-hero text-xl">Reservas agendadas</h2>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-0 flex-1 basis-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(PAGE_SIZE);
            }}
            placeholder="Buscar por nombre, correo, teléfono o ID"
            className="w-full rounded-xl border border-input bg-background py-2.5 pl-9 pr-4 text-base text-foreground outline-none focus:ring-2 focus:ring-ring sm:text-sm"
          />
        </div>
        <select
          value={month}
          onChange={(e) => {
            setMonth(e.target.value);
            if (e.target.value) setFilter("all"); // un mes puntual puede ser pasado: no lo ocultes
            setLimit(PAGE_SIZE);
          }}
          aria-label="Filtrar por mes"
          className="rounded-xl border border-input bg-background px-3 py-2.5 text-base capitalize text-foreground outline-none focus:ring-2 focus:ring-ring sm:text-sm"
        >
          <option value="">Todos los meses</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {parseKey(`${m}-01`).toLocaleDateString("es-CL", { month: "long", year: "numeric" })}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {FILTERS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setFilter(value);
              setLimit(PAGE_SIZE);
            }}
            className={[
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.97]",
              filter === value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {label} · {scoped.filter(matches[value]).length}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {reservations.length === 0
            ? "Aún no hay reservas registradas."
            : "No hay reservas con ese filtro."}
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {list.slice(0, limit).map((r) => {
            const open = openId === r.id;
            const paid = r.status === "pagado";
            return (
              <li key={r.id} className="rounded-xl border border-border bg-card shadow-soft">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : r.id)}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-[background-color,transform] duration-150 ease-out hover:bg-accent/40 active:scale-[0.99]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">{r.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {cabinById(cabins, r.cabinId).name} · {range(r)} · {r.nights} noche(s)
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-foreground">{formatCLP(r.total)}</p>
                    <div className="mt-0.5">
                      <StatusBadge status={r.status} />
                    </div>
                  </div>
                  <ChevronDown
                    className={[
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 ease-out",
                      open ? "rotate-180" : "",
                    ].join(" ")}
                  />
                </button>

                {open && (
                  <div className="space-y-3 border-t border-border px-4 py-3">
                    <div className="space-y-1.5 text-sm font-bold text-foreground">
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4 shrink-0 text-muted-foreground" /> {r.phone}
                      </p>
                      <p className="flex items-center gap-2 break-all">
                        <Mail className="h-4 w-4 shrink-0 text-muted-foreground" /> {r.email}
                      </p>
                      <p className="text-primary">
                        👥 {r.guests} persona{r.guests > 1 ? "s" : ""}
                      </p>
                      <p>📅 {r.dates.map(formatDay).join(" · ")}</p>
                    </div>

                    {r.tinaja && (
                      <p className="inline-flex items-center gap-1.5 rounded-full bg-leaf/15 px-3 py-1 text-xs font-bold text-leaf">
                        <Bath className="h-3.5 w-3.5 shrink-0" /> Con tinaja
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">Pago:</span>
                        <select
                          className="rounded-lg border border-input bg-background px-2.5 py-1 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring"
                          value={r.status}
                          onChange={async (e) => {
                            const newStatus = e.target.value as "pendiente" | "pagado";
                            const res = await updateReservationStatus(r.id, newStatus);
                            if (res.ok) {
                              toast.success(`Estado actualizado a: ${newStatus}`);
                              await reload();
                            } else if (res.conflict) {
                              toast.error(
                                "Esas noches ya están pagadas por otra reserva en esta cabaña.",
                              );
                            } else {
                              toast.error("No se pudo actualizar el estado de pago.");
                            }
                          }}
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="pagado">Pagado</option>
                        </select>
                      </div>
                      <a
                        href={whatsappLink(
                          r.phone,
                          `Hola ${r.name}, te escribimos de ${BUSINESS_NAME} para confirmar los detalles de tu reserva.`,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <MessageCircle className="h-3.5 w-3.5 text-primary" /> WhatsApp
                      </a>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                      <button
                        type="button"
                        onClick={() => onEdit(r)}
                        className="flex items-center gap-2 text-xs font-medium text-primary hover:underline"
                      >
                        <Pencil className="h-3 w-3" /> Editar fechas
                      </button>
                      {confirmId === r.id ? (
                        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1">
                          <span className="text-xs font-bold text-destructive">¿Estás seguro?</span>
                          <button
                            type="button"
                            onClick={async () => {
                              await onDelete(r.id);
                              setConfirmId(null);
                            }}
                            className="rounded bg-destructive px-2.5 py-1 text-xs font-bold text-destructive-foreground hover:opacity-90"
                          >
                            Sí, eliminar
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmId(null)}
                            className="rounded border border-border bg-background px-2 py-1 text-xs font-medium text-foreground hover:bg-accent"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmId(r.id)}
                          className="flex items-center gap-2 text-xs font-medium text-destructive hover:underline"
                        >
                          <Trash2 className="h-3 w-3" /> Eliminar reserva
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {list.length > limit && (
        <button
          type="button"
          onClick={() => setLimit((n) => n + PAGE_SIZE)}
          className="mt-3 w-full rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition-[background-color,transform] duration-150 ease-out hover:bg-accent hover:text-accent-foreground active:scale-[0.98]"
        >
          Mostrar más ({list.length - limit} restantes)
        </button>
      )}
    </div>
  );
}
