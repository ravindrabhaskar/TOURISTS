"use client";

import { useState, useTransition } from "react";
import { toggleFavoriteAction } from "@/server/actions/engage";

export function FavoriteButton({
  targetType,
  slug,
  initial = false,
  signedIn = true,
}: {
  targetType: "DESTINATION" | "STAY";
  slug: string;
  initial?: boolean;
  signedIn?: boolean;
}) {
  const [favorited, setFavorited] = useState(initial);
  const [pending, startTransition] = useTransition();

  if (!signedIn) {
    return (
      <a href={`/signin?next=/destinations/${slug}`} className="inline-flex items-center gap-1.5 rounded-xl border border-sand-200 bg-surface px-3 py-2 text-sm font-semibold text-ink-900/70 hover:border-brand-300">
        ♡ Save
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await toggleFavoriteAction(targetType, slug);
          setFavorited(res.favorited);
        })
      }
      aria-pressed={favorited}
      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
        favorited ? "border-spice-500 bg-spice-50 text-spice-700" : "border-sand-200 bg-surface text-ink-900/70 hover:border-brand-300"
      } disabled:opacity-60`}
    >
      {favorited ? "♥ Saved" : "♡ Save"}
    </button>
  );
}
