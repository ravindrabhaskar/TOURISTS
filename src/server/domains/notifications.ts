import { db } from "@/server/db";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";

type Channel = "inApp" | "email" | "push" | "sms";

export type NotifyInput = {
  userId: string;
  type: "BOOKING" | "TRIP" | "REVIEW" | "REWARD" | "SYSTEM" | "ALERT" | "PARTNER";
  title: string;
  body: string;
  linkUrl?: string;
};

/** Unified notification facade. In-app is always written; other channels are
 * dispatched through provider adapters when configured (console transport logs). */
export async function notify(input: NotifyInput): Promise<void> {
  await db.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      linkUrl: input.linkUrl,
    },
  });

  const setting = await db.notificationSetting.findUnique({ where: { userId: input.userId } });
  const channels = (setting?.channels as Partial<Record<Channel, boolean>> | null) ?? { inApp: true, email: true };

  if (channels.email && env.EMAIL_PROVIDER !== "none") {
    await dispatchEmail(input);
  }
}

async function dispatchEmail(input: NotifyInput): Promise<void> {
  // Console transport until SMTP creds provided — see docs/INTEGRATIONS notes.
  logger.info("email.dispatch", { to: `user:${input.userId}`, subject: input.title });
}

export async function listNotifications(userId: string, unreadOnly = false, take = 30) {
  return db.notification.findMany({
    where: { userId, ...(unreadOnly ? { readAt: null } : {}) },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function markRead(userId: string, ids?: string[]): Promise<number> {
  const res = await db.notification.updateMany({
    where: { userId, readAt: null, ...(ids?.length ? { id: { in: ids } } : {}) },
    data: { readAt: new Date() },
  });
  return res.count;
}

export async function unreadCount(userId: string): Promise<number> {
  return db.notification.count({ where: { userId, readAt: null } });
}
