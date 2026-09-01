"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Check, Download, Search } from "lucide-react";
import { useToast } from "@/lib/store";
import { STATUS_FLOW, STATUS_LABEL } from "@/lib/data/site";
import type { EnquiryRecord, EnquiryStatus } from "@/lib/types";
import { formatDate, formatINR } from "@/lib/format";
import { buildConfirmation, downloadText } from "@/lib/confirmation";
import { lookupEnquiry } from "@/app/actions/enquiries";
import { cn } from "@/lib/cn";

function StatusTimeline({ status }: { status: EnquiryStatus }) {
  if (status === "archived") {
    return (
      <p className="rounded-xl bg-surface2 px-4 py-3 text-sm text-muted">
        This enquiry was archived by the desk. Reply to any planner email to reopen it.
      </p>
    );
  }
  const idx = STATUS_FLOW.indexOf(status);
  return (
    <ol className="flex flex-col gap-0 sm:flex-row sm:items-center" aria-label="Progress">
      {STATUS_FLOW.map((s, i) => (
        <li key={s} className="flex items-center gap-2 sm:flex-1">
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-bold",
              i <= idx ? "border-ok bg-ok text-white" : "border-line text-muted",
            )}
          >
            {i <= idx ? <Check size={14} aria-hidden /> : i + 1}
          </span>
          <span className={cn("text-xs font-medium", i <= idx ? "text-ink" : "text-muted")}>
            {STATUS_LABEL[s]}
          </span>
          {i < STATUS_FLOW.length - 1 && (
            <span
              className={cn(
                "mx-1 hidden h-px flex-1 sm:block",
                i < idx ? "bg-ok" : "bg-line",
              )}
              aria-hidden
            />
          )}
        </li>
      ))}
    </ol>
  );
}

function LookupInner() {
  const sp = useSearchParams();
  const { push } = useToast();
  const [ref, setRef] = useState(sp.get("ref") ?? "");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<EnquiryRecord | null>(null);
  const [error, setError] = useState("");
  const [tried, setTried] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const r = sp.get("ref");
    if (!r) return;
    const id = requestAnimationFrame(() => {
      setRef(r.toUpperCase());
      document.getElementById("lk-email")?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [sp]);

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    setLoading(true);
    setError("");
    try {
      const rec = await lookupEnquiry(ref, email);
      if (!rec) {
        setError(
          "No enquiry matches that reference and email together. Check both — the email must be the one you enquired with.",
        );
        setResult(null);
        return;
      }
      setResult(rec);
    } catch {
      setError("Couldn't reach the desk just now — try again in a moment.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-10">
      <header className="max-w-xl">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-accent">
          Find my enquiry
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold">Where is it now?</h1>
        <p className="mt-3 leading-relaxed text-muted">
          Enter your reference and the email you used. We match both — a reference on
          its own isn&apos;t enough to read someone else&apos;s plans.
        </p>
      </header>

      <form onSubmit={lookup} noValidate className="card mt-8 grid max-w-2xl gap-4 p-6 sm:grid-cols-[1fr_1fr_auto]">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Reference</span>
          <input
            value={ref}
            onChange={(e) => setRef(e.target.value.toUpperCase())}
            placeholder="SAN-XXXXXX"
            className="field font-mono uppercase"
            aria-label="Enquiry reference"
            required
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Email used</span>
          <input
            id="lk-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="field"
            aria-label="Email used for the enquiry"
            autoComplete="email"
            required
          />
        </label>
        <button type="submit" disabled={loading} className="btn btn-primary self-end disabled:opacity-60">
          <Search size={15} aria-hidden /> {loading ? "Looking…" : "Find it"}
        </button>
      </form>

      {tried && error && (
        <p role="alert" className="mt-4 max-w-2xl rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      {result && (
        <div className="fade-up card mt-8 max-w-2xl p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
                {result.ref}
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold">
                {result.tripName}
              </h2>
              <p className="mt-1 text-sm text-muted">
                Sent {formatDate(result.createdAt.slice(0, 10))} ·{" "}
                {result.travellers} traveller{result.travellers > 1 ? "s" : ""} ·{" "}
                estimate {formatINR(result.estTotal)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                downloadText(`sanchari-${result.ref}.txt`, buildConfirmation(result));
                push("Copy downloaded.");
              }}
              className="btn btn-outline min-h-10"
            >
              <Download size={14} aria-hidden /> Save copy
            </button>
          </div>

          {result.departure && (
            <p className="mt-3 text-sm">
              Requested departure:{" "}
              <strong className="font-mono">{formatDate(result.departure)}</strong>
            </p>
          )}

          <div className="mt-7 rounded-2xl border border-line bg-surface2/50 p-5">
            <StatusTimeline status={result.status} />
          </div>

          <p className="mt-5 text-sm text-muted">
            Questions? Quote <strong className="font-mono">{result.ref}</strong> to{" "}
            <a href="mailto:hello@sanchari.travel" className="underline hover:text-accent">
              hello@sanchari.travel
            </a>{" "}
            or call +91 40 4000 1120.
          </p>
        </div>
      )}

      {tried && !error && !result && (
        <p className="mt-6 text-sm text-muted">
          Haven&apos;t enquired yet?{" "}
          <Link href="/enquire" className="underline hover:text-accent">
            Start one here
          </Link>
          .
        </p>
      )}
    </div>
  );
}

export default function EnquiryLookupPage() {
  return (
    <div className="container-x">
      <Suspense fallback={<div className="skeleton mt-16 h-72 max-w-2xl" />}>
        <LookupInner />
      </Suspense>
    </div>
  );
}
