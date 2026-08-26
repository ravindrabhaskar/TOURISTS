import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge, Card, SectionHeading } from "@/components/ui/primitives";
import { DestinationCard, EventCard, gradientFor } from "@/components/catalog/cards";
import { FavoriteButton } from "@/components/catalog/favorite-button";
import { ReviewForm, ReviewsList } from "@/components/catalog/reviews";
import { getDestinationBySlug, getRelated, findNearby } from "@/server/domains/destinations";
import { listApprovedReviews } from "@/server/domains/reviews";
import { getWeather } from "@/server/integrations/weather";
import { isOpenAt, todayWindowsLabel } from "@/lib/opening-hours";
import { formatINR, formatMinutes } from "@/lib/utils";
import { db } from "@/server/db";
import { getViewer } from "@/server/auth/guard";
import type { OpeningHours } from "@/lib/opening-hours";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const d = await getDestinationBySlug(slug);
    return {
      title: d.seoTitle ?? d.name,
      description: d.seoDescription ?? d.summary,
      alternates: { canonical: `/destinations/${d.slug}` },
    };
  } catch {
    return { title: "Destination" };
  }
}

export default async function DestinationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ reviewSubmitted?: string; reviewError?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  let dest: Awaited<ReturnType<typeof getDestinationBySlug>> | null = null;
  try {
    dest = await getDestinationBySlug(slug);
  } catch {
    notFound();
  }
  if (!dest) notFound();
  const d = dest!;

  const viewer = await getViewer();
  const [related, weather, reviewsData, favorited] = await Promise.all([
    getRelated(d.id, d.districtId).catch(() => []),
    getWeather(d.lat, d.lng).catch(() => null),
    listApprovedReviews({ targetType: "DESTINATION", destinationId: d.id }).catch(() => null),
    viewer
      ? db.favorite.findFirst({ where: { userId: viewer.id, targetType: "DESTINATION", destinationId: d.id } }).then(Boolean).catch(() => false)
      : Promise.resolve(false),
  ]);

  let nearby: Awaited<ReturnType<typeof findNearby>> = [];
  try {
    nearby = (await findNearby({ lat: d.lat, lng: d.lng, radiusKm: 45, limit: 6 })).filter((n) => n.slug !== d.slug);
  } catch {
    nearby = [];
  }

  const hours = (Array.isArray(d.openingHours) ? d.openingHours : []) as unknown as OpeningHours;
  const openNow = isOpenAt(hours, new Date());
  const todayLabel = todayWindowsLabel(hours);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: d.name,
    description: d.summary,
    geo: { "@type": "GeoCoordinates", latitude: d.lat, longitude: d.lng },
    address: { "@type": "PostalAddress", addressRegion: "Andhra Pradesh", addressCountry: "IN", addressLocality: d.district.name },
    ...(d.ratingCount > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: d.ratingAvg.toFixed(1), reviewCount: d.ratingCount } } : {}),
  };

  return (
    <div className="pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className={`bg-gradient-to-br ${gradientFor(d.slug)} text-white`}>
        <div className="container py-14">
          <nav aria-label="Breadcrumb" className="text-sm text-white/80">
            <Link href="/destinations" className="hover:text-white">Destinations</Link>
            <span aria-hidden> / </span>
            <span>{d.name}</span>
          </nav>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone="brand" className="!bg-white/15 !text-white capitalize">{d.type.toLowerCase().replace(/_/g, " ")}</Badge>
            {d.isFeatured ? <Badge tone="brand" className="!bg-spice-500 !text-white">Featured</Badge> : null}
            {d.easyAccess ? <Badge tone="brand" className="!bg-white/15 !text-white">♿ Easy access</Badge> : null}
          </div>
          <h1 className="mt-2 max-w-3xl font-display text-4xl font-bold sm:text-5xl">{d.name}</h1>
          {d.nameTe ? <p lang="te" className="mt-1 text-lg text-white/85">{d.nameTe}</p> : null}
          <p className="mt-4 max-w-2xl text-lg text-white/90">{d.summary}</p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <FavoriteButton targetType="DESTINATION" slug={d.slug} initial={favorited} signedIn={Boolean(viewer)} />
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${d.lat},${d.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/40 px-3 py-2 text-sm font-semibold hover:bg-white/10"
            >
              🧭 Directions
            </a>
          </div>
        </div>
      </section>

      <div className="container mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
        {/* Main column */}
        <div className="min-w-0">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ["Entry fee", d.entryFeeAdult != null ? `${formatINR(d.entryFeeAdult)} / adult` : "Free"],
              ["Typical visit", `~${formatMinutes(d.visitDurationMin)}`],
              ["Rating", d.ratingCount > 0 ? `★ ${d.ratingAvg.toFixed(1)} (${d.ratingCount})` : "New"],
              ["Best season", d.bestTimeToVisit ?? "Year-round"],
            ].map(([label, value]) => (
              <Card key={label} className="p-4">
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-900/50">{label}</dt>
                <dd className="mt-1 text-sm font-semibold text-ink-950">{value}</dd>
              </Card>
            ))}
          </dl>

          {d.description ? (
            <section className="mt-8">
              <h2 className="font-display text-2xl font-bold">About</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-ink-900/85">{d.description}</p>
            </section>
          ) : null}

          {hours.length > 0 ? (
            <section className="mt-8">
              <h2 className="font-display text-2xl font-bold">Timings</h2>
              <ul className="mt-3 space-y-2">
                {hours.map((w, i) => (
                  <li key={i} className="flex items-center justify-between rounded-xl bg-sand-100 px-4 py-2.5 text-sm">
                    <span>{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].filter((_, di) => w.days.includes(di)).join(", ") || "Daily"}</span>
                    <span className="font-semibold">{w.open} – {w.close}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {reviewsData && reviewsData.items.length > 0 ? (
            <section className="mt-10">
              <SectionHeading title="Traveller reviews" subtitle={`${reviewsData.total} published review(s)`} />
              <ReviewsList
                reviews={reviewsData.items.map((r) => ({
                  id: r.id,
                  rating: r.rating,
                  title: r.title,
                  body: r.body,
                  helpfulCount: r.helpfulCount,
                  createdAt: r.createdAt.toISOString(),
                  userName: r.user.name,
                  userAvatar: r.user.avatarEmoji,
                }))}
              />
            </section>
          ) : null}

          <section className="mt-10">
            <ReviewForm
              targetType="DESTINATION"
              slug={d.slug}
              redirectTo={`/destinations/${d.slug}`}
              signedIn={Boolean(viewer)}
              submitted={sp.reviewSubmitted === "1"}
              error={sp.reviewError}
            />
            {sp.reviewSubmitted === "1" ? (
              <p role="status" className="mt-3 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
                Thanks! Your review is queued for moderation — it will appear once approved.
              </p>
            ) : null}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          <Card className="overflow-hidden">
            <div className="border-b border-sand-100 px-4 py-3 text-sm font-semibold">Live conditions</div>
            {weather ? (
              <div className="px-4 py-4">
                <p className="text-sm">
                  <span aria-hidden>{weather.current.condition.toLowerCase().includes("rain") ? "🌧️" : "⛅"}</span>{" "}
                  {weather.current.temperatureC}°C — {weather.current.condition}
                </p>
                <p className="mt-0.5 text-xs text-ink-900/60">
                  Feels like {weather.current.feelsLikeC}°C · Humidity {weather.current.humidityPct}% · Wind {weather.current.windKph} km/h
                </p>
                <ul className="mt-3 space-y-1.5 text-xs text-ink-900/75">
                  {weather.travelAdvice.slice(0, 2).map((tip) => (
                    <li key={tip}>• {tip}</li>
                  ))}
                </ul>
                <p className="mt-3 flex gap-4 border-t border-sand-100 pt-3 text-xs">
                  {weather.forecast.slice(0, 3).map((f) => (
                    <span key={f.date}>
                      <strong>{new Date(f.date + "T12:00:00").toLocaleDateString("en-IN", { weekday: "short" })}</strong> {f.maxTempC}° / {f.minTempC}°
                    </span>
                  ))}
                </p>
                {weather.source === "mock" ? (
                  <p className="mt-2 rounded bg-sand-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-ink-900/60">Simulated data (offline)</p>
                ) : null}
              </div>
            ) : (
              <p className="px-4 py-4 text-xs text-ink-900/60">Weather unavailable right now.</p>
            )}
          </Card>

          <Card className="p-4">
            <p className="text-sm font-semibold">Open now?</p>
            <p className="mt-1 text-sm">
              {hours.length === 0 ? (
                <span className="text-ink-900/60">Timings not published</span>
              ) : openNow ? (
                <span className="font-semibold text-brand-700">● Open now — {todayLabel}</span>
              ) : (
                <span className="font-semibold text-spice-600">● Closed now — {todayLabel}</span>
              )}
            </p>
            {d.contactPhone ? (
              <p className="mt-3 border-t border-sand-100 pt-3 text-sm">
                ☎ <a href={`tel:${d.contactPhone}`} className="text-brand-700 hover:text-brand-800">{d.contactPhone}</a>
              </p>
            ) : null}
            {d.website ? (
              <p className="mt-1 text-sm">
                🔗{" "}
                <a href={d.website} target="_blank" rel="noopener noreferrer nofollow" className="text-brand-700 hover:text-brand-800">
                  Official website
                </a>
              </p>
            ) : null}
            {d.accessibilityInfo ? (
              <p className="mt-3 border-t border-sand-100 pt-3 text-xs text-ink-900/70">♿ {d.accessibilityInfo}</p>
            ) : null}
          </Card>

          {nearby.length > 0 ? (
            <Card className="p-4">
              <p className="text-sm font-semibold">Nearby places</p>
              <ul className="mt-2 divide-y divide-sand-100 text-sm">
                {nearby.slice(0, 5).map((n) => (
                  <li key={n.slug}>
                    <Link href={`/destinations/${n.slug}`} className="flex items-center justify-between py-2 hover:text-brand-700">
                      <span className="truncate">{n.name}</span>
                      <span className="ml-2 shrink-0 text-xs text-ink-900/50">{n.distanceKm.toFixed(1)} km</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <Card className="p-4">
            <p className="text-sm font-semibold">Let AI plan your visit</p>
            <p className="mt-1 text-xs text-ink-900/70">
              Add {d.name} to a full day-wise itinerary with travel times and honest costs.
            </p>
            <Link
              href={`/plan?place=${encodeURIComponent(d.slug)}&lat=${d.lat}&lng=${d.lng}&origin=${encodeURIComponent(d.district.name)}`}
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              ✨ Plan around here
            </Link>
          </Card>
        </aside>
      </div>

      {d.events.length > 0 ? (
        <section className="container mt-12">
          <SectionHeading title="Events at this destination" />
          <div className="grid gap-4 md:grid-cols-2">
            {d.events.map((e) => (
              <EventCard key={e.id} e={{ ...e, district: { name: d.district.name, slug: d.district.slug } }} />
            ))}
          </div>
        </section>
      ) : null}

      {related.length > 0 ? (
        <section className="container mt-12">
          <SectionHeading title="You may also like" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((r) => (
              <DestinationCard key={r.id} d={r} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
