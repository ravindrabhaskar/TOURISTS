import { z } from "zod";
import { errors, handle, ok } from "@/lib/http";
import { guardRate, rateLimit, clientIp } from "@/lib/rate-limit";
import { assistantTurn } from "@/server/domains/ai/gateway";
import { getViewer } from "@/server/auth/guard";

const bodySchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().min(8).max(64),
  language: z.enum(["en", "te", "hi"]).optional(),
});

export async function POST(req: Request) {
  return handle(async () => {
    guardRate(req, "api:assistant", 15, 60);
    const raw = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) throw errors.badRequest("Invalid assistant payload.", parsed.error.flatten());

    const viewer = await getViewer();
    if (!viewer && !rateLimit(`assistant-anon:${clientIp(req)}`, 10, 3600).allowed) {
      throw errors.rateLimited("Sign in for more assistant messages.");
    }

    const res = await assistantTurn({
      sessionId: parsed.data.sessionId,
      userId: viewer?.id ?? null,
      userMessage: parsed.data.message,
      language: parsed.data.language,
    });
    return ok(res);
  });
}
