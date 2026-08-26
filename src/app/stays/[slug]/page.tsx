import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge, Card } from "@/components/ui/primitives";
import { gradientFor } from "@/components/catalog/cards";
import { FavoriteButton } from "@/components/catalog/favorite-button";
import { ReviewForm, ReviewsList } from "@/components/catalog/reviews";
import { getStayBySlug } from "@/server/domains/stays";
import { getViewer } from "@/server/auth/guard";
import { db } from "@/server/db";
import { formatINR } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const s = await getStayBySlug(slug);
    return { title: s.name, description: s.description ?? undefined };
  } catch {
    return { title: "Stay" };
  }
}

export default async function StayDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ reviewSubmitted?: string; reviewError?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  let stay: Awaited<ReturnType<typeof getStayBySlug>> | null = null;
  try {
    stay = await getStayBySlug(slug);
  } catch {
    notFound();
  }
  if (!stay) notFound();
  const s = stay!;

  const viewer = await getViewer();
  const favorited = viewer
    ? await db.favorite.findFirst({ where: { userId: viewer.id, targetType: "STAY", stayId: s.id } }).then(Boolean).catch(() => false)
    : false;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: s.name,
    description: s.description,
    address: { "@type": "PostalAddress", streetAddress: s.address, addressRegion: "Andhra Pradesh", addressCountry: "IN" },
    geo: { "@type": "GeoCoordinates", latitude: s.lat, longitude: s.lng },
    ...(s.ratingCount > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: s.ratingAvg.toFixed(1), reviewCount: s.ratingCount } } : {}),
    priceRange: formatINR(s.pricePerNightMin),
  };

  return (
    <div className="pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className={`bg-gradient-to-br ${gradientFor(s.slug)} text-white`}>
        <div className="container py-12">
          <nav aria-label="Breadcrumb" className="text-sm text-white/80">
            <Link href="/stays" className="hover:text-white">Stays</Link> <span aria-hidden>/</span> {s.name}
          </nav>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold">{s.name}</h1>
          <p className="mt-2 text-white/85">{typeof s.address === "string" ? s.address : ""} · {s.district.name}</p>
          <p className="mt-4 text-xl font-semibold">
            {formatINR(s.pricePerNightMin)} – {formatINR(s.pricePerNightMax)} <span className="text-sm font-normal text-white/80">per night</span>
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <FavoriteButton targetType="STAY" slug={s.slug} initial={favorited} signedIn={Boolean(viewer)} />
            {s.verification === "VERIFIED" ? <Badge tone="brand" className="!bg-white/15 !text-white">✓ Verified by tourism dept.</Badge> : null}
            <a href={`tel:${s.contactPhone ?? ""}`} className={s.contactPhone ? "rounded-xl border border-white/40 px-3 py-2 text-sm font-semibold hover:bg-white/10" : "hidden"}>
              ☎ Call property
            </a>
          </div>
        </div>
      </section>

      <div className="container mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          {s.description ? <p className="leading-relaxed text-ink-900/85">{s.description}</p> : null}

          <h2 className="mt-8 font-display text-2xl font-bold">Rooms</h2>
          <div role="note" className="mt-2 rounded-lg bg-sand-100 px-3 py-2 text-xs text-ink-900/70">
            Sandbox mode — availability simulated for demo. No real inventory is held until a channel manager is connected.
          </div>
          <ul className="mt-4 space-y-3">
            {s.rooms.map((room) => (
              <li key={room.id}>
                <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div>
                    <h3 className="font-semibold">{room.name}</h3>
                    <p className="mt-0.5 text-xs text-ink-900/60">
                      Sleeps {room.capacity} · {room.bedType ?? "Bed on request"} · {room.totalRooms} room(s) in inventory
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-bold">{formatINR(room.basePrice)}<span className="text-xs font-normal text-ink-900/60"> / night</span></p>
                    <form action="/checkout/stay" method="get">
                      <input type="hidden" name="roomId" value={room.id} />
                      <input type="hidden" name="slug" value={s.slug} />
                      <button
                        type="submit"
                        className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                        disabled={!viewer}
                        title={viewer ? "Book this room" : "Sign in to book"}
                      >
                        Book
                      </button>
                    </form>
                  </div>
                </Card>
              </li>
            ))}
            {s.rooms.length === 0 ? <li className="text-sm text-ink-900/60">Room inventory not published yet — contact the property.</li> : null}
          </ul>

          {s.reviews.length > 0 ? (
            <section className="mt-10">
              <h2 className="font-display text-2xl font-bold">Guest reviews</h2>
              <div className="mt-4">
                <ReviewsList
                  reviews={s.reviews.map((r) => ({
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
              </div>
            </section>
          ) : null}

          <section className="mt-10">
            <ReviewForm targetType="STAY" slug={s.slug} redirectTo={`/stays/${s.slug}`} signedIn={Boolean(viewer)} submitted={sp.reviewSubmitted === "1"} error={sp.reviewError} />
          </section>
        </div>

        <aside className="space-y-5">
          <Card className="p-4">
            <h2 className="text-sm font-semibold">Amenities</h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {s.amenities.map((a) => (
                <li key={a} className="rounded-full bg-sand-100 px-3 py-1 text-xs font-medium">{a}</li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t border-sand-100 pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-ink-900/60">Check-in</dt><dd className="font-semibold">{s.checkInTime}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-900/60">Check-out</dt><dd className="font-semibold">{s.checkOutTime}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-900/60">Price level</dt><dd className="font-semibold capitalize">{s.priceLevel.toLowerCase()}</dd></div>
            </dl>
          </Card>
          {s.policiesText ? (
            <Card className="p-4 text-xs leading-relaxed text-ink-900/70">
              <h2 className="mb-1 text-sm font-semibold text-ink-950">Policies</h2>
              {s.policiesText}
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
