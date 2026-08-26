import { PrismaClient } from "@prisma/client";
import { logger } from "@/lib/logger";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [{ emit: "event", level: "error" }, { emit: "event", level: "warn" }],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// Structured DB error logging without leaking query params containing user data.
db.$on("error" as never, (e: unknown) => {
  const err = e as { message?: string };
  logger.error("db.error", { message: err.message });
});
