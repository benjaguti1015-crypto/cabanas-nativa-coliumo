import { Heart } from "lucide-react";

import type { Reservation } from "@/lib/booking";

/**
 * Logo provisorio: círculo con pino y montaña.
 * PENDIENTE: reemplazar por el logo real (public/logo.png) cuando lo envíe el dueño.
 */
export function LogoMark({ className = "h-11 w-11" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Cabañas Nativa Coliumo">
      <circle
        cx="24"
        cy="24"
        r="22.5"
        fill="var(--card)"
        stroke="var(--foreground)"
        strokeWidth="1.5"
      />
      <path d="M10 33 L20 19 L26 27 L30 22 L38 33 Z" fill="var(--sage)" opacity="0.55" />
      <path
        d="M15 33 v-3 M15 30 l-3 0 l3 -5 l3 5 Z M15 25 l-2 0 l2 -4 l2 4 Z"
        fill="var(--foreground)"
        stroke="var(--foreground)"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <path
        d="M22 33 v-5 h8 v5 M21 28 l5 -4 l5 4"
        fill="none"
        stroke="var(--terracotta)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9 36 q7 -2 15 0 t15 0" fill="none" stroke="var(--primary)" strokeWidth="1.2" />
    </svg>
  );
}

export function Brand({ subtitle = "Coliumo · Cabañas y tinaja" }: { subtitle?: string }) {
  return (
    <a href="/" className="flex min-w-0 items-center gap-3">
      <LogoMark className="h-10 w-10 shrink-0 sm:h-12 sm:w-12" />
      <div className="min-w-0">
        <p className="truncate leading-tight">
          <span className="font-display text-base font-semibold tracking-[0.18em] uppercase">
            Cabañas{" "}
          </span>
          <span className="text-script text-2xl">Nativa</span>
        </p>
        <p className="truncate text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:text-xs">
          {subtitle}
        </p>
      </div>
    </a>
  );
}

/** Separador fino con corazón al centro, como en las publicaciones. */
export function Divider() {
  return (
    <div className="mx-auto my-5 flex max-w-xs items-center gap-3 text-terracotta" aria-hidden>
      <span className="h-px flex-1 bg-foreground/30" />
      <Heart className="h-4 w-4" />
      <span className="h-px flex-1 bg-foreground/30" />
    </div>
  );
}

export function StatusBadge({ status }: { status: Reservation["status"] }) {
  const paid = status === "pagado";
  return (
    <span
      className={[
        "inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
        paid ? "bg-primary/15 text-primary" : "bg-terracotta/15 text-terracotta",
      ].join(" ")}
    >
      {paid ? "Pagado" : "Pendiente"}
    </span>
  );
}
