import { handle, ok, errors } from "@/lib/http";
import { getDestinationBySlug, findNearby } from "@/server/domains/destinations";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  return handle(async () => {
    const { slug } = await params;
    const d = await getDestinationBySlug(slug);
    let nearby: Awaited<ReturnType<typeof findNearby>> = [];
    try {
      nearby = await findNearby({ lat: d.lat, lng: d.lng, radiusKm: 40, limit: 5 });
    } catch {
      // decorative
    }
    return ok({
      destination: d,
      nearby: nearby.filter((n) => n.slug !== d.slug).map((n) => ({ name: n.name, slug: n.slug, distanceKm: Math.round(n.distanceKm * 10) / 10 })),
    });
  }).catch((e) => {
    if ((e as { code?: string }).code === "NOT_FOUND") throw errors.notFound("Destination not found");
    throw e;
  });
}
