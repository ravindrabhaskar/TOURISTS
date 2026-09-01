export type ClimateProfile =
  | "alpine_cold_desert"
  | "himalayan_monsoon"
  | "desert_hot"
  | "tropical_coast"
  | "island_tropical"
  | "sea_monsoon"
  | "savanna"
  | "mediterranean"
  | "west_european_alps"
  | "central_asia";

interface Profile {
  label: string;
  avgHighC: number[];
  rainMm: number[];
}

export const CLIMATE_PROFILES: Record<ClimateProfile, Profile> = {
  alpine_cold_desert: {
    label: "High-altitude cold desert",
    avgHighC: [-2, 1, 6, 11, 16, 20, 21, 20, 17, 10, 3, -1],
    rainMm: [10, 10, 10, 10, 15, 20, 30, 25, 15, 10, 10, 15],
  },
  himalayan_monsoon: {
    label: "Himalayan foothills & monsoon belt",
    avgHighC: [12, 14, 19, 23, 26, 28, 24, 24, 25, 23, 18, 13],
    rainMm: [70, 80, 60, 50, 70, 160, 340, 300, 200, 80, 20, 40],
  },
  desert_hot: {
    label: "Hot desert",
    avgHighC: [24, 28, 34, 40, 43, 43, 40, 38, 38, 35, 29, 24],
    rainMm: [10, 8, 5, 3, 5, 15, 60, 70, 20, 5, 5, 8],
  },
  tropical_coast: {
    label: "Tropical coast",
    avgHighC: [31, 32, 33, 34, 32, 29, 28, 28, 29, 30, 30, 31],
    rainMm: [25, 15, 10, 30, 110, 320, 690, 420, 280, 190, 90, 45],
  },
  island_tropical: {
    label: "Island tropical",
    avgHighC: [30, 31, 32, 33, 32, 31, 30, 30, 30, 30, 30, 30],
    rainMm: [60, 40, 35, 60, 140, 210, 195, 175, 175, 195, 180, 120],
  },
  sea_monsoon: {
    label: "Southeast Asian monsoon",
    avgHighC: [30, 32, 34, 36, 35, 33, 32, 32, 32, 32, 31, 30],
    rainMm: [15, 20, 40, 70, 180, 220, 260, 270, 300, 280, 80, 20],
  },
  savanna: {
    label: "East African savanna",
    avgHighC: [25, 26, 27, 25, 24, 23, 22, 23, 25, 26, 25, 25],
    rainMm: [60, 70, 130, 250, 170, 50, 25, 30, 40, 70, 110, 100],
  },
  mediterranean: {
    label: "Mediterranean",
    avgHighC: [13, 14, 17, 20, 24, 28, 31, 31, 27, 22, 17, 14],
    rainMm: [70, 70, 60, 55, 45, 35, 20, 30, 70, 105, 110, 95],
  },
  west_european_alps: {
    label: "European alps",
    avgHighC: [3, 5, 10, 14, 19, 22, 25, 24, 20, 14, 8, 4],
    rainMm: [60, 55, 70, 85, 110, 125, 135, 140, 95, 80, 80, 70],
  },
  central_asia: {
    label: "Central Asian steppe",
    avgHighC: [7, 9, 17, 24, 30, 35, 37, 35, 29, 20, 13, 8],
    rainMm: [50, 45, 50, 45, 30, 10, 5, 3, 8, 25, 45, 55],
  },
};

export const TRIP_CLIMATE: Record<string, ClimateProfile> = {
  "ladakh-high-passes": "alpine_cold_desert",
  "spiti-valley-homestays": "alpine_cold_desert",
  "kashmir-great-lakes": "himalayan_monsoon",
  "valley-of-flowers": "himalayan_monsoon",
  "sikkim-darjeeling-tea": "himalayan_monsoon",
  "bhutan-cloud-kingdom": "himalayan_monsoon",
  "meghalaya-root-bridges": "himalayan_monsoon",
  "assam-kaziranga-wildlife": "himalayan_monsoon",
  "arunachal-tawang-dirang": "himalayan_monsoon",
  "nagaland-hornbill-festival": "himalayan_monsoon",
  "kerala-backwaters-hills": "tropical_coast",
  "tamil-nadu-temples": "tropical_coast",
  "coorg-hampi": "tropical_coast",
  "goa-beyond-the-beaches": "tropical_coast",
  "pondicherry-slow-coast": "tropical_coast",
  "andaman-islands-hopper": "island_tropical",
  "rajasthan-forts-palaces": "desert_hot",
  "jaisalmer-desert-camp": "desert_hot",
  "rann-of-kutch": "desert_hot",
  "egypt-nile-pyramids": "desert_hot",
  "vietnam-north-south": "sea_monsoon",
  "thailand-bangkok-chiangmai": "sea_monsoon",
  "cambodia-angkor": "sea_monsoon",
  "bali-nusa-islands": "island_tropical",
  "philippines-palawan": "island_tropical",
  "kenya-masai-mara": "savanna",
  "tanzania-serengeti-zanzibar": "savanna",
  "switzerland-alps-rail": "west_european_alps",
  "georgia-caucasus": "west_european_alps",
  "italy-classics": "mediterranean",
  "jordan-petra-wadi-rum": "mediterranean",
  "uzbekistan-silk-road": "central_asia",
};
