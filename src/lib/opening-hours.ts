// Opening-hours model: [{ days: number[] (0=Sun..6=Sat), open: "HH:MM", close: "HH:MM" }]
// close < open ⇒ spans midnight. Pure functions, unit-tested.

export type HoursWindow = { days: number[]; open: string; close: string };
export type OpeningHours = HoursWindow[];

function toMinutes(hhmm: string): number {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function isOpenAt(hours: OpeningHours | null | undefined, at: Date): boolean {
  if (!hours || hours.length === 0) return true; // unknown ⇒ treat as open (never block discovery)
  const day = at.getDay();
  const mins = at.getHours() * 60 + at.getMinutes();
  return hours.some((w) => {
    if (!w.days.includes(day)) return false;
    const open = toMinutes(w.open);
    const close = toMinutes(w.close);
    return close <= open ? mins >= open || mins < close : mins >= open && mins < close;
  });
}

export function isUnknownHours(hours: OpeningHours | null | undefined): boolean {
  return !hours || hours.length === 0;
}

/** Returns true when arrival within `windowStart..windowStart+durationMin` fits inside an open window on that weekday. */
export function fitsVisit(
  hours: OpeningHours | null | undefined,
  arrivalDate: Date,
  durationMin: number,
): boolean {
  if (!hours || hours.length === 0) return true;
  const day = arrivalDate.getDay();
  const start = arrivalDate.getHours() * 60 + arrivalDate.getMinutes();
  return hours.some((w) => {
    if (!w.days.includes(day)) return false;
    const open = toMinutes(w.open);
    let close = toMinutes(w.close);
    if (close <= open) close += 1440;
    return start >= open && start + durationMin <= close;
  });
}

export function todayWindowsLabel(hours: OpeningHours | null | undefined, now = new Date()): string {
  if (!hours || hours.length === 0) return "Timings not published";
  const day = now.getDay();
  const windows = hours.filter((w) => w.days.includes(day));
  if (windows.length === 0) return "Closed today";
  return windows.map((w) => `${w.open} – ${w.close}`).join(", ");
}
