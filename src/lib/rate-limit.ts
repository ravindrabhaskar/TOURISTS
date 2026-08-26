import { errors } from "./http";

type Bucket = { tokens: number; updatedAt: number };

const store = new Map<string, Bucket>();

export type RateLimitResult = { allowed: boolean; retryAfterSec: number };

// Token bucket. In-memory for single-node dev; swap with Redis implementation
// (same interface) before horizontal scaling — see docs/SECURITY.md.
export function rateLimit(key: string, limit: number, windowSec: number): RateLimitResult {
  const now = Date.now();
  const refillPerMs = limit / (windowSec * 1000);
  const bucket = store.get(key) ?? { tokens: limit, updatedAt: now };
  bucket.tokens = Math.min(limit, bucket.tokens + (now - bucket.updatedAt) * refillPerMs);
  bucket.updatedAt = now;

  if (bucket.tokens < 1) {
    store.set(key, bucket);
    return { allowed: false, retryAfterSec: Math.ceil((1 - bucket.tokens) / refillPerMs / 1000) };
  }
  bucket.tokens -= 1;
  store.set(key, bucket);
  if (store.size > 10_000) {
    for (const [k, b] of store) if (b.tokens >= limit - 0.5 && now - b.updatedAt > windowSec * 2000) store.delete(k);
  }
  return { allowed: true, retryAfterSec: 0 };
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

export function guardRate(req: Request, bucket: string, limit: number, windowSec: number): void {
  const { allowed } = rateLimit(`${bucket}:${clientIp(req)}`, limit, windowSec);
  if (!allowed) throw errors.rateLimited();
}
