import { Heart } from "lucide-react";
import { useEffect, useRef } from "react";

import type { Reservation } from "@/lib/booking";

/** Logo oficial (recortado del flyer de Lugar Secreto). */
export function Logo({ className = "h-12 w-auto" }: { className?: string }) {
  return (
    <img
      src="/logo.webp"
      alt="Lugar Secreto · Cabañas, tinaja y sauna"
      width={635}
      height={305}
      className={className}
    />
  );
}

export function Brand() {
  return (
    <a href="/" className="pressable flex min-w-0 items-center rounded-lg">
      <Logo className="h-11 w-auto sm:h-12" />
    </a>
  );
}

/** Separador fino con corazón al centro, como en el flyer. */
export function Divider({ className = "my-5" }: { className?: string }) {
  return (
    <div
      className={`mx-auto flex max-w-xs items-center gap-3 text-lavender ${className}`}
      aria-hidden
    >
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-lavender" />
      <Heart className="h-3.5 w-3.5 fill-current" />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-lavender" />
    </div>
  );
}

export function StatusBadge({ status }: { status: Reservation["status"] }) {
  const paid = status === "pagado";
  return (
    <span
      className={[
        "inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
        paid ? "bg-leaf/15 text-leaf" : "bg-primary/10 text-primary",
      ].join(" ")}
    >
      {paid ? "Pagado" : "Pendiente"}
    </span>
  );
}

/** Marca el elemento con data-shown cuando entra en pantalla (usar con la clase `reveal`). */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.dataset["shown"] = "";
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          el.dataset["shown"] = "";
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -60px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}
