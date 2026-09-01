import { z } from "zod";
import { TRIPS } from "@/lib/data/trips";

export const enquirySchema = z.object({
  name: z.string().trim().min(2, "We need a name to greet you properly.").max(80),
  email: z.string().trim().email("That email doesn't look complete."),
  phone: z
    .string()
    .trim()
    .regex(/^[\d\s+()-]{8,16}$/, "A reachable phone number, please."),
  travellers: z.number().int().min(1).max(16),
  tripSlug: z
    .string()
    .trim()
    .refine((s) => s === "" || TRIPS.some((t) => t.slug === s), "Unknown trip."),
  departure: z.string().nullable(),
  message: z.string().trim().max(600).optional().or(z.literal("")),
  company_website: z.string().max(0).optional(),
  elapsedMs: z.number().int().min(0),
  utm: z.record(z.string(), z.string()).optional(),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

export function sanitizeDeparture(d: string | null): string | null {
  if (!d || d === "flexible") return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
}
