import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Flag,
  MapPin,
  Sparkles,
  Tent,
  Users,
} from "lucide-react";
import { TRIPS, allSlugs } from "@/lib/data/trips";
import { getDepartures } from "@/lib/departures";
import { bestMonthsLabel, MONTHS_FULL, primeMonths } from "@/lib/season";
import { FAQS } from "@/lib/data/site";
import { getMergedTrip } from "@/lib/server/content";
import type { Trip as TripType } from "@/lib/types";
import Gallery from "@/components/detail/Gallery";
import BookingCard from "@/components/detail/BookingCard";
import SeasonHeatmap from "@/components/detail/SeasonHeatmap";
import DeparturesTable from "@/components/detail/DeparturesTable";
import InclusionsExclusions from "@/components/detail/InclusionsExclusions";
import Reviews from "@/components/detail/Reviews";
import ClimateChart from "@/components/detail/ClimateChart";
import MapPanel from "@/components/detail/MapPanel";
import Accordion from "@/components/ui/Accordion";
import Rating from "@/components/ui/Rating";
import Reveal from "@/components/ui/Reveal";
import SectionHead from "@/components/ui/SectionHead";
import TripCard from "@/components/trips/TripCard";

export const dynamicParams = false;

export const revalidate = 60;

export function generateStaticParams() {
  return allSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const trip = await getMergedTrip(slug);
  if (!trip || trip.hidden) return { title: "Trip not found" };
  return {
    title: trip.name,
    description: `${trip.blurb} ${trip.days} days · ₹${trip.priceInr.toLocaleString("en-IN")} per person · best in ${bestMonthsLabel(trip)}.`,
    openGraph: {
      title: `${trip.name} — Sanchari Travel Co.`,
      description: trip.blurb,
      images: [{ url: trip.cover }],
    },
  };
}

function similarTrips(trip: TripType): TripType[] {
  const sameRegion = TRIPS.filter(
    (t) => t.region === trip.region && t.slug !== trip.slug,
  );
  const sameTags = TRIPS.filter(
    (t) => t.region !== trip.region && t.tags.some((tag) => trip.tags.includes(tag)),
  );
  return [...sameRegion, ...sameTags].slice(0, 3);
}

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "season", label: "When to go" },
  { id: "map", label: "Map" },
  { id: "itinerary", label: "Itinerary" },
  { id: "departures", label: "Departures" },
  { id: "inclusions", label: "Inclusions" },
  { id: "reviews", label: "Reviews" },
  { id: "faqs", label: "FAQs" },
];

