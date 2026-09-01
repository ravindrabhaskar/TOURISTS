import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/server/db";
import { getViewer } from "@/server/auth/guard";
import { sandboxPayAction } from "@/server/actions/bookings";
import { Card } from "@/components/ui/primitives";
import { formatINR, formatDate } from "@/lib/utils";

export const metadata = { title: "Sandbox checkout" };

export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin?next=/dashboard/bookings");

  const { id } = await params;
  const booking = await db.booking.findUnique({
    where: { id },
    include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!booking || booking.userId !== viewer.id) notFound();
  if (booking.status === "CONFIRMED") redirect("/dashboard/bookings?paid=1");

  return (
    <div className="container-x max-w-lg py-12">
      <Card className="overflow-hidden">
        <div className="bg-sand-100 px-6 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-spice-600">Sandbox payment gateway</p>
          <p className="mt-1 text-xs text-ink-900/60">Simulated checkout for demonstration — no real money moves until live credentials are configured.</p>
        </div>
        <div className="px-6 py-5">
          <h1 className="font-display text-xl font-semibold">{booking.titleSnapshot}</h1>
          <dl className="mt-4 space-y-1.5 text-sm">
            <div className="flex justify-between"><dt className="text-ink-900/60">Reference</dt><dd className="font-mono font-semibold">{booking.reference}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-900/60">Starts</dt><dd>{booking.startsOn ? formatDate(booking.startsOn) : "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-900/60">{booking.type === "STAY_ROOM" ? `${booking.quantity} night(s)` : `× ${booking.quantity}`}</dt><dd>—</dd></div>
            <div className="mt-3 flex justify-between border-t border-sand-200 pt-3 text-base">
              <dt className="font-semibold">Total due</dt>
              <dd className="text-xl font-bold text-brand-700">{formatINR(booking.totalAmount)}</dd>
            </div>
          </dl>

          <form action={sandboxPayAction} className="mt-6 space-y-3">
            <input type="hidden" name="bookingId" value={booking.id} />
            <button type="submit" name="outcome" value="success" className="w-full rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-700">
              Pay {formatINR(booking.totalAmount)} (simulate success)
            </button>
            <button type="submit" name="outcome" value="fail" className="w-full rounded-xl border border-sand-300 px-4 py-3 font-medium text-ink-900/70 hover:border-spice-400 hover:text-spice-700">
              Simulate failed payment
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-ink-900/50">
            Changed your mind?{" "}
            <Link href="/dashboard/bookings" className="text-brand-700 hover:text-brand-800">Back to bookings</Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
