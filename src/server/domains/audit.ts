import { db } from "@/server/db";
import { logger } from "@/lib/logger";

export type AuditInput = {
  actorUserId?: string | null;
  actorEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
  userAgent?: string | null;
};

/** Immutable audit trail for sensitive operations. Throws on failure by design —
 * an admin mutation that cannot be audited must not succeed. */
export async function audit(input: AuditInput): Promise<void> {
  await db.auditLog.create({
    data: {
      actorUserId: input.actorUserId ?? null,
      actorEmail: input.actorEmail ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      before: (input.before ?? undefined) as never,
      after: (input.after ?? undefined) as never,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
    },
  });
}

/** Best-effort audit for non-critical paths. */
export async function auditSoft(input: AuditInput): Promise<void> {
  try {
    await audit(input);
  } catch (e) {
    logger.warn("audit.soft_failed", { action: input.action, error: String(e) });
  }
}
