"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock } from "lucide-react";
import { loginAction } from "@/app/actions/admin";

export default function AdminLogin({ hint }: { hint?: string }) {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="container-x flex min-h-[60vh] items-center justify-center py-16">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const res = await loginAction(pw);
          if (res.ok) {
            router.refresh();
          } else {
            setError(res.error ?? "That's not it.");
            setBusy(false);
          }
        }}
        className="card w-full max-w-sm p-8 text-center"
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Lock size={22} aria-hidden />
        </span>
        <h1 className="mt-5 font-display text-2xl font-semibold">Operator desk</h1>
        <p className="mt-2 text-sm text-muted">
          The enquiry pipeline.{" "}
          {hint ? (
            <>
              Demo password:{" "}
              <code className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-xs">{hint}</code>
            </>
          ) : (
            "Set ADMIN_PASSWORD to change this."
          )}
        </p>
        <input
          type="password"
          value={pw}
          onChange={(e) => {
            setPw(e.target.value);
            setError("");
          }}
          placeholder="Password"
          aria-label="Admin password"
          aria-invalid={!!error}
          className="field mt-6 text-center font-mono"
        />
        {error && (
          <p role="alert" className="mt-2 text-xs font-medium text-danger">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="btn btn-primary mt-4 w-full disabled:opacity-60">
          {busy ? "Checking…" : "Open the desk"}
        </button>
      </form>
    </div>
  );
}
