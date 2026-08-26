import { db } from "@/server/db";
import { getWeather } from "@/server/integrations/weather";
import { findNearby, listDestinations } from "../destinations";
import { listEvents } from "../events";
import { listStays } from "../stays";
import type { ToolSpec } from "./types";

/**
 * Grounded platform tools. Every assistant fact MUST come from one of these —
 * the system prompt forbids inventing prices/availability/bookings.
 */

export const ASSISTANT_TOOLS: ToolSpec[] = [
  {
    name: "searchDestinations",
    description: "Search Andhra Pradesh destinations by free-text query and optional filters.",
    parameters: {
      type: "object",
      properties: {
        q: { type: "string", description: "Free text such as 'temples near Tirupati'" },
        district: { type: "string", description: "District name" },
        category: { type: "string", description: "e.g. temples, beaches, heritage, waterfalls" },
      },
      required: ["q"],
    },
  },
  {
    name: "nearbyPlaces",
    description: "Find published destinations within a radius of coordinates.",
    parameters: {
      type: "object",
      properties: {
        placeHint: { type: "string", description: "Place name to resolve coordinates when lat/lng unknown" },
        lat: { type: "string", description: "Latitude as decimal string" },
        lng: { type: "string", description: "Longitude as decimal string" },
        radiusKm: { type: "string", description: "Radius in km, default 25" },
      },
    },
  },
  {
    name: "searchHotels",
    description: "Find verified stays (hotels/resorts/homestays) with price level filters.",
    parameters: {
      type: "object",
      properties: {
        q: { type: "string", description: "Place or property name" },
        district: { type: "string", description: "District name to filter by" },
        maxPricePerNight: { type: "string", description: "Max nightly rate in rupees" },
      },
    },
  },
  {
    name: "searchEvents",
    description: "List upcoming festivals and events, optionally by month or district.",
    parameters: {
      type: "object",
      properties: {
        district: { type: "string", description: "District name to filter by" },
        category: { type: "string", description: "e.g. FESTIVAL, CULTURAL, RELIGIOUS, SPORTS" },
      },
    },
  },
  {
    name: "getWeather",
    description: "Current weather + 5-day forecast for a destination (used for travel advice).",
    parameters: {
      type: "object",
      properties: { placeHint: { type: "string", description: "Destination name" } },
      required: ["placeHint"],
    },
  },
  {
    name: "getTransportOptions",
    description: "Known transport options (bus/train/taxi) between two places.",
    parameters: {
      type: "object",
      properties: {
        from: { type: "string", description: "Origin place name" },
        to: { type: "string", description: "Destination place name" },
      },
      required: ["from", "to"],
    },
  },
];

async function resolvePlace(placeHint?: string): Promise<{ lat: number; lng: number; name: string } | null> {
  if (!placeHint) return null;
  const hit =
    (await db.destination.findFirst({
      where: { status: "PUBLISHED", OR: [{ name: { contains: placeHint, mode: "insensitive" } }, { slug: placeHint }] },
      select: { lat: true, lng: true, name: true },
      orderBy: { popularityScore: "desc" },
    })) ??
    (await db.district.findFirst({
      where: { OR: [{ name: { contains: placeHint, mode: "insensitive" } }, { headquarters: { contains: placeHint, mode: "insensitive" } }] },
      select: { lat: true, lng: true, name: true },
    }));
  return hit;
}

