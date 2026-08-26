import { handle, ok } from "@/lib/http";
import { guardRate } from "@/lib/rate-limit";
import { listDestinations } from "@/server/domains/destinations";
import type { DestinationType } from "@prisma/client";

export async function GET(req: Request) {
  return handle(async () => {
    guardRate(req, "api:destinations", 120, 60);
    const url = new URL(req.url);
    const p = url.searchParams;
    const res = await listDestinations({
      q: p.get("q") ?? undefined,
      district: p.get("district") ?? undefined,
      type: (p.get("type") as DestinationType) ?? undefined,
      category: p.get("category") ?? undefined,
      easyAccess: p.get("easyAccess") === "true" ? true : undefined,
      familyFriendly: p.get("familyFriendly") === "false" ? false : p.get("familyFriendly") === "true" ? true : undefined,
      featured: p.get("featured") === "true",
      maxEntryFee: p.get("maxEntryFee") ? Number(p.get("maxEntryFee")) : undefined,
      sort: (p.get("sort") as "popularity" | "rating" | "name") ?? undefined,
      page: Number(p.get("page") ?? 1),
      pageSize: Number(p.get("pageSize") ?? 12),
    });
    return ok(res);
  });
}
