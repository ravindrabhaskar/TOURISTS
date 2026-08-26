"use server";

import { z } from "zod";
import { db } from "@/server/db";
import { requireUser } from "@/server/auth/guard";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { applyTripModification, type ModificationInput } from "@/server/domains/trips/modify-service";
import { deleteTrip as deleteTripDomain } from "@/server/domains/trips/service";
import { cancelBooking as cancelBookingDomain } from "@/server/domains/bookings";
import { markRead as markNotificationsReadDomain } from "@/server/domains/notifications";

export async function applyTripModificationAction(formData: FormData): Promise<void> {
  await requireUser();
  const tripId = String(formData.get("tripId") ?? "");
  const payload: ModificationInput = (() => {
    const op = String(formData.get("op") ?? "");
    const dayNumber = Number(formData.get("dayNumber") ?? 1);
    if (op === "remove") return { op: "remove", match: String(formData.get("match") ?? ""), dayNumber };
    if (op === "shift") return { op: "shift", deltaMinutes: Number(formData.get("delta") ?? 0), dayNumber };
    if (op === "add") return { op: "add", slug: String(formData.get("slug") ?? ""), dayNumber };
    return { op: "weather", dayNumber };
  })();

  let failure: string | null = null;
  try {
    const user = await requireUser();
    await applyTripModification(user.id, tripId, payload);
  } catch (e) {
    if (isRedirect(e)) throw e;
    failure = e instanceof Error ? e.message.slice(0, 160) : "Modification failed.";
  }
  revalidatePath(`/dashboard/trips/${tripId}`);
  if (failure) redirect(`/dashboard/trips/${tripId}?error=${encodeURIComponent(failure)}`);
}

function isRedirect(e: unknown): boolean {
  return Boolean(e && typeof e === "object" && "digest" in e && String((e as { digest?: string }).digest).startsWith("NEXT_REDIRECT"));
}

export async function deleteTripAction(formData: FormData): Promise<void> {
  try {
    const user = await requireUser();
    await deleteTripDomain(String(formData.get("tripId")), user.id);
  } catch {
    // ignore
  }
  redirect("/dashboard/trips");
}

export async function cancelBookingAction(formData: FormData): Promise<void> {
  let failure: string | null = null;
  try {
    const user = await requireUser();
    await cancelBookingDomain(String(formData.get("bookingId")), user.id);
  } catch (e) {
    if (isRedirect(e)) throw e;
    failure = e instanceof Error ? e.message : "Cancellation failed.";
  }
  revalidatePath("/dashboard/bookings");
  redirect(failure ? `/dashboard/bookings?error=${encodeURIComponent(failure)}` : "/dashboard/bookings?cancelled=1");
}

export async function markNotificationsReadAction(formData: FormData): Promise<void> {
  try {
    const user = await requireUser();
    const idsRaw = formData.getAll("ids").map(String).filter(Boolean);
    await markNotificationsReadDomain(user.id, idsRaw.length > 0 ? idsRaw : undefined);
  } catch {
    // non-critical
  }
  revalidatePath("/dashboard/notifications");
  redirect("/dashboard/notifications");
}

const settingsSchema = z.object({
  name: z.string().min(2).max(80),
  preferredLanguage: z.enum(["en", "te", "hi"]),
  travelPace: z.enum(["RELAXED", "BALANCED", "PACKED"]).optional(),
  foodPreference: z.string().max(60).optional(),
  interests: z.array(z.string()).max(12),
});

export async function updateSettingsAction(formData: FormData): Promise<void> {
  const parsed = settingsSchema.safeParse({
    name: formData.get("name"),
    preferredLanguage: formData.get("preferredLanguage"),
    travelPace: formData.get("travelPace") || undefined,
    foodPreference: formData.get("foodPreference") || undefined,
    interests: formData.getAll("interests").map(String),
  });
  if (!parsed.success) redirect("/dashboard/settings?error=" + encodeURIComponent("Please check the form values."));

  try {
    const user = await requireUser();
    await db.user.update({ where: { id: user.id }, data: parsed.data });
  } catch (e) {
    if (isRedirect(e)) throw e;
    redirect("/dashboard/settings?error=" + encodeURIComponent("Could not save settings."));
  }
  revalidatePath("/dashboard/settings");
  redirect("/dashboard/settings?saved=1");
}
