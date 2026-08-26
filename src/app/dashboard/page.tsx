import Link from "next/link";
import { db } from "@/server/db";
import { getViewer } from "@/server/auth/guard";
import { getBalance, levelFor } from "@/server/domains/gamification";
import { unreadCount } from "@/server/domains/notifications";
import { Card } from "@/components/ui/primitives";
import { formatINR, formatDate } from "@/lib/utils";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const viewer = (await getViewer())!;
  const [tripCount, upcomingTrip, points, unread] = await Promise.all([
    db.trip.count({ where: { userId: viewer.id } }),
    db.trip.findFirst({ where: { userId: viewer.id, startDate: { gte: new Date() }, status: { in: ["PLANNING", "CONFIRMED"] } }, orderBy: { startDate: "asc" }, select: { id: true, title: true, startDate: true, days: true, estimatedCost: true } }),
    getBalance(viewer.id),
    unreadCount(viewer.id),
  ]);
  const level = levelFor(points);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Vanakkam, {viewer.name.split(" ")[0]} 👋</h1>
      <p className="mt-1 text-ink-900/70">Your Andhra Pradesh journeys at a glance.</p>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Trips planned", value: String(tripCount), href: "/dashboard/trips", icon: "🗺️" },
          {
            label: "Next trip",
            value: upcomingTrip ? formatDate(upcomingTrip.startDate) : "None yet",
            href: upcomingTrip ? `/dashboard/trips/${upcomingTrip.id}` : "/plan",
            icon: "📅",
          },
          { label: `${level.name} · Level ${level.level}`, value: `${points} pts`, href: "/dashboard/rewards", icon: "🏅" },
          { label: "Unread alerts", value: String(unread), href: "/dashboard/notifications", icon: "🔔" },
        ].map((stat) => (
          <Card key={stat.label} className="p-5">
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-900/50">
              <span aria-hidden>{stat.icon}</span> {stat.label}
            </dt>
            <dd className="mt-1.5 flex items-end justify-between">
              <span className="text-xl font-bold text-ink-950">{stat.value}</span>
              <Link href={stat.href} className="text-xs font-semibold text-brand-700 hover:text-brand-800">View →</Link>
            </dd>
          </Card>
        ))}
      </dl>

      {upcomingTrip ? (
        <section className="mt-10" aria-labelledby="next-trip-heading">
          <h2 id="next-trip-heading" className="font-display text-2xl font-bold">Your next adventure</h2>
          <Card className="mt-3 flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <p className="font-semibold text-lg">{upcomingTrip.title}</p>
              <p className="mt-0.5 text-sm text-ink-900/70">
                {upcomingTrip.days} day(s) · starting {formatDate(upcomingTrip.startDate)}
                {upcomingTrip.estimatedCost ? ` · est. ${formatINR(upcomingTrip.estimatedCost)}` : ""}
              </p>
            </div>
            <Link href={`/dashboard/trips/${upcomingTrip.id}`} className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
              Open itinerary
            </Link>
          </Card>
        </section>
      ) : (
        <section className="mt-10 rounded-2xl border border-dashed border-sand-300 p-10 text-center">
          <p className="text-4xl">✨</p>
          <h2 className="mt-2 font-display text-xl font-bold">No trips planned yet</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink-900/70">
            Tell the AI planner your dates and interests — it builds a realistic day-wise itinerary with costs.
          </p>
          <Link href="/plan" className="mt-4 inline-flex rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700">
            Plan my first trip
          </Link>
        </section>
      )}
    </div>
  );
}
