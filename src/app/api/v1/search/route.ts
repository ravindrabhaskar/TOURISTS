import { handle, ok } from "@/lib/http";
import { guardRate } from "@/lib/rate-limit";
import { universalSearch } from "@/server/domains/search";

export async function GET(req: Request) {
  return handle(async () => {
    guardRate(req, "api:search", 60, 60);
    const q = new URL(req.url).searchParams.get("q") ?? "";
    const results = await universalSearch(q);
    return ok({ query: q, results });
  });
}
