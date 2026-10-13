import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  Flame,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  Users,
  Waves,
} from "lucide-react";
import type { ReactNode } from "react";

import { Brand, Divider, useReveal } from "@/components/Brand";
import { SiteFooter } from "@/components/SiteFooter";
import {
  BUSINESS_NAME,
  CHECK_IN,
  CHECK_OUT,
  DEFAULT_CABINS,
  LOCATION,
  OWNER_WHATSAPP,
  formatCLP,
  whatsappLink,
} from "@/lib/booking";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lugar Secreto Hualqui — Cabañas con tinaja caliente" },
      {
        name: "description",
        content:
          "Cabañas con tinaja caliente para dos personas en Hualqui. Sauna, piscina y naturaleza. Reserva online.",
      },
      { property: "og:title", content: "Lugar Secreto Hualqui — Cabañas con tinaja caliente" },
      {
        property: "og:description",
        content: "Relájate, desconéctate y vive momentos inolvidables en un entorno único.",
      },
      { property: "og:image", content: "/fotos/cabana.webp" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FROM_PRICE = DEFAULT_CABINS[0]!.priceBase;

const SERVICES = [
  { icon: Home, title: "Cabañas", text: "Cómodas y acogedoras" },
  { icon: Flame, title: "Tinaja", text: "Caliente y privada" },
  { icon: Heart, title: "Sauna", text: "Relajación total" },
  { icon: Waves, title: "Piscina", text: "Rodeada de árboles" },
];

const GALLERY = [
  {
    src: "/fotos/cabana.webp",
    alt: "Cabaña de madera entre árboles",
    label: "La cabaña",
    w: 1080,
    h: 1080,
  },
  {
    src: "/fotos/living.webp",
    alt: "Living interior con sofá y cuadros de flores",
    label: "Interior",
    w: 1022,
    h: 1443,
  },
  {
    src: "/fotos/terraza.webp",
    alt: "Terraza con mesas y quitasoles junto al sauna",
    label: "Terraza y sauna",
    w: 960,
    h: 1280,
  },
  {
    src: "/fotos/piscina.webp",
    alt: "Piscina rodeada de pasto y árboles",
    label: "Piscina",
    w: 853,
    h: 1280,
  },
];

// Primera foto grande; la piscina ocupa el ancho restante para cerrar la grilla
const GALLERY_SPANS = ["col-span-2 row-span-2", "", "", "col-span-2"];

const NAV = [
  ["#servicios", "Servicios"],
  ["#galeria", "Galería"],
  ["#informacion", "Información"],
] as const;

function Landing() {
  const waLink = whatsappLink(
    OWNER_WHATSAPP,
    `Hola, quiero consultar disponibilidad en ${BUSINESS_NAME}.`,
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <Brand />
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </nav>
          <a
            href="/reservar"
            className="pressable inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-soft hover:shadow-lift"
          >
            <CalendarDays className="h-4 w-4" /> Reservar
          </a>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative isolate overflow-hidden">
          <img
            src="/fotos/cabana.webp"
            alt=""
            width={1080}
            height={1080}
            fetchPriority="high"
            className="absolute inset-0 -z-10 h-full w-full object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#1d1530]/55 via-[#1d1530]/45 to-[#1d1530]/80" />
          <div className="mx-auto flex min-h-[78svh] max-w-6xl flex-col items-center justify-center px-4 py-20 text-center text-white sm:px-6">
            <p className="text-xs uppercase tracking-[0.35em] text-white/80">{LOCATION}</p>
            <h1 className="text-hero mt-4 text-5xl leading-none sm:text-7xl">Cabañas con</h1>
            <p className="font-script mt-1 text-6xl leading-none text-[#d9ccf2] sm:text-8xl">
              tinaja caliente
            </p>
            <p className="mt-6 inline-flex items-center gap-2 bg-leaf px-5 py-2 font-display text-sm uppercase tracking-[0.25em] text-white shadow-soft sm:text-base">
              Para dos personas
            </p>
            <p className="mt-6 max-w-md text-base text-white/90 sm:text-lg">
              Relájate, desconéctate y vive momentos inolvidables en un entorno único.
            </p>
            <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
              <a
                href="/reservar"
                className="pressable inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 font-medium text-primary shadow-lift hover:bg-secondary sm:w-auto"
              >
                Ver disponibilidad <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="pressable inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/50 px-6 py-3.5 font-medium text-white hover:bg-white/10 sm:w-auto"
              >
                <MessageCircle className="h-4 w-4" /> Escríbenos
              </a>
            </div>
            <p className="mt-6 text-sm text-white/80">
              Desde <strong className="text-white">{formatCLP(FROM_PRICE)}</strong> la noche
            </p>
          </div>
        </section>

        {/* Servicios */}
        <Section id="servicios" eyebrow="Todo para descansar" title="Tu refugio" script="secreto">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {SERVICES.map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={i * 60}>
                <div className="h-full rounded-2xl border border-border bg-card p-5 text-center shadow-soft">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-primary">
                    <Icon className="h-6 w-6" />
                  </span>
                  <p className="mt-3 font-sans text-sm font-bold uppercase tracking-wider text-primary">
                    {title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Section>

        {/* Galería */}
        <Section id="galeria" eyebrow="Conócenos" title="Un entorno" script="único" tinted>
          <div className="grid auto-rows-[160px] grid-cols-2 gap-3 sm:auto-rows-[220px] sm:gap-4 lg:grid-cols-4">
            {GALLERY.map((photo, i) => (
              <Reveal key={photo.src} delay={i * 60} className={GALLERY_SPANS[i] ?? ""}>
                <figure className="group relative h-full overflow-hidden rounded-2xl shadow-soft">
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    width={photo.w}
                    height={photo.h}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-out)] [@media(hover:hover)]:group-hover:scale-[1.04]"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-4 pb-3 pt-8 text-left text-sm font-medium text-white">
                    {photo.label}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </Section>

        {/* Información */}
        <Section id="informacion" eyebrow="Antes de venir" title="Información" script="útil">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoTile
              icon={<Clock className="h-5 w-5" />}
              label="Check-in"
              value={`${CHECK_IN} hrs`}
            />
            <InfoTile
              icon={<Clock className="h-5 w-5" />}
              label="Check-out"
              value={`${CHECK_OUT} hrs`}
            />
            <InfoTile icon={<Users className="h-5 w-5" />} label="Capacidad" value="2 personas" />
            <InfoTile
              icon={<MapPin className="h-5 w-5" />}
              label="Ubicación"
              value="Hualqui"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Lugar Secreto Hualqui")}`}
            />
          </div>
        </Section>

        {/* Llamado final */}
        <section className="px-4 pb-20 sm:px-6">
          <Reveal className="mx-auto max-w-4xl">
            <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-12 text-center text-primary-foreground shadow-lift sm:px-12">
              <img
                src="/fotos/living.webp"
                alt=""
                loading="lazy"
                className="absolute inset-0 -z-0 h-full w-full object-cover opacity-15"
              />
              <div className="relative">
                <p className="text-hero text-3xl sm:text-4xl">Tu escapada te espera</p>
                <p className="font-script mt-1 text-5xl text-[#d9ccf2] sm:text-6xl">reserva hoy</p>
                <p className="mx-auto mt-4 max-w-md text-sm text-primary-foreground/85">
                  Revisa las noches disponibles en el calendario y asegura tu fecha en menos de un
                  minuto.
                </p>
                <a
                  href="/reservar"
                  className="pressable mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 font-medium text-primary hover:bg-secondary"
                >
                  <CalendarDays className="h-4 w-4" /> Reservar ahora
                </a>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <div className="pb-20 md:pb-0">
        <SiteFooter />
      </div>

      {/* Botón flotante de reserva en celular */}
      <a
        href="/reservar"
        className="pressable fixed inset-x-4 bottom-4 z-40 flex items-center justify-center gap-2 rounded-full bg-primary py-3.5 font-medium text-primary-foreground shadow-lift md:hidden"
      >
        <CalendarDays className="h-4 w-4" /> Reservar desde {formatCLP(FROM_PRICE)}
      </a>
    </div>
  );
}

function Section({
  id,
  eyebrow,
  title,
  script,
  tinted = false,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  script: string;
  tinted?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={["scroll-mt-16 px-4 py-16 sm:px-6 sm:py-20", tinted ? "bg-sand" : ""].join(" ")}
    >
      <div className="mx-auto max-w-6xl">
        <Reveal className="mb-10 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-leaf">{eyebrow}</p>
          <h2 className="text-hero mt-2 text-4xl sm:text-5xl">
            {title} <span className="text-script text-5xl sm:text-6xl">{script}</span>
          </h2>
          <Divider className="mt-4" />
        </Reveal>
        {children}
      </div>
    </section>
  );
}

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value,
  href,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const body = (
    <div className="flex h-full items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
        {icon}
      </span>
      <div className="min-w-0 text-left">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="text-hero text-2xl">{value}</p>
        {href && <p className="text-xs text-primary underline">Ver en el mapa</p>}
      </div>
    </div>
  );
  return (
    <Reveal>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="pressable block h-full rounded-2xl"
        >
          {body}
        </a>
      ) : (
        body
      )}
    </Reveal>
  );
}
