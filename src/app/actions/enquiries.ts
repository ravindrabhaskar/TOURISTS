"use server";

import { headers } from "next/headers";
import { enquirySchema, sanitizeDeparture, type EnquiryInput } from "@/lib/schema";
import { insertEnquiry, findStored, sanitizeForPublic, INTERNAL_INBOX } from "@/lib/server/db";
import { slidingWindow } from "@/lib/server/rate-limit";
import { makeRef } from "@/lib/format";
import { estimateTotal } from "@/lib/departures";
import { getMergedTrip } from "@/lib/server/content";
import { sendMail, travellerConfirmation, internalNotification } from "@/lib/server/email";

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export interface CreateEnquiryResult {
  ok: boolean;
  ref?: string;
  estTotal?: number;
  errors?: Record<string, string>;
}

export async function createEnquiry(
  input: EnquiryInput & { utm?: Record<string, string> },
): Promise<CreateEnquiryResult> {
  const parsed = enquirySchema.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!errors[key]) errors[key] = issue.message;
    }
    return { ok: false, errors };
  }

  const data = parsed.data;

  if ((data.company_website ?? "") !== "" || data.elapsedMs < 2500) {
    return { ok: true, ref: "TW-XXXXXX", estTotal: 0 };
  }

  const ip = await clientIp();
  if (!slidingWindow(`enquiry:${ip}`, 8, 3600_000)) {
    return {
      ok: false,
      errors: { form: "Too many enquiries from this connection — try again in an hour or call us." },
    };
  }

  const trip = await getMergedTrip(data.tripSlug);
  if (!trip) return { ok: false, errors: { tripSlug: "Pick a trip from the list." } };

  const departure = sanitizeDeparture(data.departure);
  const dep =
    departure && trip.season[new Date(departure + "T00:00:00").getUTCMonth()] === 0
      ? null
      : departure;

  const est = estimateTotal(trip.priceInr, data.travellers, dep);

  const rec = {
    ref: makeRef(),
    createdAt: new Date().toISOString(),
    name: data.name,
    email: data.email.toLowerCase(),
    phone: data.phone,
    travellers: data.travellers,
    tripSlug: trip.slug,
    tripName: trip.name,
    departure: dep,
    estTotal: est.total,
    message: data.message || undefined,
    status: "new" as const,
    note: "",
    ...(Object.keys(data.utm ?? {}).length > 0 ? { utm: data.utm } : {}),
  };

  await insertEnquiry(rec);

  const departureLabel = dep
    ? new Date(dep + "T00:00:00").toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Flexible — planner will suggest dates";

  await sendMail({
    to: rec.email,
    subject: `${rec.ref} received — ${rec.tripName}`,
    text: travellerConfirmation({
      ref: rec.ref,
      name: rec.name,
      tripName: rec.tripName,
      departureLabel,
      travellers: rec.travellers,
      estTotal: rec.estTotal,
    }),
  });
  await sendMail({
    to: INTERNAL_INBOX,
    subject: `New enquiry ${rec.ref} · ${rec.tripName}`,
    text: internalNotification({ ...rec, departureLabel }),
  });

  return { ok: true, ref: rec.ref, estTotal: rec.estTotal };
}

export async function lookupEnquiry(ref: string, email: string) {
  const ip = await clientIp();
  if (!slidingWindow(`lookup:${ip}`, 20, 3600_000)) return null;
  if (!ref.trim() || !email.trim()) return null;
  const stored = await findStored(ref, email);
  return stored ? sanitizeForPublic(stored) : null;
}
