import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "./logger";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const errors = {
  badRequest: (m = "Invalid request", details?: unknown) => new ApiError(400, "BAD_REQUEST", m, details),
  unauthorized: (m = "Sign in required") => new ApiError(401, "UNAUTHORIZED", m),
  forbidden: (m = "You do not have permission for this action") => new ApiError(403, "FORBIDDEN", m),
  notFound: (m = "Not found") => new ApiError(404, "NOT_FOUND", m),
  conflict: (m = "Conflict") => new ApiError(409, "CONFLICT", m),
  rateLimited: (m = "Too many requests. Please slow down.") => new ApiError(429, "RATE_LIMITED", m),
  unavailable: (m = "Service temporarily unavailable") => new ApiError(503, "SERVICE_UNAVAILABLE", m),
};

export function requestId(): string {
  return globalThis.crypto.randomUUID();
}

export function ok<T>(data: T, status = 200, headers?: HeadersInit): NextResponse {
  return NextResponse.json({ ok: true as const, data }, { status, headers });
}

export function fail(err: unknown): NextResponse {
  const rid = requestId();
  if (err instanceof ApiError) {
    if (err.status >= 500) logger.error("api.error", { code: err.code, rid });
    return NextResponse.json(
      { ok: false as const, error: { code: err.code, message: err.message, details: err.details }, requestId: rid },
      { status: err.status },
    );
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        ok: false as const,
        error: { code: "VALIDATION_ERROR", message: "Validation failed", details: err.flatten() },
        requestId: rid,
      },
      { status: 422 },
    );
  }
  logger.error("api.unhandled", { rid, error: String(err) });
  return NextResponse.json(
    { ok: false as const, error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." }, requestId: rid },
    { status: 500 },
  );
}

export function handle(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  return fn().catch(fail);
}
