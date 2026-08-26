import Link from "next/link";
import { db } from "@/server/db";
import { getViewer } from "@/server/auth/guard";
import { FavoriteButton } from "@/components/catalog/favorite-button";
import { DestinationCard, gradientFor } from "@/components/catalog/cards";
import { Card } from "@/components/ui/primitives";

export const metadata = { title: "Favourites" };
export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const viewer = (await getViewer())!;
  const favs = await db.favorite.findMany({
    where: { userId: viewer.id },
    orderBy: { createdAt: "desc" },
    include: {
      destination: { select: { id: true, slug: true, name: true, type: true, summary: true, ratingAvg: true, entryFeeAdult: true, district: { select: { name: true, slug: true } } } },
      stay: { select: { id: true, slug: true, name: true, type: true, pricePerNightMin: true, pricePerNightMax: true, priceLevel: true, ratingAvg: true, verification: true, address: true, amenities: true, district: { select: { name: true, slug: true } } } },
    },
  });

  const dests = favs.filter((f) => f.targetType === "DESTINATION" && f.destination);
  const stays = favs.filter((f) => f.targetType === "STAY" && f.stay);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Favourites</h1>

      <section aria-labelledby="fav-d" className="mt-6">
        <h2 id="fav-d" className="font-display text-xl font-bold">Places ({dests.length})</h2>
        {dests.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed border-sand-300 p-6 text-sm text-ink-900/60">
            Nothing saved yet — tap ♡ on any destination.
          </p>
        ) : (
          <div className="mt-3 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {dests.map((f) => (
              <div key={f.id}>
                <DestinationCard d={f.destination!} />
                <form className="mt-1.5">
                  <FavoriteButton targetType="DESTINATION" slug={f.destination!.slug} initial signedIn />
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="fav-s" className="mt-10">
        <h2 id="fav-s" className="font-display text-xl font-bold">Stays ({stays.length})</h2>
        {stays.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed border-sand-300 p-6 text-sm text-ink-900/60">No saved stays yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {stays.map((f) => {
              const s = f.stay!;
              return (
                <li key={f.id}>
                  <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
                    <Link href={`/stays/${s.slug}`} className="min-w-0 flex-1">
                      <span className={`mb-1 block h-10 w-full max-w-xs rounded-lg bg-gradient-to-r ${gradientFor(s.slug)}`} />
                      <p className="font-semibold hover:text-brand-700">{s.name}</p>
                      <p className="text-xs text-ink-900/60">{s.district.name} · ₹{s.pricePerNightMin}–{s.pricePerNightMax}/night</p>
                    </Link>
                    <FavoriteButton targetType="STAY" slug={s.slug} initial signedIn />
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
