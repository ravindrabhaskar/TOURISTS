"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

export default function Modal({
  open,
  onClose,
  label,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={ref}
        tabIndex={-1}
        className={`fade-up relative max-h-[88vh] w-full overflow-auto rounded-2xl border border-line bg-surface shadow-2xl ${
          wide ? "max-w-4xl" : "max-w-lg"
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/70"
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}
