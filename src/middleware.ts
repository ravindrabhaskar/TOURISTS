import { NextResponse, type NextRequest } from "next/server";

const SECURITY_HEADERS: Record<string, string> = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(self), geolocation=(self)",
};

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  res.headers.set("x-request-id", requestId);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.headers.set(k, v);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
