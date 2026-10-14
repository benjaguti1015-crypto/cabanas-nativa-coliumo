import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  Instagram,
  KeyRound,
  MapPin,
  MessageCircle,
} from "lucide-react";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

import { Brand, useReveal } from "@/components/Brand";
import { SiteFooter } from "@/components/SiteFooter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BUSINESS_NAME,
  CHECK_IN,
  CHECK_OUT,
  DEFAULT_CABINS,
  INSTAGRAM,
  LOCATION,
  OWNER_WHATSAPP,
  formatCLP,
  whatsappLink,
} from "@/lib/booking";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lugar Secreto Hualqui — Cabaña con tinaja caliente para dos" },
      {
        name: "description",
        content:
          "Cabaña para dos con tinaja caliente incluida, sauna y piscina entre árboles en Hualqui. Elige tus noches en el calendario.",
      },
      { property: "og:title", content: "Lugar Secreto Hualqui — Cabaña con tinaja caliente" },
      {
        property: "og:description",
        content: "Una noche para dos con tinaja caliente incluida, en Hualqui.",
      },
      { property: "og:image", content: "/fotos/cabana.webp" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FROM_PRICE = DEFAULT_CABINS[0]!.priceBase;
const RESERVAR = "/reservar";
const MAPS = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Lugar Secreto Hualqui")}`;

/** Un mensaje distinto por botón: así se sabe desde dónde llegó cada conversación. */
const wa = {
  hero: whatsappLink(OWNER_WHATSAPP, `Hola, vi la web de ${BUSINESS_NAME} y tengo una consulta.`),
  precio: whatsappLink(OWNER_WHATSAPP, `Hola, tengo una duda sobre el precio de ${BUSINESS_NAME}.`),
  faq: whatsappLink(
    OWNER_WHATSAPP,
    `Hola, no encontré mi respuesta en la web de ${BUSINESS_NAME}.`,
  ),
};

const HERO_MICRO = `Desde ${formatCLP(FROM_PRICE)} la noche para 2 · Tinaja incluida`;

const NAV = [
  ["#el-lugar", "El lugar"],
  ["#como-funciona", "Cómo reservar"],
  ["#precio", "Precio"],
  ["#preguntas", "Preguntas"],
] as const;

const FEATURES = [
  {
    n: "01",
    title: "La tinaja va incluida",
    text: "Caliente y privada. No se paga aparte: está en el precio de la noche.",
    src: "/fotos/cabana.webp",
    alt: "Cabaña de madera entre árboles",
    w: 1080,
    h: 1080,
  },
  {
    n: "02",
    title: "Sauna y piscina entre árboles",
    text: "Terraza junto al sauna y una piscina rodeada de pasto. Para el día y para la noche.",
    src: "/fotos/terraza.webp",
    alt: "Terraza con mesas y quitasoles junto al sauna",
    w: 960,
    h: 1280,
  },
  {
    n: "03",
    title: "Una cabaña pensada para dos",
    text: "Living acogedor y todo listo para que solo te preocupes de descansar.",
    src: "/fotos/living.webp",
    alt: "Living interior con sofá y cuadros de flores",
    w: 1022,
    h: 1443,
  },
];

const STEPS = [
  {
    icon: CalendarDays,
    title: "Eliges tus noches",
    text: "Marcas en el calendario las fechas libres y dejas tus datos. Toma menos de un minuto.",
  },
  {
    icon: MessageCircle,
    title: "Coordinas el pago",
    text: "Nos escribes por WhatsApp. Tu reserva queda confirmada al recibir el pago.",
  },
  {
    icon: KeyRound,
    title: "Llegas y descansas",
    text: `Check-in desde las ${CHECK_IN} hrs. Te vas al día siguiente hasta las ${CHECK_OUT} hrs.`,
  },
];

const FAQ = [
  {
    q: "¿La tinaja se paga aparte?",
    a: "No. La tinaja está incluida en el precio de la noche.",
  },
  {
    q: "¿Cuántas personas pueden ir?",
    a: "La cabaña es para 2 personas.",
  },
  {
    q: "¿A qué hora llego y a qué hora me voy?",
    a: `Check-in desde las ${CHECK_IN} hrs y check-out hasta las ${CHECK_OUT} hrs.`,
  },
  {
    q: "¿Cuándo queda confirmada mi reserva?",
    a: "Cuando recibimos el pago. Mientras tanto, las noches siguen disponibles para otras personas, así que te recomendamos coordinarlo apenas reserves.",
  },
  {
    q: "¿Y si necesito cancelar?",
    a: "Las condiciones de cancelación te las informamos al confirmar. Si tienes una fecha en duda, escríbenos antes de reservar.",
  },
  {
    q: "¿Dónde queda?",
    a: `En ${LOCATION}. Te enviamos la ubicación exacta al confirmar.`,
  },
];

function Landing() {
  const pastHero = usePastHero();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <Brand />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Secciones">
            {NAV.map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </nav>
          <a
            href={RESERVAR}
            className="pressable inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-soft hover:bg-primary/90"
          >
            <CalendarDays className="h-4 w-4" /> Reservar
          </a>
        </div>
      </header>

      <main>
        <Hero />
        <Features />
        <Gallery />
        <HowItWorks />
        <SocialProof />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>

      <div className="pb-20 md:pb-0">
        <SiteFooter />
      </div>

      {/* Botón fijo en celular: mismo destino que el Hero */}
      <a
        href={RESERVAR}
        aria-hidden={!pastHero}
        tabIndex={pastHero ? undefined : -1}
        data-visible={pastHero || undefined}
        className="sticky-cta pressable fixed inset-x-4 bottom-4 z-40 flex items-center justify-center gap-2 rounded-full bg-primary py-3.5 font-medium text-primary-foreground shadow-lift md:hidden"
      >
        <CalendarDays className="h-4 w-4" /> Ver noches disponibles
      </a>
    </div>
  );
}

/* ─────────────────────────── 1 · Hero ─────────────────────────── */

function Hero() {
  return (
    <section id="inicio" className="relative isolate overflow-hidden bg-night text-white">
      <img
        src="/fotos/cabana.webp"
        alt=""
        width={1080}
        height={1080}
        fetchPriority="high"
        className="hero-photo absolute inset-0 -z-10 h-full w-full object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/55 to-night/25" />

      <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-6xl flex-col justify-center px-4 py-12 sm:px-6 sm:py-14">
        <p
          className="hero-in flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/75"
          style={d(0)}
        >
          <MapPin className="h-3.5 w-3.5" /> {LOCATION}
        </p>

        <h1
          className="hero-in text-hero mt-4 max-w-3xl text-[clamp(2.4rem,min(6.5vw,8.5svh),4.75rem)] leading-[1.02]"
          style={d(1)}
        >
          Una noche en tinaja caliente,{" "}
          <em className="font-normal text-lavender">solo para ustedes dos</em>
        </h1>

        <p
          className="hero-in mt-5 max-w-xl text-lg leading-relaxed text-white/90 sm:text-xl"
          style={d(2)}
        >
          Tu cabaña privada en Hualqui con{" "}
          <strong className="font-semibold text-white">tinaja caliente incluida</strong>, sauna y
          piscina entre árboles. Desconéctate sin salir del Biobío.
        </p>

        <div className="hero-in mt-7 flex flex-col gap-4 sm:flex-row sm:items-start" style={d(3)}>
          <div className="flex flex-col gap-3">
            <a
              href={RESERVAR}
              className="pressable group inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 font-medium text-primary shadow-lift hover:bg-secondary"
            >
              Ver noches disponibles
              <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-[var(--ease-out)] [@media(hover:hover)]:group-hover:translate-x-0.5" />
            </a>
            <p className="text-center text-sm text-white/70 sm:text-left">{HERO_MICRO}</p>
          </div>
          <a
            href={wa.hero}
            target="_blank"
            rel="noopener noreferrer"
            className="pressable inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm text-white/85 underline-offset-4 hover:text-white hover:underline sm:py-4"
          >
            <MessageCircle className="h-4 w-4" /> ¿Dudas? Escríbenos
          </a>
        </div>
      </div>
    </section>
  );
}

/** true cuando el hero ya salió de pantalla (para mostrar el botón fijo del celular). */
function usePastHero() {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const hero = document.getElementById("inicio");
    if (!hero || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setPast(!e?.isIntersecting), {
      rootMargin: "0px 0px -40% 0px",
    });
    io.observe(hero);
    return () => io.disconnect();
  }, []);
  return past;
}

