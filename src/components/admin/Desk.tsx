"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Download,
  Inbox,
  LogOut,
  PenLine,
  RotateCcw,
  Search,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { STATUS_LABEL } from "@/lib/data/site";
import type { EnquiryRecord, EnquiryStatus } from "@/lib/types";
import type { StoredEnquiry } from "@/lib/server/db";
import { csvEscape, formatDate, formatINR } from "@/lib/format";
import {
  logoutAction,
  resetDemoAction,
  saveNoteAction,
  saveOverrideAction,
  setStatusAction,
} from "@/app/actions/admin";
import { cn } from "@/lib/cn";

const STATUSES: EnquiryStatus[] = ["new", "planning", "quoted", "confirmed", "archived"];
const NOW = Date.now();

const STATUS_STYLE: Record<EnquiryStatus, string> = {
  new: "bg-accent-soft text-accent",
  planning: "bg-gold/15 text-gold",
  quoted: "bg-pine-soft text-pine",
  confirmed: "bg-ok/10 text-ok",
  archived: "bg-surface2 text-muted",
};

interface StudioTrip {
  slug: string;
  name: string;
  region: string;
  basePriceInr: number;
  baseBlurb: string;
  priceInr: number;
  blurb: string;
  hidden: boolean;
  overridden: boolean;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Inbox;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        <Icon size={17} className="text-accent" aria-hidden />
      </div>
      <p className="mt-2 truncate font-display text-2xl font-semibold" title={value}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}

