import type { ReactNode } from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container-x flex min-h-[80vh] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          {/* Same mark as the site header — the auth pages previously used an
              older logo, so signing in looked like a different product. */}
          <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Sanchari home">
            <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden>
              <circle cx="16" cy="16" r="14" fill="none" stroke="rgb(var(--accent))" strokeWidth="2" />
              <path
                d="M7 13h12a3.5 3.5 0 1 0-3.5-3.5M7 18h16a3.5 3.5 0 1 1-3.5 3.5M7 23h8"
                fill="none"
                stroke="rgb(var(--pine))"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span className="font-display text-2xl font-semibold">Sanchari</span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
