import { db } from "@/server/db";
import type { CandidatePoi, ItineraryDraft, PlannerInput } from "./engine/types";
import { buildDraft } from "./engine/build";
import { errors } from "@/lib/http";

const INTEREST_CATEGORIES = [
  "temples", "beaches", "heritage", "food", "photography", "wildlife", "nature",
  "adventure", "culture", "festivals", "shopping", "relaxation", "waterfalls",
  "trekking", "museums", "caves",
];

export function normalizeInterests(raw: string[]): string[] {
  return raw.map((i) => i.toLowerCase().trim()).filter((i) => INTEREST_CATEGORIES.includes(i));
}

// Outdoor categories whose enjoyment depends on weather; used by the rescheduler.
const WEATHER_SENSITIVE_TYPES = new Set(["BEACH", "WATERFALL", "HILL_STATION", "VIEWPOINT", "ISLAND", "ADVENTURE_SPOT", "LAKE"]);

export async function loadCandidates(): Promise<CandidatePoi[]> {
  const rows = await db.destination.findMany({
    where: { status: "PUBLISHED", type: { not: "CITY" } },
    select: {
      id: true, slug: true, name: true, type: true, districtId: true, lat: true, lng: true,
      summary: true, visitDurationMin: true, entryFeeAdult: true, ratingAvg: true,
      popularityScore: true, categories: true, tags: true, easyAccess: true,
      openingHours: true,
      district: { select: { name: true } },
    },
    orderBy: { popularityScore: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    type: r.type,
    districtId: r.districtId,
    districtName: r.district.name,
    lat: r.lat,
    lng: r.lng,
    summary: r.summary,
    visitDurationMin: r.visitDurationMin,
    entryFeeAdult: r.entryFeeAdult,
    ratingAvg: r.ratingAvg,
    popularityScore: r.popularityScore,
    categories: r.categories,
    tags: r.tags,
    easyAccess: r.easyAccess,
    weatherSensitive: WEATHER_SENSITIVE_TYPES.has(r.type),
    openingHours: (r.openingHours as CandidatePoi["openingHours"]) ?? null,
  }));
}

export async function generateDraft(input: PlannerInput): Promise<ItineraryDraft> {
  const candidates = await loadCandidates();
  return buildDraft(input, candidates);
}

export async function createTrip(userId: string, input: PlannerInput): Promise<{ tripId: string; shareToken: string }> {
  const draft = await generateDraft(input);
  if (draft.days.length === 0) throw errors.badRequest("Could not build an itinerary for these inputs.");

  const trip = await db.trip.create({
    data: {
      userId,
      title: `${draft.days[0]!.clusterName} Getaway`,
      originName: input.originName,
      originLat: input.originLat,
      originLng: input.originLng,
      startDate: input.startDate,
      endDate: new Date(new Date(input.startDate).getTime() + (input.days - 1) * 86400000),
      days: input.days,
      adults: input.adults,
      children: input.children,
      seniors: input.seniors,
      budgetTotal: input.budgetTotal ?? null,
      transportPreference: input.transportPreference ?? "ANY",
      accommodationPref: input.accommodationPref ?? "MID",
      interests: normalizeInterests(input.interests),
      pace: input.pace,
      foodPreference: input.foodPreference ?? null,
      accessibilityNeeds: input.accessibilityNeeds,
      estimatedCost: draft.cost.total,
      status: "PLANNING",
      shareToken: `sh${crypto.randomUUID().replace(/-/g, "").slice(0, 18)}`,
      days_: {
        create: draft.days.map((day) => ({
          dayNumber: day.dayNumber,
          date: day.date ?? null,
          title: day.title,
          clusterName: day.clusterName,
          items: {
            create: day.items.map((item, idx) => ({
              position: idx,
              itemType: item.itemType,
              startTimeMin: Math.round(item.startTimeMin),
              endTimeMin: Math.round(item.endTimeMin),
              title: item.title,
              description: item.description ?? null,
              reason: item.reason ?? null,
              destinationId: item.destinationId ?? null,
              placeName: item.placeName ?? null,
              lat: item.lat ?? null,
              lng: item.lng ?? null,
              travelFromPrevMinutes: item.travelFromPrevMinutes,
              estimatedCostPerPerson: item.estimatedCostPerPerson,
              bookingRequired: item.bookingRequired,
              weatherSensitive: item.weatherSensitive,
            })),
          },
        })),
      },
    },
    select: { id: true, shareToken: true },
  });

  const { recordReward } = await import("@/server/domains/gamification");
  await recordReward({ userId, reasonCode: "TRIP_PLANNED", points: 25, description: "Created an AI-assisted trip plan", refType: "TRIP", refId: trip.id });
  return { tripId: trip.id, shareToken: trip.shareToken! };
}

export async function getTripForOwner(tripId: string, userId: string) {
  const trip = await db.trip.findUnique({
    where: { id: tripId },
    include: {
      days_: { orderBy: { dayNumber: "asc" }, include: { items: { orderBy: { startTimeMin: "asc" }, include: { destination: { select: { slug: true } } } } } },
      bookings: { select: { id: true, reference: true, titleSnapshot: true, status: true, startsOn: true } },
    },
  });
  if (!trip || trip.userId !== userId) throw errors.notFound("Trip not found");
  return trip;
}

export async function getTripByShareToken(token: string) {
  const trip = await db.trip.findUnique({
    where: { shareToken: token },
    include: {
      days_: { orderBy: { dayNumber: "asc" }, include: { items: { orderBy: { startTimeMin: "asc" }, include: { destination: { select: { slug: true } } } } } },
      user: { select: { name: true } },
    },
  });
  if (!trip) throw errors.notFound("Shared trip not found");
  return trip;
}

export async function listUserTrips(userId: string) {
  return db.trip.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, originName: true, startDate: true, endDate: true, days: true,
      status: true, estimatedCost: true, shareToken: true,
      _count: { select: { days_: true, bookings: true } },
    },
  });
}

export async function deleteTrip(tripId: string, userId: string) {
  const trip = await db.trip.findUnique({ where: { id: tripId }, select: { id: true, userId: true } });
  if (!trip || trip.userId !== userId) throw errors.notFound("Trip not found");
  await db.trip.delete({ where: { id: tripId } });
}
