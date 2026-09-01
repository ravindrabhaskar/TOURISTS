"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

export interface AccordionItem {
  id: string;
  head: string;
  meta?: string;
  body: React.ReactNode;
}

export default function Accordion({
  items,
  defaultOpenId,
}: {
  items: AccordionItem[];
  defaultOpenId?: string;
}) {
  const [openId, setOpenId] = useState<string | undefined>(defaultOpenId);

  return (
    <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
      {items.map((item) => {
        const open = openId === item.id;
        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => setOpenId(open ? undefined : item.id)}
              aria-expanded={open}
              aria-controls={`acc-${item.id}`}
              id={`accbtn-${item.id}`}
              className="flex min-h-11 w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-surface2"
            >
              <span className="flex flex-wrap items-baseline gap-x-3">
                <span className="font-medium">{item.head}</span>
                {item.meta && (
                  <span className="font-mono text-xs text-muted">{item.meta}</span>
                )}
              </span>
              <ChevronDown
                size={18}
                className={`shrink-0 text-muted transition-transform duration-200 ${
                  open ? "rotate-180" : ""
                }`}
                aria-hidden
              />
            </button>
            <div
              id={`acc-${item.id}`}
              role="region"
              aria-labelledby={`accbtn-${item.id}`}
              hidden={!open}
              className="px-5 pb-5 pt-0 text-sm leading-relaxed text-muted"
            >
              {open && item.body}
            </div>
          </div>
        );
      })}
    </div>
  );
}
