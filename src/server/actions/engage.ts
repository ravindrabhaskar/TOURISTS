"use server";

import { z } from "zod";
import { db } from "@/server/db";
import { errors } from "@/lib/http";
import { requireUser } from "@/server/auth/guard";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createReview, markHelpful as markHelpfulDomain } from "@/server/domains/reviews";
import { recordReward } from "@/server/domains/gamification";
import { notify } from "@/server/domains/notifications";

export async function toggleFavoriteAction(targetType: string, slug: string): Promise<{ favorited: boolean }> {
  const user = await requireUser();
  const key =
    targetType === "DESTINATION"
      ? { destination: { slug } }
      : targetType === "STAY"
        ? { stay: { slug } }
        : null;
  if (!key) throw errors.badRequest("Unsupported favourite target.");

  const where = targetType === "DESTINATION" ? { userId: user.id, targetType: "DESTINATION" as const, destination: { slug } } : { userId: user.id, targetType: "STAY" as const, stay: { slug } };
  const existing = await db.favorite.findFirst({ where });

  if (existing) {
    await db.favorite.delete({ where: { id: existing.id } });
    return { favorited: false };
  }
  try {
    await db.favorite.create({
      data:
        targetType === "DESTINATION"
          ? { userId: user.id, targetType: "DESTINATION" as const, destination: { connect: { slug } } }
          : { userId: user.id, targetType: "STAY" as const, stay: { connect: { slug } } },
    } as never);
  } catch {
    // unique race — treat as already-favorited
    return { favorited: true };
  }
  return { favorited: true };
}

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(140).optional(),
  body: z.string().min(10).max(4000),
});

export async function submitReviewAction(formData: FormData): Promise<void> {
  const targetType = String(formData.get("targetType") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/");
  let failure: string | null = null;

  try {
    const user = await requireUser();
    const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) throw errors.badRequest(parsed.error.issues[0]?.message ?? "Invalid review.");
    if (!["DESTINATION", "STAY"].includes(targetType)) throw errors.badRequest("Unsupported review target.");

    await createReview({
      userId: user.id,
      targetType: targetType as never,
      ...(targetType === "DESTINATION" ? { destinationSlug: slug } : { staySlug: slug }),
      ...parsed.data,
    });
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e && String((e as { digest?: string }).digest).startsWith("NEXT_REDIRECT")) {
      throw e; // re-auth redirect from requireUser must propagate
    }
    failure = e instanceof Error ? e.message : "Could not submit review.";
  }

  if (failure) redirect(`${redirectTo}?reviewError=${encodeURIComponent(failure)}`);
  redirect(`${redirectTo}?reviewSubmitted=1`);
}

export async function markHelpfulAction(reviewId: string): Promise<number> {
  const user = await requireUser();
  return markHelpfulDomain(reviewId, user.id);
}

/** Called by admin moderation; exported here for reuse in actions/admin.ts via import. */
export async function rewardAndNotifyApprovedReview(reviewId: string): Promise<void> {
  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { id: true, userId: true, title: true, body: true, rating: true },
  });
  if (!review) return;
  await recordReward({
    userId: review.userId,
    reasonCode: "REVIEW_APPROVED",
    points: undefined,
    description: `Review approved: ${review.title ?? review.body.slice(0, 40)}`,
    refType: "REVIEW",
    refId: review.id,
  }).catch(() => undefined);
  await notify({
    userId: review.userId,
    type: "REVIEW",
    title: "Your review is live",
    body: "Thanks for sharing — your review has been published.",
    linkUrl: "/dashboard",
  }).catch(() => undefined);
  void revalidatePath("/");
}
