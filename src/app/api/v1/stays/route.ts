import { handle, ok } from "@/lib/http";
import { guardRate } from "@/lib/rate-limit";
import { listStays } from "@/server/domains/stays";
import type { PriceLevel, StayType } from "@prisma/client";

export async function GET(req: Request) {
  return handle(async () => {
    guardRate(req, "api:stays", 120, 60);
    const p = new URL(req.url).searchParams;
    const res = await listStays({
      q: p.get("q") ?? undefined,
      district: p.get("district") ?? undefined,
      type: (p.get("type") as StayType) ?? undefined,
      priceLevel: (p.get("priceLevel") as PriceLevel) ?? undefined,
      maxPrice: p.get("maxPrice") ? Number(p.get("maxPrice")) : undefined,
      sort: (p.get("sort") as "price_asc" | "price_desc" | "rating") ?? undefined,
      page: Number(p.get("page") ?? 1),
      pageSize: Number(p.get("pageSize") ?? 12),
    });
    return ok({ ...res, availabilityNote: "Property information only — live availability requires a connected channel manager." });
  });
}
