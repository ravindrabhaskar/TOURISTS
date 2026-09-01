import { promises as fs } from "fs";
import path from "path";
import { TRIPS, getTrip } from "@/lib/data/trips";
import type { Trip } from "@/lib/types";

export interface TripOverride {
  priceInr?: number;
  blurb?: string;
  hidden?: boolean;
}

const DIR = process.env.DATA_DIR || path.join(process.cwd(), ".data");
const FILE = path.join(DIR, "overrides.json");

export async function readOverrides(): Promise<Record<string, TripOverride>> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch {
    return {};
  }
}

export async function writeOverride(slug: string, patch: TripOverride) {
  const all = await readOverrides();
  all[slug] = { ...all[slug], ...patch };
  if (Object.keys(all[slug]).length === 0) delete all[slug];
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(all, null, 2), "utf8");
}

export function applyOverride(trip: Trip, o?: TripOverride): Trip & { hidden?: boolean } {
  if (!o) return trip;
  return {
    ...trip,
    priceInr: o.priceInr ?? trip.priceInr,
    blurb: o.blurb ?? trip.blurb,
    hidden: o.hidden ?? false,
  };
}

export async function getVisibleTrips(): Promise<Trip[]> {
  const overrides = await readOverrides();
  return TRIPS.map((t) => applyOverride(t, overrides[t.slug])).filter(
    (t) => !(t as Trip & { hidden?: boolean }).hidden,
  );
}

export async function getMergedTrip(slug: string): Promise<(Trip & { hidden?: boolean }) | undefined> {
  const base = getTrip(slug);
  if (!base) return undefined;
  const overrides = await readOverrides();
  return applyOverride(base, overrides[slug]);
}
