import { db } from "@/server/db";
import { errors } from "@/lib/http";
import type { Prisma, ReviewTarget } from "@prisma/client";

export async function createReview(input: {
  userId: string;
  targetType: ReviewTarget;
  destinationSlug?: string;
  staySlug?: string;
  packageId?: string;
  eventId?: string;
  rating: number;
  title?: string;
  body: string;
}) {
  if (input.rating < 1 || input.rating > 5) throw errors.badRequest("Rating must be 1–5.");
  if (input.body.trim().length < 10) throw errors.badRequest("Review is too short.");

  const data: Prisma.ReviewCreateInput = {
    user: { connect: { id: input.userId } },
    targetType: input.targetType,
    rating: Math.round(input.rating),
    title: input.title?.slice(0, 140),
    body: input.body.trim().slice(0, 4000),
    ...(input.destinationSlug ? { destination: { connect: { slug: input.destinationSlug } } } : {}),
    ...(input.staySlug ? { stay: { connect: { slug: input.staySlug } } } : {}),
    ...(input.packageId ? { package: { connect: { id: input.packageId } } } : {}),
    status: "PENDING",
  };

  const review = await db.review.create({ data });
  return review;
}

export async function listApprovedReviews(opts: {
  targetType: ReviewTarget;
  destinationId?: string;
  stayId?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(20, Math.max(1, opts.pageSize ?? 10));
  const where: Prisma.ReviewWhereInput = {
    targetType: opts.targetType,
    status: "APPROVED",
    ...(opts.destinationId ? { destinationId: opts.destinationId } : {}),
    ...(opts.stayId ? { stayId: opts.stayId } : {}),
  };
  const [items, total] = await Promise.all([
    db.review.findMany({
      where,
      orderBy: [{ helpfulCount: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { user: { select: { name: true, avatarEmoji: true } }, helpfulVotes: { select: { userId: true } } },
    }),
    db.review.count({ where }),
  ]);
  return { items, total, page, pageSize };
}

export async function markHelpful(reviewId: string, userId: string) {
  await db.helpfulVote.upsert({
    where: { reviewId_userId: { reviewId, userId } },
    create: { reviewId, userId },
    update: {},
  });
  const count = await db.helpfulVote.count({ where: { reviewId } });
  await db.review.update({ where: { id: reviewId }, data: { helpfulCount: count } });
  return count;
}

export async function reportReview(reviewId: string) {
  await db.review.update({ where: { id: reviewId }, data: { reportCount: { increment: 1 } } });
}

/** Recompute cached rating aggregates on the reviewed entity after moderation. */
export async function recomputeAggregates(review: {
  targetType: ReviewTarget;
  destinationId: string | null;
  stayId: string | null;
  packageId: string | null;
}): Promise<void> {
  if (review.destinationId) {
    const agg = await db.review.aggregate({
      where: { destinationId: review.destinationId, status: "APPROVED" },
      _avg: { rating: true },
      _count: { _all: true },
    });
    await db.destination.update({
      where: { id: review.destinationId },
      data: { ratingAvg: Number((agg._avg.rating ?? 0).toFixed(2)), ratingCount: agg._count._all },
    });
  }
  if (review.stayId) {
    const agg = await db.review.aggregate({
      where: { stayId: review.stayId, status: "APPROVED" },
      _avg: { rating: true },
      _count: { _all: true },
    });
    await db.stay.update({
      where: { id: review.stayId },
      data: { ratingAvg: Number((agg._avg.rating ?? 0).toFixed(2)), ratingCount: agg._count._all },
    });
  }
}
