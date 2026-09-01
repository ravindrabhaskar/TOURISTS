"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Download,
  PartyPopper,
} from "lucide-react";
import { TRIPS, getTrip } from "@/lib/data/trips";
import { getDepartures, estimateTotal } from "@/lib/departures";
import { formatDate, formatINR } from "@/lib/format";
import { buildConfirmation, downloadText } from "@/lib/confirmation";
import { useToast } from "@/lib/store";
import type { EnquiryRecord } from "@/lib/types";
import { createEnquiry } from "@/app/actions/enquiries";
import { cn } from "@/lib/cn";

const STEPS = ["Trip & date", "About you", "Review"];

function StepDots({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2" aria-label={`Step ${step + 1} of 3`}>
      {STEPS.map((label, i) => (
        <li key={label} className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full border font-mono text-xs font-bold transition-colors",
              i < step && "border-ok bg-ok text-white",
              i === step && "border-accent bg-accent text-white",
              i > step && "border-line text-muted",
            )}
            aria-current={i === step ? "step" : undefined}
          >
            {i < step ? <Check size={13} aria-hidden /> : i + 1}
          </span>
          <span
            className={cn(
              "hidden text-xs font-medium sm:block",
              i === step ? "text-ink" : "text-muted",
            )}
          >
            {label}
          </span>
          {i < STEPS.length - 1 && (
            <span className="h-px w-5 bg-line sm:w-8" aria-hidden />
          )}
        </li>
      ))}
    </ol>
  );
}

