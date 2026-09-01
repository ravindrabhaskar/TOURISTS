import { db } from "@/server/db";

/**
 * Trip shortlists.
 *
 * The curated trips are editorial content (src/lib/data/trips.ts) rather than
 * TourPackage rows, so a shortlisted trip is stored on Favorite by slug. Signed
 * out, the shortlist lives in localStorage; signing in merges that device list
 * into the account so the two halves of the product share one saved set.
 */
export async function listShortlist(userId: string): Promise<string[]> {
  const rows = await db.favorite.findMany({
    where: { userId, targetType: "PACKAGE", packageSlug: { not: null } },
    select: { packageSlug: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.flatMap((r) => (r.packageSlug ? [r.packageSlug] : []));
}

export async function addToShortlist(userId: string, slug: string): Promise<void> {
  try {
    await db.favorite.create({
      data: { userId, targetType: "PACKAGE", packageSlug: slug },
    });
  } catch {
    // Unique violation — already shortlisted, which is the desired end state.
  }
}

export async function removeFromShortlist(userId: string, slug: string): Promise<void> {
  await db.favorite.deleteMany({
    where: { userId, targetType: "PACKAGE", packageSlug: slug },
  });
}

/**
 * Unions the device shortlist into the account and returns the merged set.
 * Union rather than replace: signing in should never silently drop trips saved
 * on another device.
 */
export async function mergeShortlist(userId: string, localSlugs: string[]): Promise<string[]> {
  const existing = new Set(await listShortlist(userId));
  const toAdd = localSlugs.filter((s) => !existing.has(s));
  for (const slug of toAdd) await addToShortlist(userId, slug);
  return listShortlist(userId);
}
