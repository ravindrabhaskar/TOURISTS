import type { MetadataRoute } from "next";
import { TRIPS } from "@/lib/data/trips";
import { JOURNAL } from "@/lib/data/journal";

export default function sitemap(): MetadataRoute.Sitemap {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://sanchari-travel.vercel.app";
  const now = new Date();
  return [
    { url: base, lastModified: now, priority: 1 },
    { url: `${base}/trips`, lastModified: now, priority: 0.9 },
    ...TRIPS.map((t) => ({
      url: `${base}/trips/${t.slug}`,
      lastModified: now,
      priority: 0.8,
    })),
    { url: `${base}/journal`, lastModified: now, priority: 0.7 },
    ...JOURNAL.map((p) => ({
      url: `${base}/journal/${p.slug}`,
      lastModified: new Date(p.date),
      priority: 0.6,
    })),
    { url: `${base}/enquire`, lastModified: now, priority: 0.6 },
  ];
}