export default function EnquireWizard() {
  const sp = useSearchParams();
  const router = useRouter();
  const { push } = useToast();

  const [step, setStep] = useState(0);
  const [slug, setSlug] = useState(sp.get("trip") ?? "");
  const [depIso, setDepIso] = useState<string>(sp.get("date") ?? "flexible");
  const [travellers, setTravellers] = useState(
    Math.min(16, Math.max(1, Number(sp.get("travellers")) || 2)),
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<EnquiryRecord | null>(null);
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const mountedAtRef = useRef<number>(0);
  const utmRef = useRef<Record<string, string>>({});

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setMounted(true);
      mountedAtRef.current = Date.now();
      try {
        const u: Record<string, string> = {};
        new URLSearchParams(window.location.search).forEach((v, k) => {
          if (k.startsWith("utm_")) u[k] = v;
        });
        if (Object.keys(u).length) utmRef.current = u;
      } catch {}
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const trip = slug ? getTrip(slug) : undefined;
  const departures = useMemo(
    () => (trip ? getDepartures(trip) : []),
    [trip],
  );

  const basePrice =
    depIso !== "flexible" && departures.find((d) => d.iso === depIso)
      ? departures.find((d) => d.iso === depIso)!.priceInr
      : (trip?.priceInr ?? 0);
  const est = useMemo(
    () =>
      estimateTotal(basePrice, travellers, depIso === "flexible" ? null : depIso),
    [basePrice, travellers, depIso],
  );

  function validate(s: number): boolean {
    const e: Record<string, string> = {};
    if (s === 0 && !slug) e.trip = "Pick a trip — or choose flexible dates below.";
    if (s === 1) {
      if (name.trim().length < 2) e.name = "We need a name to greet you properly.";
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
        e.email = "That email doesn't look complete.";
      if (!/^[\d\s+-]{10,15}$/.test(phone.trim()))
        e.phone = "A reachable phone number, please.";
    }
    setErrors(e);
    if (Object.keys(e).length > 0) {
      document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return false;
    }
    return true;
  }

  const next = () => {
    if (validate(step)) setStep((s) => s + 1);
  };

  const submit = async () => {
    setSubmitting(true);
    setErrors({});
    try {
      const res = await createEnquiry({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        travellers,
        tripSlug: slug,
        departure: depIso === "flexible" ? null : depIso,
        message: message.trim(),
        company_website: honeypot,
        elapsedMs: Date.now() - mountedAtRef.current,
        utm: utmRef.current,
      });
      if (!res.ok || !res.ref) {
        setErrors(res.errors ?? { form: "Something went wrong — please try again." });
        if (res.errors && Object.keys(res.errors).some((k) => k !== "form")) {
          setStep(Object.keys(res.errors).includes("tripSlug") ? 0 : 1);
        }
        return;
      }
      const ref = res.ref;
      const total = res.estTotal ?? est.total;
      setDone({
        ref,
        createdAt: new Date().toISOString(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        travellers,
        tripSlug: slug,
        tripName: trip?.name ?? slug,
        departure: depIso === "flexible" ? null : depIso,
        estTotal: total,
        message: message.trim() || undefined,
        status: "new",
      });
      window.scrollTo({ top: 0 });
      push("Enquiry sent — reference " + ref);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    const txt = buildConfirmation(done);
    return (
      <div className="mx-auto max-w-2xl py-14 text-center">
        <div className="fade-up card p-8 sm:p-12">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-pine-soft text-pine">
            <PartyPopper size={28} aria-hidden />
          </span>
          <h1 className="mt-6 font-display text-3xl font-semibold">
            Consider it in motion.
          </h1>
          <p className="mt-3 leading-relaxed text-muted">
            A planner is picking this up now — expect a reply within one working
            day with availability and your free 48-hour hold.
          </p>

          <div className="mt-8 rounded-2xl bg-surface2 p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              Your reference
            </p>
            <p className="mt-1 font-mono text-3xl font-bold tracking-wider text-accent">
              {done.ref}
            </p>
            <p className="mt-3 text-sm text-muted">
              {done.tripName} · {done.travellers} traveller{done.travellers > 1 ? "s" : ""} ·{" "}
              {done.departure ? formatDate(done.departure) : "Flexible"}
            </p>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(done.ref).then(
                  () => push("Reference copied."),
                  () => push("Copy failed — write it down!", "warn"),
                );
              }}
              className="btn btn-outline"
            >
              <Copy size={15} aria-hidden /> Copy reference
            </button>
            <button
              type="button"
              onClick={() => downloadText(`sanchari-${done.ref}.txt`, txt)}
              className="btn btn-outline"
            >
              <Download size={15} aria-hidden /> Save a copy
            </button>
            <Link href={`/enquiry?ref=${done.ref}`} className="btn btn-primary">
              Track this enquiry
            </Link>
          </div>

          <p className="mt-8 text-xs text-muted">
            A copy has also been stored on this device — the{" "}
            <Link href="/admin" className="underline">
              operator desk
            </Link>{" "}
            can see it immediately.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-10 py-10 lg:grid-cols-[1.5fr_1fr]">
      <div>
        <Link
          href="/trips"
          onClick={(e) => {
            if (step > 0) {
              e.preventDefault();
              setStep((s) => s - 1);
            }
          }}
          className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted hover:text-accent"
        >
          <ArrowLeft size={15} aria-hidden />
          {step === 0 ? "Back to trips" : "Previous step"}
        </Link>

        <h1 className="mt-4 font-display text-4xl font-semibold">Plan my trip</h1>
        <p className="mt-2 max-w-lg text-muted">
          Ninety seconds, no payment, no spam. One question at a time.
        </p>

        <div className="mt-8">
          <StepDots step={step} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (submitting) return;
            if (step < 2) next();
            else void submit();
          }}
          className="card mt-6 space-y-6 p-6 sm:p-8"
          noValidate
        >
          <div aria-hidden className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
            <label htmlFor="f-company">Company website</label>
            <input
              id="f-company"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          {step === 0 && (
            <>
              <div>
                <label htmlFor="f-trip" className="mb-1.5 block text-sm font-medium">
                  Which trip caught your eye?
                </label>
                <select
                  id="f-trip"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setDepIso("flexible");
                  }}
                  aria-invalid={!!errors.trip}
                  aria-describedby={errors.trip ? "err-trip" : undefined}
                  className="field"
                >
                  <option value="">Not sure yet — surprise me</option>
                  {TRIPS.map((t) => (
                    <option key={t.slug} value={t.slug}>
                      {t.name} · {t.days}d · {formatINR(t.priceInr)}
                    </option>
                  ))}
                </select>
                {errors.trip && (
                  <p id="err-trip" className="mt-1.5 text-xs font-medium text-danger">
                    {errors.trip}
                  </p>
                )}
                {!slug && (
                  <p className="mt-2 text-xs text-muted">
                    No favourite yet?{" "}
                    <Link href="/trips" className="underline hover:text-accent">
                      Browse the catalogue
                    </Link>{" "}
                    first, or leave it open and tell us the vibe in step two.
                  </p>
                )}
              </div>

              {slug && (
                <>
                  <div>
                    <label htmlFor="f-dep" className="mb-1.5 block text-sm font-medium">
                      Departure window
                    </label>
                    <select
                      id="f-dep"
                      value={depIso}
                      onChange={(e) => setDepIso(e.target.value)}
                      className="field"
                    >
                      <option value="flexible">I&apos;m flexible — suggest dates</option>
                      {!mounted &&
                        departures.slice(0, 4).map((d) => (
                          <option key={d.iso} value={d.iso}>
                            {formatDate(d.iso)} · {formatINR(d.priceInr)}
                          </option>
                        ))}
                      {mounted &&
                        departures.map((d) => (
                          <option key={d.iso} value={d.iso} disabled={d.seatsLeft === 0}>
                            {formatDate(d.iso)} · {formatINR(d.priceInr)} ·{" "}
                            {d.seatsLeft === 0 ? "Sold out" : `${d.seatsLeft} seats`}
                          </option>
                        ))}
                      {mounted && departures.length === 0 && (
                        <option value="">No fixed departures right now</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="f-pax" className="mb-1.5 block text-sm font-medium">
                      How many travelling?
                    </label>
                    <input
                      id="f-pax"
                      type="number"
                      min={1}
                      max={16}
                      value={travellers}
                      onChange={(e) =>
                        setTravellers(Math.min(16, Math.max(1, Number(e.target.value) || 1)))
                      }
                      className="field w-32"
                    />
                    {travellers >= 4 && est.groupPct > 0 && (
                      <p className="mt-1.5 text-xs font-medium text-ok">
                        {est.groupPct}% group saving applied.
                      </p>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {step === 1 && (
            <>
              <div>
                <label htmlFor="f-name" className="mb-1.5 block text-sm font-medium">
                  Full name
                </label>
                <input
                  id="f-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="As on your ID"
                  autoComplete="name"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "err-name" : undefined}
                  className="field"
                />
                {errors.name && (
                  <p id="err-name" className="mt-1.5 text-xs font-medium text-danger">
                    {errors.name}
                  </p>
                )}
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="f-email" className="mb-1.5 block text-sm font-medium">
                    Email
                  </label>
                  <input
                    id="f-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "err-email" : undefined}
                    className="field"
                  />
                  {errors.email && (
                    <p id="err-email" className="mt-1.5 text-xs font-medium text-danger">
                      {errors.email}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="f-phone" className="mb-1.5 block text-sm font-medium">
                    Phone / WhatsApp
                  </label>
                  <input
                    id="f-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 …"
                    autoComplete="tel"
                    aria-invalid={!!errors.phone}
                    aria-describedby={errors.phone ? "err-phone" : undefined}
                    className="field"
                  />
                  {errors.phone && (
                    <p id="err-phone" className="mt-1.5 text-xs font-medium text-danger">
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="f-msg" className="mb-1.5 block text-sm font-medium">
                  Anything else? <span className="font-normal text-muted">(optional)</span>
                </label>
                <textarea
                  id="f-msg"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Celebrating an anniversary, vegetarian crew, want the front canoe…"
                  className="field resize-y"
                />
              </div>
            </>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold">One last look</h2>
              <dl className="divide-y divide-line rounded-xl border border-line text-sm">
                {[
                  ["Trip", trip?.name ?? "Open to suggestions"],
                  [
                    "Departure",
                    depIso === "flexible"
                      ? "Flexible — planner suggests"
                      : formatDate(depIso),
                  ],
                  ["Travellers", String(travellers)],
                  ["Name", name],
                  ["Email", email],
                  ["Phone", phone],
                  ["Notes", message || "—"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 px-4 py-2.5">
                    <dt className="text-muted">{k}</dt>
                    <dd className="max-w-[60%] break-words text-right font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-xs leading-relaxed text-muted">
                Submitting creates a reference you can track any time. We reply within
                one working day; nothing is payable until you confirm.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            {errors.form && (
              <p role="alert" className="text-sm font-medium text-danger">
                {errors.form}
              </p>
            )}
            {step < 2 ? (
              <button type="submit" className="btn btn-primary ml-auto px-7">
                Continue <ArrowRight size={15} aria-hidden />
              </button>
            ) : (
              <button type="submit" disabled={submitting} className="btn btn-primary ml-auto px-7 disabled:opacity-60">
                {submitting ? "Sending…" : "Send enquiry"}
              </button>
            )}
          </div>
        </form>
      </div>

      <aside className="lg:sticky lg:top-24 lg:h-fit" aria-label="Live estimate">
        <div className="card overflow-hidden">
          <div className="bg-pine p-5 text-white dark:text-[#0e1512]">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] opacity-80">
              Live estimate
            </p>
            <p className="mt-1 font-display text-3xl font-semibold">
              {formatINR(est.total)}
            </p>
            <p className="text-sm opacity-85">
              {travellers} × {formatINR(est.perPerson)} per person
            </p>
          </div>
          <ul className="space-y-2.5 p-5 text-sm text-muted">
            {(est.groupPct > 0 || est.earlyBird) && (
              <>
                {est.groupPct > 0 && (
                  <li className="flex items-center gap-2 text-ok">
                    <Check size={14} aria-hidden /> {est.groupPct}% group discount
                  </li>
                )}
                {est.earlyBird && (
                  <li className="flex items-center gap-2 text-ok">
                    <Check size={14} aria-hidden /> Early-bird ₹5,000 × {travellers} off
                  </li>
                )}
                <li className="border-t border-line pt-2.5" />
              </>
            )}
            <li>Indicative total for the ground package.</li>
            <li>Flights quoted separately so miles stay yours.</li>
            <li>Your planner confirms exact numbers in writing.</li>
          </ul>
        </div>

        <div className="card mt-5 p-5 text-sm">
          <p className="font-medium">What happens after you send it</p>
          <ol className="mt-3 space-y-2.5 text-muted">
            <li className="flex gap-2.5">
              <span className="font-mono font-bold text-accent">1</span> Reference code
              appears instantly — keep it.
            </li>
            <li className="flex gap-2.5">
              <span className="font-mono font-bold text-accent">2</span> Planner checks
              seats & season fit within a day.
            </li>
            <li className="flex gap-2.5">
              <span className="font-mono font-bold text-accent">3</span> You get a
              written quote + free 48-hour hold.
            </li>
          </ol>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-4 text-xs underline hover:text-accent"
          >
            Prefer talking? Call +91 40 4000 1120 instead.
          </button>
        </div>
      </aside>
    </div>
  );
}
