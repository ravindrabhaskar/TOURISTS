import Link from "next/link";
import { getViewer } from "@/server/auth/guard";
import { listUserBookings } from "@/server/domains/bookings";
import { cancelBookingAction } from "@/server/actions/user";
import { Card } from "@/components/ui/primitives";
import { formatINR, formatDate } from "@/lib/utils";

export const metadata = { title: "My bookings" };
export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  PENDING_PAYMENT: "bg-spice-100 text-spice-700",
  CONFIRMED: "bg-brand-100 text-brand-800",
  CANCELLED: "bg-sand-200 text-ink-900/60",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-coast-100 text-coast-700",
  COMPLETED: "bg-sand-200 text-ink-900/70",
};

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ paid?: string; error?: string; cancelled?: string }> }) {
  const sp = await searchParams;
  const viewer = (await getViewer())!;
  const bookings = await listUserBookings(viewer.id);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Bookings</h1>
      <p className="mt-1 text-sm text-ink-900/70">
        Payments run through a <strong>sandbox gateway</strong> until live credentials are configured — every flow below is fully exercised.
      </p>

      {sp.paid ? (
        <p role="status" className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-800">🎉 Payment successful — booking confirmed!</p>
      ) : null}
      {sp.cancelled ? (
        <p role="status" className="mt-4 rounded-xl bg-coast-100 px-4 py-3 text-sm font-medium text-coast-700">Booking cancelled.</p>
      ) : null}
      {sp.error ? (
        <p role="alert" className="mt-4 rounded-xl bg-spice-50 px-4 py-3 text-sm text-spice-700">{sp.error}</p>
      ) : null}

      {bookings.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-sand-300 p-10 text-center text-ink-900/60">
          No bookings yet. Browse <Link href="/stays" className="font-semibold text-brand-700">stays</Link> to make your first.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {bookings.map((b) => {
            const latestPayment = b.payments[0];
            return (
              <li key={b.id}>
                <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-semibold">
                      <span className="font-mono text-sm">{b.reference}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLE[b.status] ?? ""}`}>
                        {b.status.replace(/_/g, " ").toLowerCase()}
                      </span>
                    </p>
                    <p className="mt-0.5 truncate text-sm">{b.titleSnapshot} · × {b.quantity}</p>
                    <p className="mt-0.5 text-xs text-ink-900/50">
                      {b.startsOn ? `${formatDate(b.startsOn)}${b.nights ? ` · ${b.nights} night(s)` : ""} · ` : ""}
                      created {formatDate(b.createdAt)}
                      {latestPayment ? ` · ${latestPayment.provider}${latestPayment.method ? `/${latestPayment.method}` : ""}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <span className="text-lg font-bold text-brand-700">{formatINR(b.totalAmount)}</span>
                    {(b.status === "PENDING_PAYMENT" || b.status === "FAILED") && (
                      <Link href={`/pay/${b.id}`} className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${b.status === "FAILED" ? "bg-spice-600 hover:bg-spice-700" : "bg-brand-600 hover:bg-brand-700"}`}>
                        {b.status === "FAILED" ? "Retry payment" : "Pay now"}
                      </Link>
                    )}
                    {(b.status === "PENDING_PAYMENT" || b.status === "CONFIRMED") && (
                      <form action={cancelBookingAction}>
                        <input type="hidden" name="bookingId" value={b.id} />
                        <button type="submit" className="rounded-xl border border-sand-200 px-3 py-2 text-sm font-medium text-red-600 hover:border-red-300">
                          Cancel
                        </button>
                      </form>
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
