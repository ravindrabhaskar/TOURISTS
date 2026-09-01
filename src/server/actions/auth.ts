"use server";

import { db } from "@/server/db";
import { hashPassword, verifyPassword, passwordPolicyError } from "@/server/auth/password";
import { setSessionCookie, clearSessionCookie } from "@/server/auth/session";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { rateLimit } from "@/lib/rate-limit";
import { auditSoft } from "@/server/domains/audit";

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

function safeNext(raw: FormDataEntryValue | null): string {
  const next = typeof raw === "string" ? raw : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export async function signInAction(formData: FormData): Promise<void> {
  const ip = await clientIp();
  if (!rateLimit(`signin:${ip}`, 10, 300).allowed) {
    redirect("/signin?error=" + encodeURIComponent("Too many attempts. Try again in a few minutes."));
  }
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));
  if (!email || !password) redirect("/signin?error=" + encodeURIComponent("Email and password are required."));

  const user = await db.user.findUnique({ where: { email } });
  const okPw = await verifyPassword(password, user?.passwordHash ?? null);
  if (!user || !okPw || !user.isActive) {
    await auditSoft({ action: "auth.signin_failed", entityType: "User", actorEmail: email });
    redirect("/signin?error=" + encodeURIComponent("Invalid email or password."));
  }

  await setSessionCookie({ sub: user.id, email: user.email, name: user.name, role: user.role, tv: user.tokenVersion });
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await auditSoft({ action: "auth.signin", entityType: "User", entityId: user.id, actorUserId: user.id, actorEmail: user.email, ip });
  redirect(next);
}

export async function signUpAction(formData: FormData): Promise<void> {
  const ip = await clientIp();
  if (!rateLimit(`signup:${ip}`, 5, 600).allowed) {
    redirect("/signup?error=" + encodeURIComponent("Too many attempts. Please wait a bit."));
  }
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  const interestsRaw = formData.getAll("interests").map(String);

  if (name.length < 2) redirect("/signup?error=" + encodeURIComponent("Please enter your name."));
  if (!/^\S+@\S+\.\S+$/.test(email)) redirect("/signup?error=" + encodeURIComponent("Enter a valid email address."));
  const pwErr = passwordPolicyError(password);
  if (pwErr) redirect("/signup?error=" + encodeURIComponent(pwErr));

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) redirect("/signup?error=" + encodeURIComponent("An account with this email already exists."));

  const user = await db.user.create({
    data: { name: name.slice(0, 80), email, passwordHash: await hashPassword(password), interests: interestsRaw },
  });
  await setSessionCookie({ sub: user.id, email: user.email, name: user.name, role: user.role, tv: user.tokenVersion });
  await auditSoft({ action: "auth.signup", entityType: "User", entityId: user.id, actorUserId: user.id, actorEmail: user.email, ip });

  // Welcome bonus through the ledger keeps gamification consistent.
  const { recordReward } = await import("@/server/domains/gamification");
  await recordReward({ userId: user.id, reasonCode: "WELCOME", points: 50, description: "Welcome to Sanchari!" }).catch(() => undefined);
  redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/");
}
