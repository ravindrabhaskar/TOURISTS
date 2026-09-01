import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE = "tw_admin";
const SECRET = process.env.ADMIN_SESSION_SECRET || "dev-only-secret-change-in-production";
const TTL_MS = 12 * 3600_000;

function sign(exp: number): string {
  return crypto.createHmac("sha256", SECRET).update(String(exp)).digest("hex");
}

export function createSessionToken(): { value: string; maxAge: number } {
  const exp = Date.now() + TTL_MS;
  return { value: `${exp}.${sign(exp)}`, maxAge: TTL_MS / 1000 };
}

export function verifySessionToken(token?: string | null): boolean {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return false;
  const expStr = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(Number(expStr));
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  return Number(expStr) > Date.now();
}

export async function hasAdminSession(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(COOKIE)?.value);
}

export const SESSION_COOKIE_NAME = COOKIE;
