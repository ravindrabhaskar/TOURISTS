import type { EnquiryRecord } from "./types";
import { STATUS_LABEL } from "./data/site";
import { formatDate } from "./format";

export function buildConfirmation(e: EnquiryRecord): string {
  const line = "-".repeat(46);
  return [
    "TRADE WINDS TRAVEL CO.",
    "Banjara Hills, Hyderabad 500034 · +91 40 4000 1120",
    line,
    `Reference      : ${e.ref}`,
    `Received       : ${formatDate(e.createdAt.slice(0, 10))}`,
    "",
    `Traveller      : ${e.name}`,
    `Email          : ${e.email}`,
    `Phone          : ${e.phone}`,
    "",
    `Trip           : ${e.tripName}`,
    `Departure      : ${e.departure ? formatDate(e.departure) : "Flexible - planner will suggest"}`,
    `Travellers     : ${e.travellers}`,
    `Estimate       : INR ${e.estTotal.toLocaleString("en-IN")} (${e.travellers} x per-person, indicative)`,
    "",
    `Status         : ${STATUS_LABEL[e.status]}`,
    ...(e.message ? [`\nYour message:\n${e.message}`] : []),
    line,
    "A planner replies within one working day with availability",
    "and a complimentary 48-hour seat hold. Nothing is payable",
    "until you confirm in writing.",
    line,
  ].join("\n");
}

export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
