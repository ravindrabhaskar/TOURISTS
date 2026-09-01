import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  CalendarHeart,
  LifeBuoy,
  MapPinned,
  Navigation,
  Sparkles,
} from "lucide-react";
import Frame from "@/components/ui/Frame";
import SectionHead from "@/components/ui/SectionHead";
import Reveal from "@/components/ui/Reveal";

/**
 * Bridges the two halves of the product: the curated small-group catalogue
 * above, and the self-serve planning platform (destinations, stays, events,
 * the AI planner) below. Without this the two surfaces never meet on the
 * landing page.
 */
const TOOLS = [
  {
    href: "/plan",
    label: "AI trip planner",
    body: "Tell it your dates, pace and budget. Get a day-by-day itinerary you can reshuffle.",
    icon: Sparkles,
    tone: "pine" as const,
  },
  {
    href: "/destinations",
    label: "Destinations",
    body: "Opening hours, ticket prices, best light, and how long to actually spend there.",
    icon: MapPinned,
    tone: "accent" as const,
  },
  {
    href: "/stays",
    label: "Stays",
    body: "Homestays, heritage rooms and forest lodges — booked at the rate you were quoted.",
    icon: BedDouble,
    tone: "gold" as const,
  },
  {
    href: "/events",
    label: "Events & festivals",
    body: "Festival dates, temple calendars and the crowds each one brings with it.",
    icon: CalendarHeart,
    tone: "accent" as const,
  },
  {
    href: "/near-me",
    label: "Near me",
    body: "Standing somewhere unfamiliar? See what is worth the next two hours.",
    icon: Navigation,
    tone: "pine" as const,
  },
  {
    href: "/emergency",
    label: "Safety & helplines",
    body: "Police, hospitals, tourist helplines and live advisories for where you are.",
    icon: LifeBuoy,
    tone: "gold" as const,
  },
];

const TONE: Record<"accent" | "pine" | "gold", string> = {
  accent: "bg-accent-soft text-accent",
  pine: "bg-pine-soft text-pine",
  gold: "bg-gold/15 text-gold",
};

export default function PlatformBand() {
  return (
    <section id="platform" className="scroll-mt-24 border-y border-line bg-surface2/50 py-16 sm:py-20">
      <div className="container-x">
        <Reveal>
          <SectionHead
            eyebrow="Plan it yourself"
            title="Everything else you need, in the same place"
            sub="Not every journey needs a group departure. The planning platform covers the days you build on your own — with the same season data behind it."
          />
        </Reveal>

        <div className="mt-10 grid gap-4 lg:grid-cols-[1.15fr_1fr]">
          <Reveal className="order-2 lg:order-1">
            <ul className="grid h-full gap-3 sm:grid-cols-2">
              {TOOLS.map((t, i) => {
                const Icon = t.icon;
                return (
                  <li key={t.href}>
                    <Link
                      href={t.href}
                      className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-muted"
                      style={{ "--reveal-index": i } as React.CSSProperties}
                    >
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${TONE[t.tone]}`}
                        aria-hidden
                      >
                        <Icon size={19} />
                      </span>
                      <span className="mt-4 font-display text-lg font-semibold">
                        {t.label}
                      </span>
                      <span className="mt-1.5 flex-1 text-sm leading-relaxed text-muted">
                        {t.body}
                      </span>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-pine">
                        Open
                        <ArrowRight
                          size={14}
                          className="transition-transform group-hover:translate-x-1"
                          aria-hidden
                        />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Reveal>

          <Reveal className="order-1 lg:order-2">
            <div className="relative h-full min-h-[20rem] overflow-hidden rounded-3xl border border-line">
              <Frame
                src="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&q=80"
                alt=""
                fallbackSeed="platform-band"
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="h-full w-full"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/70">
                  One account
                </p>
                <p className="mt-2 font-display text-2xl font-semibold leading-snug text-white sm:text-3xl">
                  Shortlists, itineraries and bookings stay together
                </p>
                <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-white/80">
                  Save a trip from the catalogue, plan the days either side of it,
                  and keep the whole thing on one dashboard.
                </p>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  <Link href="/plan" className="btn btn-primary">
                    Start planning
                  </Link>
                  <Link
                    href="/dashboard"
                    className="btn border border-white/30 text-white hover:bg-white/10"
                  >
                    My dashboard
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
