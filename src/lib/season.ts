import type { Trip } from "./types";

export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export const MONTHS_FULL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const SEASON_LABEL: Record<number, string> = {
  0: "Closed",
  1: "Shoulder",
  2: "Prime",
};

export function buildSeason(prime: number[], shoulder: number[]): number[] {
  const s = new Array<number>(12).fill(0);
  shoulder.forEach((m) => (s[m] = 1));
  prime.forEach((m) => (s[m] = 2));
  return s;
}

export function primeMonths(season: number[]): number[] {
  return season.reduce<number[]>((acc, v, i) => {
    if (v === 2) acc.push(i);
    return acc;
  }, []);
}

export function openMonths(season: number[]): number[] {
  return season.reduce<number[]>((acc, v, i) => {
    if (v > 0) acc.push(i);
    return acc;
  }, []);
}

function span(months: number[]): string {
  const first = months[0];
  if (first === undefined) return "—";
  const last = months[months.length - 1] ?? first;
  if (first === last) return MONTHS[first] ?? "—";
  return `${MONTHS[first] ?? "—"} – ${MONTHS[last] ?? "—"}`;
}

export function bestMonthsLabel(trip: Trip): string {
  const prime = primeMonths(trip.season);
  if (prime.length > 0) return span(prime);
  return span(openMonths(trip.season));
}

export function seasonVerdict(trip: Trip, month: number): string {
  const v = trip.season[month];
  if (v === 2) return `Prime time — ${MONTHS_FULL[month]} is one of the best months.`;
  if (v === 1) return `Shoulder — ${MONTHS_FULL[month]} works, with fewer crowds and softer prices.`;
  return `Closed — we do not run this trip in ${MONTHS_FULL[month]}.`;
}

export function isOpenIn(trip: Trip, month: number): boolean {
  return (trip.season[month] ?? 0) > 0;
}

export function currentMonth(): number {
  return new Date().getMonth();
}
