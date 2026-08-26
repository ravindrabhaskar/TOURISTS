import { db } from "@/server/db";
import { logger } from "@/lib/logger";
import type { Prisma } from "@prisma/client";

// Configurable point values — seeded into Config table; admin-editable (docs: admin config).
export const DEFAULT_POINTS: Record<string, number> = {
  TRIP_PLANNED: 25,
  TRIP_COMPLETED: 100,
  REVIEW_APPROVED: 40,
  DESTINATION_VISITED: 30,
  NEW_DISTRICT_EXPLORED: 20,
  EVENT_ATTENDED: 50,
  DAILY_LOGIN_STREAK: 5,
};

export const LEVELS = [
  { level: 1, name: "Wanderer", minPoints: 0 },
  { level: 2, name: "Explorer", minPoints: 250 },
  { level: 3, name: "Pathfinder", minPoints: 750 },
  { level: 4, name: "Traveller", minPoints: 1500 },
  { level: 5, name: "Sanchari", minPoints: 3000 },
  { level: 6, name: "Legend of Andhra", minPoints: 6000 },
];

export type RewardInput = {
  userId: string;
  reasonCode: keyof typeof DEFAULT_POINTS | string;
  points?: number;
  description: string;
  refType?: string;
  refId?: string;
};

/**
 * Immutable points ledger. Balance is derived from the ledger — never mutated
 * in place — so every change is explainable and auditable.
 */
export async function recordReward(input: RewardInput): Promise<{ awarded: number; balanceAfter: number }> {
  const defaultPoints = DEFAULT_POINTS[input.reasonCode] ?? 0;
  let points = input.points ?? defaultPoints;
  if (!DEFAULT_POINTS[input.reasonCode] && input.points === undefined) {
    logger.warn("gamification.unknown_reason", { reasonCode: input.reasonCode });
    points = 0;
  }
  if (points === 0) return { awarded: 0, balanceAfter: await getBalance(input.userId) };

  return db.$transaction(async (tx) => {
    // Daily cap per reason to blunt farming.
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayTotal = await tx.rewardLedgerEntry.aggregate({
      where: { userId: input.userId, reasonCode: input.reasonCode, createdAt: { gte: startOfDay } },
      _sum: { points: true },
    });
    const dailyCap = 3 * (Math.abs(DEFAULT_POINTS[input.reasonCode] ?? Math.abs(points)));
    if ((todayTotal._sum.points ?? 0) + points > dailyCap) {
      return { awarded: 0, balanceAfter: await getBalanceIn(tx, input.userId) };
    }
    const balanceBefore = await getBalanceIn(tx, input.userId);
    const balanceAfter = balanceBefore + points;
    await tx.rewardLedgerEntry.create({
      data: {
        userId: input.userId,
        action: points > 0 ? "EARN" : "ADJUST",
        points,
        reasonCode: input.reasonCode,
        description: input.description,
        refType: input.refType ?? null,
        refId: input.refId ?? null,
        balanceAfter,
      },
    });
    await evaluateBadges(tx, input.userId);
    return { awarded: points, balanceAfter };
  });
}

async function getBalanceIn(tx: Prisma.TransactionClient, userId: string): Promise<number> {
  const agg = await tx.rewardLedgerEntry.aggregate({ where: { userId }, _sum: { points: true } });
  return agg._sum.points ?? 0;
}

export async function getBalance(userId: string): Promise<number> {
  return getBalanceIn(db, userId);
}

