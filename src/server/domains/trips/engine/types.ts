import type { ItineraryItemType, PriceLevel } from "@prisma/client";

export type Pace = "RELAXED" | "BALANCED" | "PACKED";

export type PlannerInput = {
  originName: string;
  originLat: number;
  originLng: number;
  startDate: Date;
  days: number;
  adults: number;
  children: number;
  seniors: number;
  budgetTotal?: number;
  transportPreference?: "CAR" | "BUS" | "TRAIN" | "ANY";
  accommodationPref?: PriceLevel;
  interests: string[];
  pace: Pace;
  foodPreference?: string;
  accessibilityNeeds: string[];
  preferredSlugs?: string[];
};

export type CandidatePoi = {
  id: string;
  slug: string;
  name: string;
  type: string;
  districtId: string;
  districtName: string;
  lat: number;
  lng: number;
  summary: string;
  visitDurationMin: number;
  entryFeeAdult: number | null;
  ratingAvg: number;
  popularityScore: number;
  categories: string[];
  tags: string[];
  easyAccess: boolean;
  weatherSensitive: boolean;
  openingHours: Array<{ days: number[]; open: string; close: string }> | null;
};

export type DraftItem = {
  itemType: ItineraryItemType;
  title: string;
  description?: string;
  reason?: string;
  destinationId?: string;
  destinationSlug?: string;
  placeName?: string;
  lat?: number;
  lng?: number;
  startTimeMin: number;
  endTimeMin: number;
  travelFromPrevMinutes: number;
  estimatedCostPerPerson: number;
  bookingRequired: boolean;
  weatherSensitive: boolean;
  locked?: boolean;
};

export type DayPlan = {
  dayNumber: number;
  date?: Date;
  title?: string;
  clusterName: string;
  items: DraftItem[];
};

export type CostBreakdown = {
  stay: number;
  transport: number;
  food: number;
  activities: number;
  total: number;
  perPersonApprox: number;
  notes: string[];
};

export type ItineraryDraft = {
  days: DayPlan[];
  cost: CostBreakdown;
  explanation: string[];
  warnings: string[];
};
