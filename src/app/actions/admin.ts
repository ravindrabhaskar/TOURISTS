"use server";

import crypto from "crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { headers } from "next/headers";
import { slidingWindow } from "@/lib/server/rate-limit";
import {
  createSessionToken,
  hasAdminSession,
  SESSION_COOKIE_NAME,
} from "@/lib/server/session";
import { mutateEnquiry, resetEnquiries } from "@/lib/server/db";
import { writeOverride } from "@/lib/server/content";
import { getViewer } from "@/server/auth/guard";
import { can } from "@/server/auth/rbac";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "sanchari";

/**
 * Desk access: either the shared operator password (for planners with no
 * platform account) or a platform account carrying admin.dashboard. Every
 * mutation below goes through this so the two routes in stay equivalent.
 */
async function hasDeskAccess(): Promise<boolean> {
  if (await hasAdminSession()) return true;
  const viewer = await getViewer();
  return can(viewer?.role, "admin.dashboard");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function loginAction(password: string): Promise<{ ok: boolean; error?: string }> {
  const ip = await clientIp();
  if (!slidingWindow(`login:${ip}`, 10, 900_000)) {
    return { ok: false, error: "Too many attempts. Try again in 15 minutes." };
  }
  if (!safeEqual(password, ADMIN_PASSWORD)) {
    return { ok: false, error: "That's not it." };
  }
  const token = createSessionToken();
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token.value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: token.maxAge,
  });
  revalidatePath("/admin");
  return { ok: true };
}

export async function logoutAction() {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
  revalidatePath("/admin");
}

const statusSchema = z.object({
  ref: z.string().trim().min(4),
  status: z.enum(["new", "planning", "quoted", "confirmed", "archived"]),
});

export async function setStatusAction(input: z.infer<typeof statusSchema>) {
  if (!(await hasDeskAccess())) return { ok: false };
  const parsed = statusSchema.parse(input);
  const ok = await mutateEnquiry(parsed.ref, { status: parsed.status });
  revalidatePath("/admin");
  return { ok };
}

export async function saveNoteAction(ref: string, note: string) {
  if (!(await hasDeskAccess())) return { ok: false };
  const clean = z.string().trim().max(400).parse(note);
  const ok = await mutateEnquiry(ref, { note: clean });
  revalidatePath("/admin");
  return { ok };
}

export async function resetDemoAction() {
  if (!(await hasDeskAccess())) return { ok: false };
  await resetEnquiries();
  revalidatePath("/admin");
  return { ok: true };
}

const overrideSchema = z.object({
  slug: z.string().trim(),
  priceInr: z.number().int().min(5000).max(1000000).optional(),
  blurb: z.string().trim().max(160).optional(),
  hidden: z.boolean().optional(),
});

export async function saveOverrideAction(input: z.infer<typeof overrideSchema>) {
  if (!(await hasDeskAccess())) return { ok: false };
  const parsed = overrideSchema.parse(input);
  const patch: Record<string, unknown> = {};
  if (parsed.priceInr !== undefined) patch.priceInr = parsed.priceInr;
  if (parsed.blurb !== undefined && parsed.blurb !== "") patch.blurb = parsed.blurb;
  if (parsed.hidden !== undefined) patch.hidden = parsed.hidden;
  if (parsed.blurb === "") patch.blurb = "";
  await writeOverride(parsed.slug, patch as never);
  revalidatePath("/trips");
  revalidatePath(`/trips/${parsed.slug}`);
  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true };
}