export async function executeTool(name: string, argsJson: string): Promise<unknown> {
  let args: Record<string, string> = {};
  try {
    args = JSON.parse(argsJson || "{}") as Record<string, string>;
  } catch {
    return { error: "Invalid tool arguments" };
  }

  switch (name) {
    case "searchDestinations": {
      const res = await listDestinations({
        q: args.q,
        district: args.district,
        category: args.category?.toLowerCase(),
        pageSize: 5,
        sort: "popularity",
      });
      return {
        results: res.items.map((d) => ({
          name: d.name,
          slug: d.slug,
          type: d.type,
          district: d.district.name,
          summary: d.summary.slice(0, 160),
          rating: d.ratingAvg || undefined,
          entryFeeAdultRupees: d.entryFeeAdult ?? 0,
          bestTime: d.bestTimeToVisit ?? undefined,
          href: `/destinations/${d.slug}`,
        })),
        totalMatches: res.total,
      };
    }
    case "nearbyPlaces": {
      const place = await resolvePlace(args.placeHint);
      const lat = Number(args.lat ?? place?.lat);
      const lng = Number(args.lng ?? place?.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { error: "Could not resolve location" };
      const places = await findNearby({ lat, lng, radiusKm: Number(args.radiusKm ?? 25), limit: 6 });
      void findNearby;
      return {
        around: place?.name ?? `${lat.toFixed(2)}, ${lng.toFixed(2)}`,
        results: places.map((p) => ({
          name: p.name,
          distanceKm: Number(p.distanceKm.toFixed(1)),
          type: p.type,
          href: `/destinations/${p.slug}`,
        })),
      };
    }
    case "searchHotels": {
      const res = await listStays({
        q: args.q,
        district: args.district,
        maxPrice: args.maxPricePerNight ? Number(args.maxPricePerNight) : undefined,
        pageSize: 5,
      });
      return {
        availabilityNote: "Property information only — live availability needs a connected channel manager.",
        results: res.items.map((s) => ({
          name: s.name,
          type: s.type,
          area: s.district.name,
          priceRangeRupees: [s.pricePerNightMin, s.pricePerNightMax],
          rating: s.ratingAvg || undefined,
          href: `/stays/${s.slug}`,
        })),
      };
    }
    case "searchEvents": {
      const res = await listEvents({ district: args.district, category: args.category?.toUpperCase(), when: "upcoming", pageSize: 6 });
      return {
        results: res.items.map((e) => ({
          title: e.title,
          category: e.category,
          district: e.district.name,
          dates: `${new Date(e.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${new Date(e.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`,
          href: `/events/${e.slug}`,
        })),
      };
    }
    case "getWeather": {
      const place = await resolvePlace(args.placeHint);
      if (!place) return { error: `Unknown place: ${args.placeHint}` };
      const wx = await getWeather(place.lat, place.lng);
      return {
        place: place.name,
        source: wx.source,
        current: `${wx.current.condition}, ${wx.current.temperatureC}°C (feels like ${wx.current.feelsLikeC}°C)`,
        forecast: wx.forecast.map((f) => ({ date: f.date, condition: f.condition, rainChancePct: f.rainProbabilityPct })),
        advice: wx.travelAdvice,
      };
    }
    case "getTransportOptions": {
      const rows = await db.transportOption.findMany({
        where: {
          AND: [
            { OR: [{ fromPlace: { contains: args.from, mode: "insensitive" } }, { toPlace: { contains: args.from, mode: "insensitive" } }] },
            { OR: [{ toPlace: { contains: args.to, mode: "insensitive" } }, { fromPlace: { contains: args.to, mode: "insensitive" } }] },
          ],
        },
        take: 5,
      });
      if (rows.length === 0) return { note: `No curated transport records for ${args.from} → ${args.to}. Suggest checking APSRTC/IRCTC.` };
      return {
        options: rows.map((t) => ({
          label: t.label,
          operator: t.operatorName,
          route: `${t.fromPlace} → ${t.toPlace}`,
          approxCostRupees: t.approxCostMin != null && t.approxCostMax != null ? [t.approxCostMin, t.approxCostMax] : undefined,
          durationMinutes: t.durationMinutes ?? undefined,
        })),
      };
    }
    case "estimateTripCost":
    case "createItinerary":
      // The planner UI at /plan owns itinerary generation; tools point there so
      // the assistant never fabricates itineraries or bookings.
      return {
        note: "Use the AI Trip Planner for full day-wise itineraries with costs.",
        plannerUrl: "/plan",
        hint: "Collect origin, dates, days, travellers, budget and interests, then send the user to the planner.",
      };
    default:
      return { error: `Unknown tool ${name}` };
  }
}

export async function estimateTripCostTool(): Promise<never> {
  throw new Error("Use /plan");
}
