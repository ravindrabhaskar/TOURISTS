import Link from "next/link";
import { db } from "@/server/db";
import { DestinationsMap, type MapPoint } from "@/components/map/destinations-map";
import PageHeader from "@/components/ui/PageHeader";

export const metadata = {
  title: "Map",
  description: "Interactive map of verified destinations across Andhra Pradesh.",
};

export default async function MapPage() {
  let points: Array<MapPoint & { summary: string }> = [];
  try {
    const rows = await db.destination.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, name: true, type: true, lat: true, lng: true, summary: true, popularityScore: true, district: { select: { name: true } } },
      orderBy: { popularityScore: "desc" },
      take: 120,
    });
    points = rows.map((r) => ({ slug: r.slug, name: r.name, type: r.type, lat: r.lat, lng: r.lng, summary: r.summary.slice(0, 110), districtName: r.district.name }));
  } catch {
    points = [];
  }

  return (
    <div className="container-x py-10">
      <PageHeader
        eyebrow="Explore"
        title="On the map"
        sub={`${points.length} published places plotted across Andhra Pradesh.`}
        className="mb-8"
      />
      {points.length > 0 ? (
        <>
          <DestinationsMap points={points} />
          <div className="mt-6 flex flex-wrap gap-2">
            {points.slice(0, 12).map((p) => (
              <Link key={p.slug} href={`/destinations/${p.slug}`} className="rounded-full border border-sand-200 bg-surface px-3 py-1.5 text-xs font-medium hover:border-brand-300">
                📍 {p.name}
              </Link>
            ))}
          </div>
        </>
      ) : (
        <p className="rounded-xl border border-dashed border-sand-300 p-10 text-center text-ink-900/60">
          The catalog isn&apos;t reachable yet — start the dev database and refresh.
        </p>
      )}
      <p className="mt-4 text-xs text-ink-900/50">Map data © OpenStreetMap contributors · Tiles via openstreetmap.org</p>
    </div>
  );
}