const d = (i: number): CSSProperties => ({ "--d": `${120 + i * 70}ms` }) as CSSProperties;

/* ─────────────────────────── 3 · Producto ─────────────────────────── */

function Features() {
  return (
    <section id="el-lugar" className="scroll-mt-16 px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHead eyebrow="El lugar" title="Lo que te espera al llegar" />

        <div className="mt-14 space-y-16 sm:space-y-24">
          {FEATURES.map((f, i) => (
            <article key={f.n} className="grid items-center gap-6 sm:gap-10 md:grid-cols-12">
              <Reveal variant="clip" className={`md:col-span-7 ${i % 2 ? "md:order-2" : ""}`}>
                <div className="overflow-hidden rounded-3xl shadow-soft">
                  <img
                    src={f.src}
                    alt={f.alt}
                    width={f.w}
                    height={f.h}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover"
                  />
                </div>
              </Reveal>
              <Reveal className={`md:col-span-5 ${i % 2 ? "md:order-1" : ""}`} delay={80}>
                <p className="font-display text-6xl leading-none text-lavender">{f.n}</p>
                <h3 className="text-hero mt-3 text-3xl sm:text-4xl">{f.title}</h3>
                <p className="mt-3 max-w-sm text-muted-foreground">{f.text}</p>
                {i === 0 && (
                  <a
                    href={RESERVAR}
                    className="pressable mt-6 inline-flex items-center gap-1.5 rounded-full text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Ver fechas libres <ArrowRight className="h-4 w-4" />
                  </a>
                )}
              </Reveal>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── Galería ─────────────────────────── */

function Gallery() {
  return (
    <section aria-label="Fotos del lugar" className="overflow-hidden pb-20 sm:pb-28">
      <Reveal variant="clip" className="mx-auto max-w-6xl px-4 sm:px-6">
        <figure className="relative overflow-hidden rounded-3xl">
          <img
            src="/fotos/piscina.webp"
            alt="Piscina rodeada de pasto y árboles"
            width={853}
            height={1280}
            loading="lazy"
            className="aspect-[4/5] w-full object-cover sm:aspect-[21/9]"
          />
          <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night/80 to-transparent px-6 pb-6 pt-16 text-white sm:px-10 sm:pb-8">
            <p className="text-hero text-2xl sm:text-4xl">La piscina, rodeada de árboles</p>
            <p className="mt-1 text-sm text-white/75">Fotos reales del lugar</p>
          </figcaption>
        </figure>
      </Reveal>
    </section>
  );
}

/* ─────────────────────────── 6 · Cómo funciona ─────────────────────────── */

function HowItWorks() {
  return (
    <section id="como-funciona" className="scroll-mt-16 bg-sand px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHead eyebrow="Cómo reservar" title="Tres pasos y estás en la tinaja" />

        <Reveal className="relative mt-14">
          {/* Línea que se dibuja al entrar en pantalla (solo escritorio) */}
          <span
            aria-hidden
            className="draw-line absolute left-[16.66%] right-[16.66%] top-7 hidden h-px bg-lavender md:block"
          />
          <ol className="grid gap-10 md:grid-cols-3 md:gap-6">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li
                key={title}
                className="step relative flex gap-5 md:flex-col md:items-center md:text-center"
                style={{ "--i": i } as CSSProperties}
              >
                <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-lavender bg-background text-primary shadow-soft">
                  <Icon className="h-5 w-5" />
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                </span>
                <div>
                  <h3 className="text-hero text-2xl">{title}</h3>
                  <p className="mt-2 max-w-xs text-sm text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal className="mt-14 text-center">
          <a
            href={RESERVAR}
            className="pressable inline-flex items-center gap-2 rounded-full bg-primary px-7 py-4 font-medium text-primary-foreground shadow-soft hover:bg-primary/90"
          >
            <CalendarDays className="h-4 w-4" /> Elegir mis noches
          </a>
          <p className="mt-3 text-xs text-muted-foreground">Ves al tiro qué fechas están libres</p>
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────────────────────── 8 · Pruebas sociales ─────────────────────────── */
// PENDIENTE: agregar testimonios reales de huéspedes (con su permiso). No inventar.

function SocialProof() {
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-28">
      <Reveal className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-leaf">Sin filtros de catálogo</p>
          <h2 className="text-hero mt-3 text-4xl sm:text-5xl">
            Mira cómo es en verdad antes de venir
          </h2>
          <p className="mt-4 max-w-md text-muted-foreground">
            En nuestro Instagram publicamos el lugar tal cual es: la cabaña, la tinaja, el sauna y
            la piscina.
          </p>
          <a
            href={`https://instagram.com/${INSTAGRAM}`}
            target="_blank"
            rel="noopener noreferrer"
            className="pressable mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-medium hover:border-primary/40"
          >
            <Instagram className="h-4 w-4 text-primary" /> Ver @{INSTAGRAM}
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </a>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <img
            src="/fotos/living.webp"
            alt="Interior de la cabaña"
            width={1022}
            height={1443}
            loading="lazy"
            className="aspect-[3/4] w-full rounded-2xl object-cover shadow-soft"
          />
          <img
            src="/fotos/terraza.webp"
            alt="Terraza junto al sauna"
            width={960}
            height={1280}
            loading="lazy"
            className="mt-10 aspect-[3/4] w-full rounded-2xl object-cover shadow-soft"
          />
        </div>
      </Reveal>
    </section>
  );
}

/* ─────────────────────────── 9 · Precio ─────────────────────────── */

function Pricing() {
  const items = [
    "Cabaña para 2 personas",
    "Tinaja caliente incluida",
    `Check-in ${CHECK_IN} · Check-out ${CHECK_OUT}`,
  ];
  return (
    <section id="precio" className="scroll-mt-16 bg-night px-4 py-20 text-white sm:px-6 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.3em] text-lavender">Precio claro</p>
          <h2 className="text-hero mt-3 text-4xl sm:text-5xl">
            Un precio por noche. Sin sorpresas.
          </h2>
          <p className="mt-4 max-w-md text-white/70">
            Lo que ves en el calendario es lo que pagas. Algunas fechas tienen precio de oferta.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <div className="rounded-3xl bg-white p-7 text-foreground shadow-lift sm:p-9">
            <p className="text-sm text-muted-foreground">Cabaña con tinaja</p>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="text-sm text-muted-foreground">desde</span>
              <span className="text-hero text-5xl sm:text-6xl">{formatCLP(FROM_PRICE)}</span>
              <span className="text-sm text-muted-foreground">/ noche</span>
            </p>
            <ul className="mt-6 space-y-3 border-t border-border pt-6 text-sm">
              {items.map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-leaf/15 text-leaf">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <a
              href={RESERVAR}
              className="pressable mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 font-medium text-primary-foreground hover:bg-primary/90"
            >
              Reservar mis noches <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href={wa.precio}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              <MessageCircle className="h-3.5 w-3.5" /> Tengo una duda sobre el precio
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────────────────────── 10 · Preguntas frecuentes ─────────────────────────── */

function Faq() {
  return (
    <section id="preguntas" className="scroll-mt-16 px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-12">
        <Reveal className="md:col-span-4">
          <p className="text-xs uppercase tracking-[0.3em] text-leaf">Preguntas</p>
          <h2 className="text-hero mt-3 text-4xl sm:text-5xl">
            Lo que nos preguntan antes de reservar
          </h2>
          <a
            href={wa.faq}
            target="_blank"
            rel="noopener noreferrer"
            className="pressable mt-6 inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-medium hover:border-primary/40"
          >
            <MessageCircle className="h-4 w-4 text-primary" /> No encontré mi respuesta
          </a>
        </Reveal>

        <Reveal className="md:col-span-8" delay={80}>
          <Accordion type="single" collapsible className="border-t border-border">
            {FAQ.map(({ q, a }, i) => (
              <AccordionItem key={q} value={`q${i}`} className="border-border">
                <AccordionTrigger className="py-5 text-base font-medium hover:no-underline sm:text-lg">
                  {q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 pr-8 text-muted-foreground">
                  {a}
                  {q.startsWith("¿Dónde") && (
                    <a
                      href={MAPS}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 text-primary underline underline-offset-4"
                    >
                      Ver en el mapa
                    </a>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────────────────────── 11 · CTA final ─────────────────────────── */

function FinalCta() {
  return (
    <section className="px-4 pb-20 sm:px-6 sm:pb-28">
      <Reveal variant="clip" className="mx-auto max-w-6xl">
        <div className="relative isolate overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground sm:px-12 sm:py-24">
          <img
            src="/fotos/cabana.webp"
            alt=""
            loading="lazy"
            className="absolute inset-0 -z-10 h-full w-full object-cover opacity-20"
          />
          <h2 className="text-hero mx-auto max-w-2xl text-4xl sm:text-6xl">
            Elige tu noche. <em className="font-normal text-lavender">La tinaja va incluida.</em>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-primary-foreground/80">
            Revisa qué fechas están libres y deja tu reserva lista en menos de un minuto.
          </p>
          <a
            href={RESERVAR}
            className="pressable mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 font-medium text-primary shadow-lift hover:bg-secondary"
          >
            Ver noches disponibles <ArrowRight className="h-4 w-4" />
          </a>
          <p className="mt-4 text-sm text-primary-foreground/70">{HERO_MICRO}</p>
        </div>
      </Reveal>
    </section>
  );
}

/* ─────────────────────────── Piezas ─────────────────────────── */

function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <Reveal className="max-w-2xl">
      <p className="text-xs uppercase tracking-[0.3em] text-leaf">{eyebrow}</p>
      <h2 className="text-hero mt-3 text-4xl sm:text-5xl">{title}</h2>
    </Reveal>
  );
}

function Reveal({
  children,
  className = "",
  delay = 0,
  variant = "rise",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: "rise" | "clip";
}) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`${variant === "clip" ? "reveal-clip" : "reveal"} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
