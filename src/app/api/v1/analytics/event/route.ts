import { z } from "zod";
import { handle, ok } from "@/lib/http";
import { guardRate } from "@/lib/rate-limit";
import { trackEvent } from "@/server/domains/recommendations";
import { getViewer } from "@/server/auth/guard";

const schema = z.object({
  name: z.string().min(2).max(60),
  anonymousId: z.string().max(64).optional(),
  props: z.record(z.string(), z.unknown()).optional(),
  path: z.string().max(300).optional(),
});

export async function POST(req: Request) {
  return handle(async () => {
    guardRate(req, "api:analytics", 120, 60);
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return ok({ recorded: false }); // analytics must never break UX
    const viewer = await getViewer();
    await trackEvent({ ...parsed.data, userId: viewer?.id ?? null, referrer: req.headers.get("referer") });
    return ok({ recorded: true });
  });
}
