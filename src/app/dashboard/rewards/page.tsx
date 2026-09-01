import { requireViewer } from "@/server/auth/guard";
import { getBalance, getHistory, levelFor, listChallenges, leaderboard } from "@/server/domains/gamification";
import { db } from "@/server/db";
import { Card, SectionHeading } from "@/components/ui/primitives";
import PageHeader from "@/components/ui/PageHeader";

export const metadata = { title: "Rewards" };
export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const viewer = await requireViewer();
  const [balance, history, badges, challenges, top] = await Promise.all([
    getBalance(viewer.id),
    getHistory(viewer.id),
    db.userBadge.findMany({ where: { userId: viewer.id }, include: { badge: true }, orderBy: { earnedAt: "desc" } }),
    listChallenges().catch(() => []),
    leaderboard(5).catch(() => []),
  ]);
  const level = levelFor(balance);
  const progressToNext = level.nextAt ? Math.min(100, Math.round((balance / level.nextAt) * 100)) : 100;

  return (
    <div>
      <PageHeader compact eyebrow="Loyalty" title="Rewards" />

      {/* Level card */}
      <Card className="mt-4 overflow-hidden">
        <div className="bg-gradient-to-br from-brand-600 to-coast-700 p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-white/70">Level {level.level}</p>
          <p className="font-display text-3xl font-semibold">{level.name}</p>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/25" role="progressbar" aria-valuenow={progressToNext} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-spice-400" style={{ width: `${progressToNext}%` }} />
          </div>
          <p className="mt-2 text-sm text-white/85">
            {balance} points
            {level.nextLevelName ? ` · ${Math.max(0, (level.nextAt ?? 0) - balance)} to ${level.nextLevelName}` : " · top tier reached!"}
          </p>
        </div>
      </Card>

      {/* Badges */}
      <section aria-labelledby="badges-heading" className="mt-10">
        <h2 id="badges-heading" className="font-display text-2xl font-semibold">Badges ({badges.length})</h2>
        {badges.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed border-sand-300 p-6 text-sm text-ink-900/60">
            Earn your first badge — plan a trip or publish a review.
          </p>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {badges.map((ub) => (
              <li key={ub.badgeId}>
                <Card className="flex items-center gap-3 p-4">
                  <span aria-hidden className="text-3xl">{ub.badge.icon}</span>
                  <div>
                    <p className="font-semibold">{ub.badge.name} <span className="ml-1 rounded bg-sand-200 px-1.5 py-0.5 text-[10px] font-bold uppercase">{ub.badge.tier.toLowerCase()}</span></p>
                    <p className="text-xs text-ink-900/60">{ub.badge.description}</p>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        {/* Ledger */}
        <section aria-labelledby="ledger-heading">
          <h2 id="ledger-heading" className="font-display text-2xl font-semibold">Points activity</h2>
          {history.length === 0 ? (
            <p className="mt-2 rounded-xl border border-dashed border-sand-300 p-6 text-sm text-ink-900/60">No points yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-sand-100 rounded-2xl border border-sand-200 bg-surface">
              {history.slice(0, 12).map((h) => (
                <li key={h.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span>
                    {h.description}
                    <span className="block text-xs text-ink-900/50">{h.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                  </span>
                  <span className={`font-bold tabular-nums ${h.points >= 0 ? "text-brand-700" : "text-danger"}`}>
                    {h.points >= 0 ? "+" : ""}{h.points}
                    <span className="ml-1.5 block text-right text-[10px] font-normal text-ink-900/40">bal {h.balanceAfter}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Challenges + leaderboard */}
        <div>
          <section aria-labelledby="challenges-heading">
            <h2 id="challenges-heading" className="font-display text-2xl font-semibold">Live challenges</h2>
            {challenges.length === 0 ? (
              <p className="mt-2 rounded-xl border border-dashed border-sand-300 p-6 text-sm text-ink-900/60">No active challenges right now.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {challenges.map((c) => (
                  <li key={c.id}>
                    <Card className="flex items-center justify-between gap-3 p-4">
                      <div>
                        <p className="font-semibold">{c.name}</p>
                        <p className="text-xs text-ink-900/60">{c.description}</p>
                        <p className="mt-1 text-xs font-semibold text-spice-700">+{c.pointsReward} pts · ends {c.endsAt.toLocaleDateString("en-IN")}</p>
                      </div>
                      <span className="shrink-0 rounded-lg bg-sand-100 px-2.5 py-1 text-xs font-medium">{c._count.participants} in</span>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="lb-heading" className="mt-8">
            <SectionHeading title="Leaderboard" subtitle="Quality-weighted: points + published reviews." />
            <ol className="divide-y divide-sand-100 rounded-2xl border border-sand-200 bg-surface">
              {top.map((row, i) => (
                <li key={row.id} className={`flex items-center gap-3 px-4 py-3 ${row.id === viewer.id ? "bg-brand-50/70" : ""}`}>
                  <span className="w-6 text-center font-bold text-ink-900/50">{["🥇", "🥈", "🥉"][i] ?? i + 1}</span>
                  <span aria-hidden>{row.avatarEmoji}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{row.name}{row.id === viewer.id ? " (you)" : ""}</span>
                  <span className="shrink-0 text-xs text-ink-900/60">{row.reviews} reviews</span>
                  <span className="w-14 shrink-0 text-right text-sm font-bold tabular-nums">{row.score.toLocaleString("en-IN")}</span>
                </li>
              ))}
              {top.length === 0 ? <li className="px-4 py-3 text-sm text-ink-900/60">Leaderboard warming up…</li> : null}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
