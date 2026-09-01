"use client";

import { useSettings } from "@/lib/store";
import { formatINR, formatUSD } from "@/lib/format";

export default function PriceTag({
  inr,
  className = "",
}: {
  inr: number;
  className?: string;
}) {
  const { currency } = useSettings();
  return (
    <span className={`font-mono ${className}`}>
      {currency === "USD" ? formatUSD(inr) : formatINR(inr)}
      {currency === "USD" && (
        <span className="ml-1 text-[10px] uppercase tracking-wide text-muted">
          ≈
        </span>
      )}
    </span>
  );
}