export default async function TripDetailPage({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const trip = await getMergedTrip(slug);
  if (!trip || trip.hidden) notFound();

  const departures = getDepartures(trip);
  const similar = similarTrips(trip);
  const best = primeMonths(trip.season);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: trip.name,
    description: trip.description,
    touristType: "Small groups",
    itinerary: trip.itinerary.map((d) => ({
      "@type": "ListItem",
      name: d.title,
    })),
    offers: {
      "@type": "Offer",
      price: trip.priceInr,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: trip.rating,
      reviewCount: trip.reviewCount,
    },
  };

  return (
    <div className="container-x py-8 sm:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-muted">
        <Link href="/trips" className="inline-flex items-center gap-1.5 hover:text-accent">
          <ArrowLeft size={14} aria-hidden /> All trips
        </Link>
        <span aria-hidden className="mx-2">/</span>
        <Link
          href={`/trips?region=${encodeURIComponent(trip.region)}`}
          className="hover:text-accent"
        >
          {trip.region}
        </Link>
        <span aria-hidden className="mx-2">/</span>
        <span className="text-ink">{trip.name}</span>
      </nav>

      <header className="max-w-3xl">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-accent-soft px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide text-accent">
            {trip.country}
          </span>
          <span className="rounded-full border border-line px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-muted">
            {trip.difficulty}
          </span>
          <Rating rating={trip.rating} count={trip.reviewCount} />
        </div>
        <h1 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-5xl">
          {trip.name}
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-muted">{trip.blurb}</p>
      </header>

      <div className="mt-7">
        <Gallery images={trip.gallery.length ? trip.gallery : [trip.cover]} name={trip.name} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl border border-line bg-surface p-4 text-sm sm:grid-cols-4">
        <p className="flex items-center gap-2">
          <Clock size={16} className="text-accent" aria-hidden />
          <span>
            <strong>{trip.days}</strong> days
          </span>
        </p>
        <p className="flex items-center gap-2">
          <Users size={16} className="text-accent" aria-hidden />
          <span>
            Max <strong>{trip.maxGroup}</strong>
          </span>
        </p>
        <p className="flex items-center gap-2">
          <MapPin size={16} className="text-accent" aria-hidden />
          <span>From {trip.startCities.join(", ")}</span>
        </p>
        <p className="flex items-center gap-2">
          <Flag size={16} className="text-accent" aria-hidden />
          <span className="font-mono">
            Best: {MONTHS_FULL[best[0] ?? -1]?.slice(0, 3) ?? "Year-round"}
            {best.length > 1 &&
              `–${MONTHS_FULL[best[best.length - 1] ?? -1]?.slice(0, 3) ?? ""}`}
          </span>
        </p>
      </div>

      <nav
        aria-label="On this page"
        className="no-scrollbar sticky top-[4.25rem] z-40 -mx-4 mt-6 flex gap-2 overflow-x-auto border-y border-line bg-bg/90 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6"
      >
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="chip min-h-9">
            {s.label}
          </a>
        ))}
      </nav>

      <div className="mt-10 flex flex-col-reverse items-start gap-10 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-14 pb-4">
          <section id="overview" className="scroll-mt-36 space-y-5">
            <h2 className="font-display text-2xl font-semibold">The trip</h2>
            <p className="leading-relaxed">{trip.description}</p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {trip.highlights.map((h, i) => (
                <li key={i} className="card flex items-start gap-3 p-4 text-sm">
                  <Sparkles size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </section>

          <section id="season" className="scroll-mt-36 space-y-5">
            <SeasonHeatmap trip={trip} />
            <ClimateChart trip={trip} />
          </section>

          <section id="map" className="scroll-mt-36 space-y-5">
            <h2 className="font-display text-2xl font-semibold">Where you&apos;ll be</h2>
            <MapPanel slug={trip.slug} name={trip.name} />
          </section>

          <section id="itinerary" className="scroll-mt-36 space-y-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-2xl font-semibold">Day by day</h2>
              <p className="font-mono text-xs text-muted">
                {trip.itinerary.length} stages · {trip.days} days
              </p>
            </div>
            <Accordion
              defaultOpenId="day-1"
              items={trip.itinerary.map((d, i) => ({
                id: `day-${i + 1}`,
                head: `Day ${i + 1} — ${d.title}`,
                body: d.detail,
              }))}
            />
            <p className="flex items-start gap-2 rounded-xl bg-surface2 p-4 text-xs leading-relaxed text-muted">
              <Tent size={15} className="mt-0.5 shrink-0 text-pine" aria-hidden />
              Order of days may shift a little for weather or festivals — the planner
              confirms the final route before you pay.
            </p>
          </section>

          <section id="departures" className="scroll-mt-36 space-y-5">
            <h2 className="font-display text-2xl font-semibold">Departures & seats</h2>
            <DeparturesTable departures={departures} />
          </section>

          <section id="inclusions" className="scroll-mt-36 space-y-5">
            <h2 className="font-display text-2xl font-semibold">
              What the rupees cover
            </h2>
            <InclusionsExclusions trip={trip} />
          </section>

          <section id="reviews" className="scroll-mt-36 space-y-5">
            <h2 className="font-display text-2xl font-semibold">What travellers say</h2>
            <Reviews trip={trip} />
          </section>

          <section id="faqs" className="scroll-mt-36 space-y-5">
            <h2 className="font-display text-2xl font-semibold">Good questions</h2>
            <FaqAccordion />
          </section>
        </div>

        <div className="w-full lg:w-88 lg:shrink-0 xl:w-96">
          <BookingCard trip={trip} departures={departures} />
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-20">
          <Reveal>
            <SectionHead
              eyebrow="Kept browsing?"
              title="Trips cut from similar cloth"
            />
          </Reveal>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((t, i) => (
              <Reveal key={t.slug} index={i}>
                <TripCard trip={t} index={i} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function FaqAccordion() {
  return (
    <Accordion
      items={FAQS.map((f, i) => ({
        id: `faq-${i}`,
        head: f.q,
        body: f.a,
      }))}
    />
  );
}
