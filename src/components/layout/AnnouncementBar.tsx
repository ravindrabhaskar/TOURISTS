"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

const KEY = "tw-ann-dismissed-v1";

export default function AnnouncementBar() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setShow(localStorage.getItem(KEY) !== "1");
    });
    return () => cancelAnimationFrame(id);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem(KEY, "1");
    setShow(false);
  };

  return (
    <div className="bg-pine-soft text-pine dark:text-pine">
      <div className="container-x flex min-h-10 items-center justify-center gap-3 py-1.5 text-center text-xs font-medium sm:text-sm">
        <p>
          Early bird: save ₹5,000 per person on departures booked 90+ days out ·{" "}
          <a href="/enquire" className="underline underline-offset-2">
            lock a date
          </a>
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-black/10"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
