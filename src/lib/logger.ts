type Level = "debug" | "info" | "warn" | "error";

const REDACT_KEYS = ["password", "passwordHash", "token", "secret", "authorization", "cookie", "codeHash"];

function redact(meta: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    out[k] = REDACT_KEYS.some((r) => k.toLowerCase().includes(r)) ? "[REDACTED]" : v;
  }
  return out;
}

function log(level: Level, msg: string, meta: Record<string, unknown> = {}) {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, msg, ...redact(meta) });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) =>
    process.env.NODE_ENV !== "production" && log("debug", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => log("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log("error", msg, meta),
};
