import type { Departure, Trip } from "./types";

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cache = new Map<string, Departure[]>();

export function getDepartures(trip: Trip): Departure[] {
  const today = new Date();
  const key = `${trip.slug}:${today.getUTCFullYear()}-${today.getUTCMonth()}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const rand = mulberry32(hash(key));
  const out: Departure[] = [];
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));

  for (let i = 1; i <= 12; i++) {
    const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1));
    const m = d.getUTCMonth();
    const season = trip.season[m];
    if (season === 0) continue;

    const count = season === 2 ? (rand() < 0.55 ? 2 : 1) : 1;
    for (let c = 0; c < count; c++) {
      const day = 2 + Math.floor(rand() * 26);
      const date = new Date(Date.UTC(d.getUTCFullYear(), m, day));
      const seatRoll = rand();
      const seatsLeft = seatRoll < 0.14 ? 0 : 2 + Math.floor(rand() * 14);
      const premium = season === 2 ? 1 + rand() * 0.06 : 0.94 + rand() * 0.04;
      out.push({
        iso: date.toISOString().slice(0, 10),
        seatsLeft,
        priceInr: Math.round((trip.priceInr * premium) / 500) * 500,
      });
    }
  }
  out.sort((a, b) => a.iso.localeCompare(b.iso));
  cache.set(key, out);
  return out;
}

export function estimateTotal(
  priceInr: number,
  travellers: number,
  departureIso?: string | null,
): { perPerson: number; total: number; earlyBird: boolean; groupPct: number } {
  const perPersonBefore = priceInr;
  let groupPct = 0;
  if (travellers >= 8) groupPct = 7;
  else if (travellers >= 4) groupPct = 4;

  let perPerson = Math.round((perPersonBefore * (100 - groupPct)) / 100);

  let earlyBird = false;
  if (departureIso) {
    const daysOut = Math.ceil(
      (new Date(departureIso + "T00:00:00").getTime() - Date.now()) / 86400000,
    );
    if (daysOut >= 90) {
      earlyBird = true;
      perPerson -= 5000;
    }
  }
  return {
    perPerson,
    total: perPerson * travellers,
    earlyBird,
    groupPct,
  };
}
