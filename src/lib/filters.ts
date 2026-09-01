import type { Region, SortKey, Trip } from "./types";

export interface FilterState {
  q: string;
  region: Region | "";
  month: number;
  dur: "any" | "short" | "week" | "long";
  budget: "any" | "under-30" | "30-60" | "above-60";
  tag: string;
  sort: SortKey;
}

export const DEFAULT_FILTERS: FilterState = {
  q: "",
  region: "",
  month: -1,
  dur: "any",
  budget: "any",
  tag: "",
  sort: "popular",
};

export function parseFilters(sp: URLSearchParams): FilterState {
  const monthRaw = sp.get("month");
  const month = monthRaw === null || monthRaw === "" ? -1 : Number(monthRaw);
  return {
    q: sp.get("q") ?? "",
    region: (sp.get("region") as Region) ?? "",
    month: Number.isInteger(month) && month >= 0 && month <= 11 ? month : -1,
    dur: (sp.get("dur") as FilterState["dur"]) ?? "any",
    budget: (sp.get("budget") as FilterState["budget"]) ?? "any",
    tag: sp.get("tag") ?? "",
    sort: (sp.get("sort") as SortKey) ?? "popular",
  };
}

export function filtersToParams(f: FilterState): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.region) p.set("region", f.region);
  if (f.month >= 0) p.set("month", String(f.month));
  if (f.dur !== "any") p.set("dur", f.dur);
  if (f.budget !== "any") p.set("budget", f.budget);
  if (f.tag) p.set("tag", f.tag);
  if (f.sort !== "popular") p.set("sort", f.sort);
  return p;
}

export function countActive(f: FilterState): number {
  let n = 0;
  if (f.q) n++;
  if (f.region) n++;
  if (f.month >= 0) n++;
  if (f.dur !== "any") n++;
  if (f.budget !== "any") n++;
  if (f.tag) n++;
  return n;
}

export function applyFilters(trips: Trip[], f: FilterState): Trip[] {
  const q = f.q.trim().toLowerCase();
  let out = trips.filter((t) => {
    if (q) {
      const hay = `${t.name} ${t.region} ${t.country} ${t.tags.join(" ")} ${t.blurb}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.region && t.region !== f.region) return false;
    if (f.month >= 0 && t.season[f.month] === 0) return false;
    if (f.dur === "short" && t.days > 5) return false;
    if (f.dur === "week" && (t.days < 6 || t.days > 8)) return false;
    if (f.dur === "long" && t.days <= 8) return false;
    if (f.budget === "under-30" && t.priceInr >= 30000) return false;
    if (f.budget === "30-60" && (t.priceInr < 30000 || t.priceInr > 60000)) return false;
    if (f.budget === "above-60" && t.priceInr <= 60000) return false;
    if (f.tag && !t.tags.includes(f.tag)) return false;
    return true;
  });

  switch (f.sort) {
    case "price-asc":
      out = out.sort((a, b) => a.priceInr - b.priceInr);
      break;
    case "price-desc":
      out = out.sort((a, b) => b.priceInr - a.priceInr);
      break;
    case "duration":
      out = out.sort((a, b) => a.days - b.days);
      break;
    default:
      out = out.sort(
        (a, b) => Number(b.popular ?? false) - Number(a.popular ?? false) || b.rating - a.rating,
      );
  }
  return out;
}
