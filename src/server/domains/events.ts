import { db } from "@/server/db";
import { errors } from "@/lib/http";
import type { Prisma } from "@prisma/client";

export type EventFilters = {
  when?: "upcoming" | "this-month" | "all";
  district?: string;
  category?: string;
  page?: number;
  pageSize?: number;
};

export async function listEvents(f: EventFilters = {}) {
  const page = Math.max(1, f.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, f.pageSize ?? 12));
  const now = new Date();
  let dateWhere: Prisma.EventWhereInput = {};
  if (f.when === "upcoming") dateWhere = { endDate: { gte: now } };
  else if (f.when === "this-month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    dateWhere = { endDate: { gte: start }, startDate: { lt: end } };
  }
  const where: Prisma.EventWhereInput = {
    status: "PUBLISHED",
    ...dateWhere,
    ...(f.district ? { district: { OR: [{ slug: f.district }, { code: f.district.toUpperCase() }] } } : {}),
    ...(f.category ? { category: f.category as never } : {}),
  };
  const [items, total] = await Promise.all([
    db.event.findMany({
      where,
      orderBy: { startDate: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { district: { select: { name: true, slug: true } }, destination: { select: { name: true, slug: true } } },
    }),
    db.event.count({ where }),
  ]);
  return { items, total, page, pageSize };
}

export async function getEventBySlug(slug: string) {
  const e = await db.event.findUnique({
    where: { slug },
    include: {
      district: { select: { name: true, slug: true } },
      destination: { select: { name: true, slug: true, summary: true } },
    },
  });
  if (!e || e.status !== "PUBLISHED") throw errors.notFound("Event not found");
  return e;
}

export async function upcomingEvents(limit = 6) {
  return db.event.findMany({
    where: { status: "PUBLISHED", endDate: { gte: new Date() } },
    orderBy: { startDate: "asc" },
    take: limit,
    include: { district: { select: { name: true, slug: true } } },
  });
}
