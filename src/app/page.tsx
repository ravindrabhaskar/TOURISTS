import Link from "next/link";
import { Badge, Card, EmptyState, SectionHeading } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { DestinationCard, EventCard } from "@/components/catalog/cards";
import { homeRecommendations, seasonalCategories } from "@/server/domains/recommendations";
import { upcomingEvents } from "@/server/domains/events";

export const dynamic = "force-dynamic"; // home reflects live catalog + season; never stale-prerendered

type HomeData = Awaited<ReturnType<typeof homeRecommendations>>;

export default async function HomePage() {
  let data: HomeData | null = null;
  let degraded = false;
  try {
    data = await homeRecommendations();
  } catch {
    degraded = true; // DB not reachable (fresh clone / migration pending) — render honest empty state
  }
  const cats = await seasonalCategories();
  const hasContent = Boolean(data && data.featured.length > 0);
  let events: Awaited<ReturnType<typeof upcomingEvents>> = [];
  try {
    events = await upcomingEvents(4);
  } catch {
    // events are decorative on home — never block render
  }

  return (
    <>
      {/* Hero */}
      <section className="border-b border-sand-200 bg-gradient-to-br from-brand-700 via-brand-600 to-coast-700 text-white">
        <div className="container py-16 sm:py-24">
          <Badge tone="brand" className="bg-white/15 text-white">
            ఆంధ్రప్రదేశ్ · Andhra Pradesh
          </Badge>
          <h1 className="mt-4 max-w-2xl font-display text-4xl font-bold leading-tight sm:text-5xl">
            Your journey through Andhra Pradesh, intelligently planned.
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/85 sm:text-lg">
            Tell Sanchari your dates and interests — get a realistic day-wise itinerary with travel times,
            costs, weather awareness and verified places worth your time.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/plan" variant="secondary" className="!text-brand-800">
              Plan my trip ✨
            </ButtonLink>
            <ButtonLink
              href="/destinations"
              variant="ghost"
              className="!text-white hover:!bg-white/10 border border-white/40"
            >
              Browse destinations
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Seasonal strip */}
      <section className="container mt-12" aria-labelledby="seasonal-heading">
        <SectionHeading
          title="In season right now"
          subtitle={`Hand-picked for ${new Date().toLocaleString("en-IN", { month: "long" })}: ${cats.join(", ")}.`}
        />
        {!hasContent ? (
          <EmptyState
            title={degraded ? "Catalog is waking up" : "No published destinations yet"}
            body={
              degraded
                ? "The database isn't reachable yet. Run `npm run setup` after starting the dev database (`node scripts/dev-db.mjs up`)."
                : "Import the starter catalog with `npm run import:data` or add content in the admin portal."
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(data!.featured.length > 0 ? data!.featured : data!.seasonal).slice(0, 8).map((d) => (
              <DestinationCard key={d.id} d={d} />
            ))}
          </div>
        )}
      </section>

      {/* Events strip */}
      {events.length > 0 ? (
        <section className="container mt-16" aria-labelledby="events-heading">
          <SectionHeading
            title="Festivals & events ahead"
            subtitle="Plan around Andhra's cultural calendar."
            action={<Link href="/events" className="text-sm font-semibold text-brand-700 hover:text-brand-800">All events →</Link>}
          />
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((e) => (
              <EventCard key={e.id} e={e} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Planner explainer */}
      <section className="container mt-16" aria-labelledby="planner-heading">
        <Card className="grid gap-6 p-8 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "Tell us your trip",
              body: "Dates, origin, travellers, pace and interests — in English, Telugu or Hindi.",
            },
            {
              step: "2",
              title: "Get a feasible plan",
              body: "Real drive times, opening hours, meals and an honest cost estimate per person.",
            },
            {
              step: "3",
              title: "Adjust as you go",
              body: "“Skip the museum”, “running 30 minutes late” — the plan re-flows around locked bookings.",
            },
          ].map((s) => (
            <div key={s.step}>
              <span aria-hidden className="font-display text-3xl font-bold text-brand-600">
                {s.step}
              </span>
              <h3 className="mt-1 font-semibold text-ink-950">{s.title}</h3>
              <p className="mt-1 text-sm text-ink-900/70">{s.body}</p>
            </div>
          ))}
        </Card>
      </section>

      {/* Hidden gems */}
      {hasContent && data!.hiddenGems.length > 0 ? (
        <section className="container mt-16 pb-20" aria-labelledby="gems-heading">
          <SectionHeading
            title="Hidden gems"
            subtitle="Lower-profile places our travellers rate highly."
            action={
              <Link href="/destinations" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
                View all →
              </Link>
            }
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data!.hiddenGems.slice(0, 6).map((d) => (
              <DestinationCard key={d.id} d={d} />
            ))}
          </div>
        </section>
      ) : (
        <div className="pb-20" />
      )}
    </>
  );
}
