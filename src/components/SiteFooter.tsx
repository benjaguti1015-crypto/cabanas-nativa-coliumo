import { Instagram, MessageCircle, Phone } from "lucide-react";

import { Logo } from "@/components/Brand";
import {
  BUSINESS_NAME,
  CHECK_IN,
  CHECK_OUT,
  INSTAGRAM,
  LOCATION,
  OWNER_PHONE,
  OWNER_WHATSAPP,
  whatsappLink,
} from "@/lib/booking";

export const formatPhone = (n: string) =>
  `+${n.slice(0, 2)} ${n.slice(2, 3)} ${n.slice(3, 7)} ${n.slice(7)}`;

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card px-4 py-10 text-center text-xs text-muted-foreground">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4">
        <Logo className="h-14 w-auto" />
        <p className="text-script text-3xl">¡Te esperamos!</p>
        <div className="flex flex-wrap justify-center gap-2">
          <a
            href={`https://instagram.com/${INSTAGRAM}`}
            target="_blank"
            rel="noopener noreferrer"
            className="pressable inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-foreground hover:bg-accent"
          >
            <Instagram className="h-3.5 w-3.5 text-primary" /> @{INSTAGRAM}
          </a>
          <a
            href={`tel:+${OWNER_PHONE}`}
            className="pressable inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-foreground hover:bg-accent"
          >
            <Phone className="h-3.5 w-3.5 text-primary" /> {formatPhone(OWNER_PHONE)}
          </a>
          <a
            href={whatsappLink(OWNER_WHATSAPP, `Hola, quiero consultar por ${BUSINESS_NAME}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="pressable inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-foreground hover:bg-accent"
          >
            <MessageCircle className="h-3.5 w-3.5 text-primary" /> WhatsApp
          </a>
        </div>
        <p>
          Check-in <strong className="text-foreground">{CHECK_IN} hrs</strong> · Check-out{" "}
          <strong className="text-foreground">{CHECK_OUT} hrs</strong> · {LOCATION}
        </p>
        <p>
          {BUSINESS_NAME} · © {new Date().getFullYear()} ·{" "}
          <a href="/reservar#politica-privacidad" className="underline hover:text-foreground">
            Política de privacidad
          </a>
        </p>
      </div>
    </footer>
  );
}
