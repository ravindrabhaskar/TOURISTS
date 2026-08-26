import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env, isProd } from "@/lib/env";
import type { Role } from "./rbac";

const secret = () => new TextEncoder().encode(env.AUTH_SECRET);

export type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  role: Role;
  tv: number; // tokenVersion — logout-all bumps this on the user row
};

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("sanchari")
    .setExpirationTime(`${env.SESSION_TTL_HOURS}h`)
    .sign(secret());
}

/** Edge-safe verification (no DB). Used by middleware and server helpers. */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: "sanchari" });
    if (typeof payload.sub !== "string") return null;
    return {
      sub: payload.sub,
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
      role: payload.role as Role,
      tv: Number(payload.tv ?? 0),
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await signSessionToken(payload);
  const store = await cookies();
  store.set(env.SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: env.SESSION_TTL_HOURS * 3600,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(env.SESSION_COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function readSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(env.SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
