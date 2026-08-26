"use client";

import { useState } from "react";
import { submitReviewAction } from "@/server/actions/engage";

export function ReviewForm({
  targetType,
  slug,
  redirectTo,
  signedIn,
  submitted,
  error,
}: {
  targetType: "DESTINATION" | "STAY";
  slug: string;
  redirectTo: string;
  signedIn: boolean;
  submitted?: boolean;
  error?: string;
}) {
  const [rating, setRating] = useState(0);

  if (!signedIn) {
    return (
      <div className="rounded-2xl border border-dashed border-sand-300 p-6 text-center text-sm text-ink-900/70">
        <a href={`/signin?next=${encodeURIComponent(redirectTo)}`} className="font-semibold text-brand-700 hover:text-brand-800">
          Sign in
        </a>{" "}
        to write a review.
      </div>
    );
  }

  return (
    <form action={submitReviewAction} className="rounded-2xl border border-sand-200 bg-white p-6">
      <h3 className="font-semibold">Write a review</h3>
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      {error ? <p role="alert" className="mt-2 rounded-lg bg-spice-50 px-3 py-2 text-sm text-spice-700">{error}</p> : null}
      <fieldset className="mt-4">
        <legend className="text-sm font-medium">Your rating</legend>
        <input type="hidden" name="rating" value={rating || ""} />
        <div className="mt-1 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              className={`text-2xl leading-none transition-transform hover:scale-110 ${n <= rating ? "text-spice-500" : "text-sand-300"}`}
            >
              ★
            </button>
          ))}
        </div>
      </fieldset>
      <label className="mt-4 block text-sm font-medium">
        Title <span className="font-normal text-ink-900/50">(optional)</span>
        <input name="title" maxLength={140} className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2 focus:border-brand-400" />
      </label>
      <label className="mt-3 block text-sm font-medium">
        Your experience
        <textarea
          name="body"
          required
          minLength={10}
          maxLength={4000}
          rows={4}
          placeholder="What should other travellers know?"
          className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2 focus:border-brand-400"
        />
      </label>
      <button
        type="submit"
        disabled={!rating}
        className="mt-4 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        Submit review
      </button>
      {submitted ? null : <p className="mt-2 text-xs text-ink-900/50">Reviews are moderated before publishing.</p>}
    </form>
  );
}

export type ReviewItem = {
  id: string;
  rating: number;
  title?: string | null;
  body: string;
  helpfulCount: number;
  createdAt: string;
  userName: string;
  userAvatar?: string | null;
};

export function ReviewsList({ reviews }: { reviews: ReviewItem[] }) {
  return (
    <ul className="space-y-4">
      {reviews.map((r) => (
        <li key={r.id}>
          <article className="rounded-2xl border border-sand-200 bg-white p-5">
            <header className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <span aria-hidden>{r.userAvatar ?? "🧭"}</span> {r.userName}
              </p>
              <time className="text-xs text-ink-900/50">{new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</time>
            </header>
            <p aria-label={`${r.rating} out of 5 stars`} className="mt-1 text-spice-500">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
            {r.title ? <h4 className="mt-2 font-semibold text-ink-950">{r.title}</h4> : null}
            <p className="mt-1 text-sm leading-relaxed text-ink-900/80">{r.body}</p>
            <footer className="mt-3 text-xs font-medium text-ink-900/60">👍 {r.helpfulCount} found this helpful</footer>
          </article>
        </li>
      ))}
    </ul>
  );
}
