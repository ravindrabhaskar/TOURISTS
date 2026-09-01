export type Region =
  | "Himalaya"
  | "South India"
  | "Northeast India"
  | "Desert & Rajasthan"
  | "Southeast Asia"
  | "Africa"
  | "Europe"
  | "Central Asia & Middle East";

export const REGIONS: Region[] = [
  "Himalaya",
  "South India",
  "Northeast India",
  "Desert & Rajasthan",
  "Southeast Asia",
  "Africa",
  "Europe",
  "Central Asia & Middle East",
];

export type Difficulty = "Easy" | "Moderate" | "Challenging";

export interface ItineraryDay {
  title: string;
  detail: string;
}

export interface Trip {
  slug: string;
  name: string;
  region: Region;
  country: string;
  blurb: string;
  description: string;
  priceInr: number;
  days: number;
  maxGroup: number;
  rating: number;
  reviewCount: number;
  difficulty: Difficulty;
  tags: string[];
  season: number[];
  startCities: string[];
  highlights: string[];
  itinerary: ItineraryDay[];
  cover: string;
  gallery: string[];
  popular?: boolean;
}

export interface Departure {
  iso: string;
  seatsLeft: number;
  priceInr: number;
}

export type EnquiryStatus =
  | "new"
  | "planning"
  | "quoted"
  | "confirmed"
  | "archived";

export interface EnquiryRecord {
  ref: string;
  createdAt: string;
  name: string;
  email: string;
  phone: string;
  travellers: number;
  tripSlug: string;
  tripName: string;
  departure: string | null;
  estTotal: number;
  message?: string;
  status: EnquiryStatus;
  note?: string;
  demo?: boolean;
}

export type SortKey = "popular" | "price-asc" | "price-desc" | "duration";