function MonthlyChart({ records }: { records: EnquiryRecord[] }) {
  const months = [0, 1, 2, 3, 4, 5].map((back) => {
    const d = new Date(NOW);
    d.setMonth(d.getMonth() - back);
    return {
      label: d.toLocaleDateString("en-IN", { month: "short" }),
      m: d.getMonth(),
      y: d.getFullYear(),
      count: 0,
    };
  }).reverse();
  for (const r of records) {
    const d = new Date(r.createdAt);
    const hit = months.find((mo) => mo.m === d.getMonth() && mo.y === d.getFullYear());
    if (hit) hit.count++;
  }
  const max = Math.max(1, ...months.map((m) => m.count));

  return (
    <div className="card p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        Enquiries · last 6 months
      </p>
      <div
        className="mt-4 flex h-28 items-end gap-3"
        role="img"
        aria-label={months.map((m) => `${m.label}: ${m.count}`).join(", ")}
      >
        {months.map((m) => (
          <div key={m.label} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="font-mono text-[10px] text-muted">{m.count}</span>
            <div
              className={cn("w-full rounded-t-md", m.count > 0 ? "bg-pine" : "bg-line")}
              style={{ height: `${Math.max(6, (m.count / max) * 100)}%` }}
            />
            <span className="font-mono text-[10px] text-muted">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Studio({
  trips,
}: {
  trips: StudioTrip[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(trips);
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);

  const save = async (row: StudioTrip) => {
    setSavingSlug(row.slug);
    await saveOverrideAction({
      slug: row.slug,
      priceInr: row.priceInr,
      blurb: row.blurb,
      hidden: row.hidden,
    });
    setSavingSlug(null);
    setSavedSlug(row.slug);
    setTimeout(() => setSavedSlug(null), 2000);
    router.refresh();
  };

  return (
    <div className="space-y-3">
      <p className="rounded-xl bg-surface2 px-4 py-3 text-sm text-muted">
        Edits here update the live catalogue without a deploy — prices and blurbs apply
        to the trip page and listing within a minute.
      </p>
      {rows.map((row, i) => (
        <div key={row.slug} className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <Link href={`/trips/${row.slug}`} className="font-medium hover:text-accent">
                {row.name}
              </Link>
              <span className="ml-2 font-mono text-[11px] uppercase tracking-wide text-muted">
                {row.region}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {row.overridden && (
                <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-semibold text-gold">
                  edited
                </span>
              )}
              {savedSlug === row.slug && (
                <span className="rounded-full bg-ok/10 px-2 py-0.5 text-[11px] font-semibold text-ok">
                  saved
                </span>
              )}
              <button
                type="button"
                onClick={() => void save(row)}
                disabled={savingSlug === row.slug}
                className="btn btn-outline min-h-9 px-4 text-xs disabled:opacity-60"
              >
                <PenLine size={13} aria-hidden />
                {savingSlug === row.slug ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-[10rem_1fr_auto]">
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted">
                Price / person (₹)
              </span>
              <input
                type="number"
                min={5000}
                max={1000000}
                step={500}
                value={row.priceInr}
                onChange={(e) => {
                  const v = Number(e.target.value) || row.basePriceInr;
                  setRows((rs) => rs.map((r, j) => (j === i ? { ...r, priceInr: v } : r)));
                }}
                aria-label={`Price for ${row.name}`}
                className="field min-h-10 font-mono"
              />
              {row.priceInr !== row.basePriceInr && (
                <span className="mt-0.5 block text-[10px] text-muted line-through">
                  was {formatINR(row.basePriceInr)}
                </span>
              )}
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted">
                Card blurb
              </span>
              <textarea
                rows={2}
                maxLength={160}
                value={row.blurb}
                onChange={(e) => {
                  const v = e.target.value;
                  setRows((rs) => rs.map((r, j) => (j === i ? { ...r, blurb: v } : r)));
                }}
                aria-label={`Blurb for ${row.name}`}
                className="field resize-none text-sm"
              />
            </label>
            <label className="flex cursor-pointer items-center gap-2 self-end pb-1 text-sm">
              <input
                type="checkbox"
                checked={row.hidden}
                onChange={(e) => {
                  const v = e.target.checked;
                  setRows((rs) => rs.map((r, j) => (j === i ? { ...r, hidden: v } : r)));
                }}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              Hidden
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Desk({
  records,
  studioTrips,
}: {
  records: StoredEnquiry[];
  studioTrips: StudioTrip[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"enquiries" | "studio">("enquiries");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | EnquiryStatus>("all");
  const [openNote, setOpenNote] = useState<string | null>(null);

  const filtered = records.filter((r) => {
    if (status !== "all" && r.status !== status) return false;
    if (!q.trim()) return true;
    const hay = `${r.ref} ${r.name} ${r.email} ${r.tripName}`.toLowerCase();
    return hay.includes(q.toLowerCase().trim());
  });

  const weekMs = 7 * 86400000;
  const newThisWeek = records.filter(
    (r) => new Date(r.createdAt).getTime() >= NOW - weekMs,
  ).length;
  const pipeline = records
    .filter((r) => r.status !== "archived")
    .reduce((sum, r) => sum + r.estTotal, 0);

  const byTrip = new Map<string, number>();
  records.forEach((r) => byTrip.set(r.tripName, (byTrip.get(r.tripName) ?? 0) + 1));
  const topTrip = [...byTrip.entries()].sort((a, b) => b[1] - a[1])[0];

  const exportCsv = () => {
    const header = [
      "Ref",
      "Created",
      "Name",
      "Email",
      "Phone",
      "Trip",
      "Travellers",
      "Estimate INR",
      "Status",
      "Source",
      "Note",
    ];
    const rows = filtered.map((r) =>
      [
        r.ref,
        r.createdAt.slice(0, 10),
        r.name,
        r.email,
        r.phone,
        r.tripName,
        String(r.travellers),
        String(r.estTotal),
        STATUS_LABEL[r.status],
        r.utm?.utm_source ?? "",
        r.note ?? "",
      ]
        .map(csvEscape)
        .join(","),
    );
    const blob = new Blob([[header.map(csvEscape).join(","), ...rows].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sanchari-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container-x py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-accent">
            Operator desk
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold">The enquiry pipeline</h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void resetDemoAction().then(() => router.refresh())}
            className="btn btn-outline min-h-10"
          >
            <RotateCcw size={14} aria-hidden /> Reset demo data
          </button>
          <button
            type="button"
            onClick={() => void logoutAction().then(() => router.refresh())}
            className="btn btn-outline min-h-10"
          >
            <LogOut size={14} aria-hidden /> Sign out
          </button>
        </div>
      </header>

      <div className="mt-6 flex gap-1 border-b border-line" role="tablist" aria-label="Desk sections">
        {(
          [
            ["enquiries", `Enquiries (${records.length})`],
            ["studio", "Content studio"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "-mb-px min-h-11 border-b-2 px-4 text-sm font-medium transition-colors",
              tab === key
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "enquiries" ? (
        <>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Inbox} label="Total enquiries" value={String(records.length)} />
            <StatCard icon={TrendingUp} label="New this week" value={String(newThisWeek)} />
            <StatCard
              icon={Users}
              label="Most enquired"
              value={topTrip ? topTrip[0] : "—"}
              sub={topTrip ? `${topTrip[1]} enquiries` : undefined}
            />
            <StatCard
              icon={Wallet}
              label="Pipeline value"
              value={formatINR(pipeline)}
              sub="Non-archived estimates"
            />
          </div>

          <MonthlyChart records={records} />

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <label className="relative flex-1 sm:max-w-xs">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                aria-hidden
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, email, reference…"
                aria-label="Search enquiries"
                className="field pl-9"
              />
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              aria-label="Filter by status"
              className="field w-auto cursor-pointer"
            >
              <option value="all">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <button type="button" onClick={exportCsv} className="btn btn-outline ml-auto min-h-11">
              <Download size={15} aria-hidden /> Export CSV ({filtered.length})
            </button>
          </div>

          <div className="card mt-4 overflow-x-auto">
            <table className="w-full min-w-[58rem] text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-surface2 font-mono text-[11px] uppercase tracking-wide text-muted">
                  <th scope="col" className="px-4 py-3">Ref</th>
                  <th scope="col" className="px-4 py-3">Received</th>
                  <th scope="col" className="px-4 py-3">Traveller</th>
                  <th scope="col" className="px-4 py-3">Trip</th>
                  <th scope="col" className="px-4 py-3 text-right">Pax</th>
                  <th scope="col" className="px-4 py-3 text-right">Estimate</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Note</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted">
                      Nothing matches that filter.
                    </td>
                  </tr>
                )}
                {filtered.map((r) => (
                  <tr
                    key={r.ref}
                    className="border-b border-line align-top last:border-0 hover:bg-surface2/40"
                  >
                    <td className="px-4 py-3 font-mono font-semibold">
                      {r.ref}
                      {r.utm?.utm_source && (
                        <span className="mt-1 block text-[10px] font-normal normal-case text-muted">
                          via {r.utm.utm_source}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">
                      {formatDate(r.createdAt.slice(0, 10))}
                    </td>
                    <td className="max-w-44 px-4 py-3">
                      <p className="truncate font-medium" title={r.name}>{r.name}</p>
                      <p className="truncate text-xs text-muted" title={r.email}>{r.email}</p>
                    </td>
                    <td className="max-w-52 px-4 py-3">
                      <Link href={`/trips/${r.tripSlug}`} className="hover:text-accent">
                        {r.tripName}
                      </Link>
                      {r.departure && (
                        <p className="text-xs text-muted">{formatDate(r.departure)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{r.travellers}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatINR(r.estTotal)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={r.status}
                        onChange={(e) =>
                          void setStatusAction({ ref: r.ref, status: e.target.value as EnquiryStatus }).then(
                            () => router.refresh(),
                          )
                        }
                        aria-label={`Status for ${r.ref}`}
                        className={cn(
                          "min-h-9 cursor-pointer rounded-full border-none px-3 py-1.5 text-xs font-semibold outline-none",
                          STATUS_STYLE[r.status],
                        )}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {openNote === r.ref ? (
                        <textarea
                          autoFocus
                          defaultValue={r.note ?? ""}
                          onBlur={(e) => {
                            void saveNoteAction(r.ref, e.target.value).then(() => router.refresh());
                            setOpenNote(null);
                          }}
                          rows={3}
                          aria-label={`Internal note for ${r.ref}`}
                          className="field w-56 resize-y text-xs"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setOpenNote(r.ref)}
                          className="max-w-44 truncate rounded-md px-1 text-left text-xs text-muted underline decoration-dotted hover:text-accent"
                        >
                          {r.note || "Add note"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-muted">
            Enquiries persist on the server (JSON file store at{" "}
            <code className="font-mono">.data/enquiries.json</code>) — swap{" "}
            <code className="font-mono">lib/server/db.ts</code> for Supabase or any API
            and everything above works unchanged. Emails go out via Resend when{" "}
            <code className="font-mono">RESEND_API_KEY</code> is set; otherwise they print
            to the server console.
          </p>
        </>
      ) : (
        <div className="mt-7">
          <Studio trips={studioTrips} />
        </div>
      )}
    </div>
  );
}
