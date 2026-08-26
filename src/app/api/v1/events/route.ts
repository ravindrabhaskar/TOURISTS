import { handle, ok } from "@/lib/http";
import { guardRate } from "@/lib/rate-limit";
import { listEvents } from "@/server/domains/events";

export async function GET(req: Request) {
  return handle(async () => {
    guardRate(req, "api:events", 120, 60);
    const p = new URL(req.url).searchParams;
    const res = await listEvents({
      when: (p.get("when") as "upcoming" | "this-month" | "all") ?? "upcoming",
      district: p.get("district") ?? undefined,
      category: p.get("category")?.toUpperCase(),
      page: Number(p.get("page") ?? 1),
      pageSize: Number(p.get("pageSize") ?? 12),
    });
    return ok(res);
  });
}