export async function getHistory(userId: string, take = 25) {
  return db.rewardLedgerEntry.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export function levelFor(points: number) {
  let current = LEVELS[0]!;
  for (const l of LEVELS) if (points >= l.minPoints) current = l;
  const next = LEVELS.find((l) => l.minPoints > points);
  return { ...current, nextLevelName: next?.name, nextAt: next?.minPoints };
}

/** Declarative badge criteria evaluated on every reward event. */
async function evaluateBadges(tx: Prisma.TransactionClient, userId: string): Promise<void> {
  const badges = await db.badge.findMany();
  const owned = new Set((await db.userBadge.findMany({ where: { userId }, select: { badgeId: true } })).map((b) => b.badgeId));

  for (const badge of badges) {
    if (owned.has(badge.id)) continue;
    const ok = await criteriaMet(tx, userId, badge.criteriaJson as Record<string, unknown>);
    if (ok) {
      await db.userBadge.create({ data: { userId, badgeId: badge.id } }).catch(() => undefined); // idempotent
      const meta = {
        userId,
        type: "REWARD" as const,
        title: `Badge unlocked: ${badge.name}`,
        body: badge.description,
        linkUrl: "/dashboard/rewards",
      };
      await tx.notification.create({ data: meta });
    }
  }
}

async function criteriaMet(tx: Prisma.TransactionClient, userId: string, criteria: Record<string, unknown>): Promise<boolean> {
  switch (criteria.type) {
    case "LEDGER_MIN": {
      const agg = await tx.rewardLedgerEntry.aggregate({ where: { userId }, _sum: { points: true } });
      return (agg._sum.points ?? 0) >= Number(criteria.min ?? Infinity);
    }
    case "TRIPS_CREATED":
      return (await tx.trip.count({ where: { userId } })) >= Number(criteria.count ?? Infinity);
    case "REVIEWS_APPROVED":
      return (
        (await tx.review.count({ where: { userId, status: "APPROVED" } })) >= Number(criteria.count ?? Infinity)
      );
    case "DISTRICTS_IN_REVIEWS": {
      const rows = await tx.review.findMany({
        where: { userId, status: "APPROVED", destination: { isNot: null } },
        select: { destination: { select: { districtId: true } } },
      });
      return new Set(rows.map((r) => r.destination?.districtId)).size >= Number(criteria.districts ?? Infinity);
    }
    case "CATEGORY_REVIEWED": {
      const count = await tx.review.count({
        where: { userId, status: "APPROVED", destination: { categories: { has: String(criteria.category) } } },
      });
      return count >= Number(criteria.count ?? Infinity);
    }
    default:
      return false;
  }
}

export async function leaderboard(limit = 10) {
  // Quality-weighted: ledger points + approved-review signal. Raw like-counts are
  // deliberately NOT the ranking input.
  const rows = await db.$queryRaw<Array<{ id: string; name: string; avatarEmoji: string | null; points: bigint; reviews: bigint }>>`
    SELECT u.id, u.name, u."avatarEmoji",
           COALESCE(l.points, 0) AS points,
           COALESCE(r.reviews, 0) AS reviews
    FROM "User" u
    LEFT JOIN (SELECT "userId", SUM(points) AS points FROM "RewardLedgerEntry" GROUP BY "userId") l ON l."userId" = u.id
    LEFT JOIN (SELECT "userId", COUNT(*) AS reviews FROM "Review" WHERE status = 'APPROVED' GROUP BY "userId") r ON r."userId" = u.id
    WHERE u."isActive" = true AND u.role = 'TOURIST'
    ORDER BY (COALESCE(l.points, 0) + COALESCE(r.reviews, 0) * 10) DESC
    LIMIT ${limit}`;
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    avatarEmoji: r.avatarEmoji ?? "🧭",
    points: Number(r.points),
    reviews: Number(r.reviews),
    score: Number(r.points) + Number(r.reviews) * 10,
  }));
}

export async function listChallenges() {
  return db.challenge.findMany({
    where: { isActive: true, endsAt: { gte: new Date() } },
    orderBy: { endsAt: "asc" },
    include: { _count: { select: { participants: true } } },
  });
}

export async function joinChallenge(userId: string, code: string) {
  const challenge = await db.challenge.findUnique({ where: { code } });
  if (!challenge || !challenge.isActive || challenge.endsAt < new Date()) throw new Error("Challenge unavailable");
  await db.userChallenge.upsert({
    where: { userId_challengeId: { userId, challengeId: challenge.id } },
    create: { userId, challengeId: challenge.id },
    update: {},
  });
}
