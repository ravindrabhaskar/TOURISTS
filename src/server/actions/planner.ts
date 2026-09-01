"use server";

import { z } from "zod";
import { requireUser } from "@/server/auth/guard";
import { redirect } from "next/navigation";
import { createTrip } from "@/server/domains/trips/service";
import type { Pace, PlannerInput } from "@/server/domains/trips/engine/types";

const PLAN_PACES = ["RELAXED", "BALANCED", "PACKED"] as const;

const planSchema = z.object({
  originName: z.string().min(2).max(120),
  originLat: z.string().regex(/^-?\d*\.?\d*$/).optional(),
  originLng: z.string().regex(/^-?\d*\.?\d*$/).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  days: z.coerce.number().int().min(1).max(14),
  adults: z.coerce.number().int().min(1).max(20),
  children: z.coerce.number().int().min(0).max(20),
  seniors: z.coerce.number().int().min(0).max(20),
  budgetTotal: z.coerce.number().int().min(1000).optional(),
  pace: z.enum(PLAN_PACES).default("BALANCED"),
  transportPreference: z.enum(["CAR", "BUS", "TRAIN", "ANY"]).default("ANY"),
  accommodationPref: z.enum(["BUDGET", "MID", "PREMIUM", "LUXURY"]).default("MID"),
  interests: z.array(z.string()).max(12),
  accessibilityNeeds: z.array(z.string()).max(6),
  preferredSlugs: z.array(z.string()).max(6),
});

const VALID_ACC: Record<string, "BUDGET" | "MID" | "PREMIUM" | "LUXURY"> = {
  BUDGET: "BUDGET",
  MID: "MID",
  PREMIUM: "PREMIUM",
  LUXURY: "LUXURY",
};

export async function createTripFromPlanAction(formData: FormData): Promise<void> {
  const parsed = planSchema.safeParse({
    originName: formData.get("originName"),
    originLat: formData.get("originLat") || undefined,
    originLng: formData.get("originLng") || undefined,
    startDate: formData.get("startDate"),
    days: formData.get("days"),
    adults: formData.get("adults"),
    children: formData.get("children"),
    seniors: formData.get("seniors"),
    budgetTotal: formData.get("budgetTotal") || undefined,
    pace: formData.get("pace"),
    transportPreference: formData.get("transportPreference"),
    accommodationPref: formData.get("accommodationPref"),
    interests: formData.getAll("interests").map(String),
    accessibilityNeeds: formData.getAll("accessibilityNeeds").map(String),
    preferredSlugs: String(formData.get("preferredSlugs") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  });

  if (!parsed.success) {
    redirect("/plan?error=" + encodeURIComponent("Please check the trip details."));
  }

  const d = parsed.data;
  const accommodationPref = VALID_ACC[d.accommodationPref] ?? "MID";
  const lat = d.originLat ? Number(d.originLat) : 0;
  const lng = d.originLng ? Number(d.originLng) : 0;

  const input: PlannerInput = {
    originName: d.originName,
    originLat: Number.isFinite(lat) ? lat : 0,
    originLng: Number.isFinite(lng) ? lng : 0,
    startDate: new Date(d.startDate + "T00:00:00"),
    days: d.days,
    adults: d.adults,
    children: d.children,
    seniors: d.seniors,
    budgetTotal: d.budgetTotal,
    transportPreference: d.transportPreference,
    accommodationPref,
    interests: d.interests,
    pace: d.pace as Pace,
    accessibilityNeeds: d.accessibilityNeeds,
    preferredSlugs: d.preferredSlugs,
  };

  let tripId: string | null = null;
  let failure: string | null = null;
  try {
    const user = await requireUser();
    const trip = await createTrip(user.id, input);
    tripId = trip.tripId;
  } catch (e) {
    const redirectLike = e && typeof e === "object" && "digest" in e && String((e as { digest?: string }).digest).startsWith("NEXT_REDIRECT");
    if (redirectLike) throw e;
    const err = e as { message?: string };
    failure = typeof err.message === "string" && err.message.length < 200 ? err.message : "Could not build your itinerary. Please try again.";
  }

  if (failure) redirect(`/plan?error=${encodeURIComponent(failure)}`);
  redirect(`/dashboard/trips/${tripId}`);
}
