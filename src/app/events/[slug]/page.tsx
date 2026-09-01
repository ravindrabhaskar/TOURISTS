import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge, Card } from "@/components/ui/primitives";
import { getEventBySlug } from "@/server/domains/events";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const e = await getEventBySlug(slug);
    return { title: e.title, description: e.description ?? undefined };
  } catch {
    return { title: "Event" };
  }
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let event: Awaited<ReturnType<typeof getEventBySlug>> | null = null;
  try {
    event = await getEventBySlug(slug);
  } catch {
    notFound();
  }
  if (!event) notFound();
  const e = event!;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title,
    description: e.description,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate.toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    location: { "@type": "Place", name: e.venueName ?? e.district.name, geo: { "@type": "GeoCoordinates", latitude: e.lat, longitude: e.lng } },
  };

  return (
    <div className="container-x max-w-3xl py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb" className="text-sm text-ink-900/60">
        <Link href="/events" className="hover:text-brand-700">Events</Link> <span aria-hidden>/</span> {e.title}
      </nav>

      <Badge tone="spice" className="mt-4 capitalize">{e.category.toLowerCase().replace(/_/g, " ")}</Badge>
      <h1 className="mt-2 font-display text-4xl font-semibold">{e.title}</h1>
      <p className="mt-1 text-lg text-ink-900/70">{formatDate(e.startDate)} – {formatDate(e.endDate)}</p>

      {e.description ? <p className="mt-6 leading-relaxed text-ink-900/85">{e.description}</p> : null}
      {e.culturalSignificance ? (
        <Card className="mt-6 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-900/50">Cultural significance</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-900/85">{e.culturalSignificance}</p>
        </Card>
      ) : null}

      <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          ["Venue", e.venueName ?? "—"],
          ["District", e.district.name],
          ["Entry", e.entryFee != null ? `₹${e.entryFee}` : e.ticketInfo ?? "Free / info on site"],
          ["Expected crowd", e.expectedVisitors ?? "—"],
          ["Organiser", e.organizer ?? "—"],
          ["Contact", e.contactPhone ?? "—"],
        ].map(([k, v]) => (
          <div key={k as string} className="rounded-xl bg-sand-100 p-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-900/50">{k}</dt>
            <dd className="mt-1 break-words text-sm font-semibold text-ink-950">{v}</dd>
          </div>
        ))}
      </dl>

      {e.recurrenceNote ? <p className="mt-4 text-xs italic text-ink-900/60">{e.recurrenceNote}</p> : null}

      <div className="mt-8 flex flex-wrap gap-3">
        {e.destination ? (
          <Link href={`/destinations/${e.destination.slug}`} className="rounded-xl border border-brand-300 bg-surface px-4 py-2.5 text-sm font-semibold text-brand-800 hover:border-brand-400">
            Explore {e.destination.name}
          </Link>
        ) : null}
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${e.lat},${e.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-sand-200 bg-surface px-4 py-2.5 text-sm font-semibold text-ink-900/80 hover:border-brand-300"
        >
          🧭 Directions
        </a>
        <Link href="/plan" className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          ✨ Plan a trip around it
        </Link>
      </div>
      <p className="mt-6 rounded-xl bg-sand-100 p-4 text-xs text-ink-900/60">
        Event dates are curated and may shift — confirm with the district tourism office before travelling long distances.
      </p>
    </div>
  );
}
