import { z } from "zod";
import { db } from "@/server/db";
import { errors, handle, ok } from "@/lib/http";
import { requireUser } from "@/server/auth/guard";
import { markRead, unreadCount } from "@/server/domains/notifications";

export async function GET(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const p = new URL(req.url).searchParams;
    const [items, unread] = await Promise.all([
      db.notification.findMany({
        where: { userId: user.id, ...(p.get("unread") === "true" ? { readAt: null } : {}) },
        orderBy: { createdAt: "desc" },
        take: Math.min(50, Number(p.get("take") ?? 30)),
      }),
      unreadCount(user.id),
    ]);
    return ok({ items, unread });
  });
}

const readSchema = z.object({ ids: z.array(z.string()).max(100).optional() });

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const parsed = readSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) throw errors.badRequest("Invalid payload.");
    const updated = await markRead(user.id, parsed.data.ids);
    return ok({ markedRead: updated });
  });
}
