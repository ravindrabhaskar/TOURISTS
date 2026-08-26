import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const DAY = 86400000;
function daysFromNow(n: number): Date {
  return new Date(Date.now() + n * DAY);
}
function hours(n: number): string {
  return String(n).padStart(2, "0") + ":00";
}

// ─── Districts (all 26, post-2022 reorganisation) ───────────────────────────
const DISTRICTS = [
  ["SKM", "Srikakulam", "srikakulam", "Srikakulam", "North Coast", 18.2975, 83.8939],
  ["PVM", "Parvathipuram Manyam", "parvathipuram-manyam", "Parvathipuram", "North Coast", 18.7833, 83.4167],
  ["VZM", "Vizianagaram", "vizianagaram", "Vizianagaram", "North Coast", 18.1067, 83.4056],
  ["VSP", "Visakhapatnam", "visakhapatnam", "Visakhapatnam", "North Coast", 17.6868, 83.2185],
  ["AKP", "Anakapalli", "anakapalli", "Anakapalli", "North Coast", 17.6913, 82.1978],
  ["ASR", "Alluri Sitharama Raju", "alluri-sitharama-raju", "Paderu", "North Coast", 17.8333, 82.6667],
  ["KAK", "Kakinada", "kakinada", "Kakinada", "Godavari", 16.9891, 82.2475],
  ["EGT", "East Godavari", "east-godavari", "Rajahmundry", "Godavari", 17.0005, 81.7798],
  ["KON", "Dr. B.R. Ambedkar Konaseema", "konaseema", "Amalapuram", "Godavari", 16.5456, 82.0056],
  ["WGT", "West Godavari", "west-godavari", "Bhimavaram", "Godavari", 16.5449, 81.5212],
  ["ELR", "Eluru", "eluru", "Eluru", "Krishna", 16.7107, 81.0946],
  ["KRS", "Krishna", "krishna", "Machilipatnam", "Krishna", 16.1667, 80.8833],
  ["NTR", "NTR", "ntr", "Vijayawada", "Krishna", 16.5062, 80.648],
  ["GNT", "Guntur", "guntur", "Guntur", "South Coast", 16.3067, 80.4365],
  ["BPA", "Bapatla", "bapatla", "Bapatla", "South Coast", 15.9042, 80.4675],
  ["PLD", "Palnadu", "palnadu", "Narasaraopet", "South Coast", 16.2333, 80.05],
  ["PKM", "Prakasam", "prakasam", "Ongole", "South Coast", 15.5057, 80.0499],
  ["NDY", "Nandyal", "nandyal", "Nandyal", "Rayalaseema", 15.4777, 78.4867],
  ["KNL", "Kurnool", "kurnool", "Kurnool", "Rayalaseema", 15.8281, 78.0373],
  ["ATP", "Ananthapuramu", "ananthapuramu", "Anantapur", "Rayalaseema", 14.6819, 77.6006],
  ["SSS", "Sri Sathya Sai", "sri-sathya-sai", "Puttaparthi", "Rayalaseema", 14.1656, 77.8117],
  ["YSD", "YSR Kadapa", "ysr-kadapa", "Kadapa", "Rayalaseema", 14.4673, 78.8242],
  ["ANN", "Annamayya", "annamayya", "Rayachoti", "Rayalaseema", 14.05, 78.55],
  ["CTR", "Chittoor", "chittoor", "Chittoor", "Rayalaseema", 13.2172, 79.1006],
  ["TIR", "Tirupati", "tirupati", "Tirupati", "South Coast", 13.6288, 79.4192],
] as const;

type DistrictSeed = {
  code: string;
  name: string;
  slug: string;
  headquarters: string;
  region: string;
  lat: number;
  lng: number;
};

type DestinationSeed = {
  slug: string;
  name: string;
  nameTe?: string;
  type: string;
  districtCode: string;
  summary: string;
  description?: string;
  lat: number;
  lng: number;
  visitDurationMin?: number;
  entryFeeAdult?: number | null;
  bestTimeToVisit?: string;
  categories: string[];
  tags: string[];
  easyAccess?: boolean;
  familyFriendly?: boolean;
  popularityScore: number;
  ratingAvg?: number;
  ratingCount?: number;
  isFeatured?: boolean;
  status?: "PUBLISHED";
  openingHours?: Array<{ days: number[]; open: string; close: string }>;
};

const DESTINATIONS: DestinationSeed[] = [
  // Cities
  { slug: "visakhapatnam", name: "Visakhapatnam", nameTe: "విశాఖపట్నం", type: "CITY", districtCode: "VSP", summary: "The City of Destiny — beaches, hills and a bustling port rolled into Andhra Pradesh's largest city.", lat: 17.6868, lng: 83.2185, categories: ["city", "beaches"], tags: ["coast", "nightlife"], popularityScore: 95, isFeatured: true },
  { slug: "vijayawada", name: "Vijayawada", nameTe: "విజయవాడ", type: "CITY", districtCode: "NTR", summary: "Business hub on the Krishna river, home to Kanaka Durga temple and Undavalli caves nearby.", lat: 16.5062, lng: 80.648, categories: ["city", "temples"], tags: ["river", "heritage"], popularityScore: 85 },
  { slug: "tirupati", name: "Tirupati", nameTe: "తిరుపతి", type: "CITY", districtCode: "TIR", summary: "Gateway to Tirumala — the spiritual capital of Andhra Pradesh.", lat: 13.6288, lng: 79.4192, categories: ["city", "temples"], tags: ["pilgrimage"], popularityScore: 92, isFeatured: true },

  // Temples & spiritual
  { slug: "tirumala-venkateswara-temple", name: "Sri Venkateswara Temple, Tirumala", nameTe: "తిరుమల శ్రీ వేంకటేశ్వర స్వామి దేవస్థానం", type: "TEMPLE", districtCode: "TIR", summary: "One of the world's most visited pilgrimage centres, atop the sacred Tirumala hills.", description: "The abode of Lord Venkateswara draws 50,000–100,000 devotees daily. Book darshan slots online well ahead; free sarva darshan queues can take many hours on weekends.", lat: 13.6833, lng: 79.3483, visitDurationMin: 180, entryFeeAdult: 0, bestTimeToVisit: "October–March; avoid festival peak days", categories: ["temples"], tags: ["unesco-tentative", "pilgrimage", "heritage"], easyAccess: true, popularityScore: 99, ratingAvg: 4.8, ratingCount: 1240, isFeatured: true, openingHours: [{ days: [0, 1, 2, 3, 4, 5, 6], open: "02:30", close: "22:00" }] },
  { slug: "kanaka-durga-temple", name: "Kanaka Durga Temple", type: "TEMPLE", districtCode: "NTR", summary: "Hilltop goddess temple overlooking the Krishna river in Vijayawada.", lat: 16.512, lng: 80.6083, visitDurationMin: 90, entryFeeAdult: 0, categories: ["temples"], tags: ["views", "festival"], easyAccess: true, popularityScore: 78, ratingAvg: 4.6, ratingCount: 430, openingHours: [{ days: [0, 1, 2, 3, 4, 5, 6], open: "04:00", close: "21:00" }] },
  { slug: "srisailam-mallikarjuna", name: "Sri Mallikarjuna Swamy Temple, Srisailam", type: "TEMPLE", districtCode: "NDY", summary: "Jyotirlinga and Shakti Peetha combined, set above the Krishna gorge.", lat: 16.0753, lng: 78.8671, visitDurationMin: 150, categories: ["temples"], tags: ["jyotirlinga", "forest"], easyAccess: true, popularityScore: 84, ratingAvg: 4.7, ratingCount: 380 },
  { slug: "lepakshi-temple", name: "Lepakshi Veerabhadra Temple", type: "HERITAGE_SITE", districtCode: "SSS", summary: "16th-century Vijayanagara temple famed for its hanging pillar and monolithic Nandi.", lat: 13.8007, lng: 77.6065, visitDurationMin: 120, entryFeeAdult: 0, bestTimeToVisit: "November–February", categories: ["heritage", "temples"], tags: ["architecture", "murals"], popularityScore: 66, ratingAvg: 4.6, ratingCount: 210, openingHours: [{ days: [0, 1, 2, 3, 4, 5, 6], open: "06:00", close: "18:00" }] },
  { slug: "amaravati-mahachaitya", name: "Amaravati Mahachaitya", type: "HERITAGE_SITE", districtCode: "GNT", summary: "Ruins of a great Buddhist stupa on the Krishna river, over 2,000 years old.", lat: 16.5417, lng: 80.3572, visitDurationMin: 90, categories: ["heritage", "buddhist"], tags: ["archaeology"], popularityScore: 58, ratingAvg: 4.4, ratingCount: 150 },
  { slug: "ahobilam-narasimha", name: "Ahobilam Narasimha Temples", type: "SPIRITUAL_PLACE", districtCode: "NDY", summary: "Nine shrines of Lord Narasimha scattered through the Nallamala forest.", lat: 15.1337, lng: 78.7206, visitDurationMin: 240, categories: ["temples", "trekking"], tags: ["forest", "adventure"], popularityScore: 52, ratingAvg: 4.5, ratingCount: 96 },

  // Beaches & coast
  { slug: "rushikonda-beach", name: "Rushikonda Beach", type: "BEACH", districtCode: "VSP", summary: "Golden sands and water sports just north of Visakhapatnam.", lat: 17.7833, lng: 83.3833, visitDurationMin: 120, categories: ["beaches"], tags: ["watersports", "sunset"], easyAccess: true, familyFriendly: true, popularityScore: 88, ratingAvg: 4.5, ratingCount: 520, isFeatured: true },
  { slug: "rk-beach", name: "Ramakrishna Beach (RK Beach)", type: "BEACH", districtCode: "VSP", summary: "City beach with submarine museum, aquarium and evening buzz.", lat: 17.7083, lng: 83.3083, visitDurationMin: 120, categories: ["beaches", "food"], tags: ["city", "family"], easyAccess: true, popularityScore: 86, ratingAvg: 4.4, ratingCount: 610 },
  { slug: "manginapudi-beach", name: "Manginapudi Beach", type: "BEACH", districtCode: "KRS", summary: "Historic port beach near Machilipatnam with shallow, family-friendly waters.", lat: 16.6167, lng: 80.9833, visitDurationMin: 120, categories: ["beaches"], tags: ["history", "family"], popularityScore: 48, ratingAvg: 4.1, ratingCount: 88 },
  { slug: "antarvedi-beach", name: "Antarvedi Beach & Lakshmi Narasimha Temple", type: "BEACH", districtCode: "KON", summary: "Where the Godavari meets the Bay of Bengal — temple, lighthouse and confluence point.", lat: 16.6167, lng: 82.3333, visitDurationMin: 150, categories: ["beaches", "temples"], tags: ["confluence"], popularityScore: 54, ratingAvg: 4.3, ratingCount: 76 },
  { slug: "bheemunipatnam-beach", name: "Bheemunipatnam Beach", type: "BEACH", districtCode: "VSP", summary: "Dutch colonial-era town with a quiet estuary beach.", lat: 17.9, lng: 83.45, visitDurationMin: 120, categories: ["beaches", "heritage"], tags: ["dutch-history"], popularityScore: 50, ratingAvg: 4.2, ratingCount: 65 },

  // Hills, valleys & nature
  { slug: "araku-valley", name: "Araku Valley", nameTe: "అరకు లోయ", type: "HILL_STATION", districtCode: "ASR", summary: "Coffee country in the Eastern Ghats — misty mornings, tribal culture and the famous train ride.", description: "Reach by the scenic Kirandul passenger train through 40+ tunnels. Coffee museum, Padmapuram gardens and Borra caves make a relaxed 2-day circuit.", lat: 18.3267, lng: 82.8883, visitDurationMin: 300, bestTimeToVisit: "November–January", categories: ["hills", "coffee", "tribes"], tags: ["train-ride", "plantations"], popularityScore: 91, ratingAvg: 4.6, ratingCount: 700, isFeatured: true },
  { slug: "lambasingi", name: "Lambasingi", type: "HILL_STATION", districtCode: "AKP", summary: "Andhra's 'Kashmir' — the only place in the state that sees sub-zero winter nights.", lat: 17.4833, lng: 82.5333, visitDurationMin: 180, bestTimeToVisit: "November–February (pre-dawn fog)", categories: ["hills", "photography"], tags: ["cold", "sunrise"], popularityScore: 74, ratingAvg: 4.3, ratingCount: 240 },
  { slug: "horsley-hills", name: "Horsley Hills", type: "HILL_STATION", districtCode: "ANN", summary: "Cool zephyr hill retreat with viewpoints, adventure park and old eucalyptus groves.", lat: 13.7333, lng: 78.7167, visitDurationMin: 240, categories: ["hills", "relaxation"], tags: ["resort-hill"], easyAccess: true, popularityScore: 62, ratingAvg: 4.3, ratingCount: 180 },
  { slug: "papikondalu", name: "Papi Hills Boat Cruise (Papikondalu)", type: "VIEWPOINT", districtCode: "EGT", summary: "Day cruise through the Godavari's gorge section — sheer forested walls rising from the river.", lat: 17.3833, lng: 81.3833, visitDurationMin: 480, entryFeeAdult: 450, categories: ["nature", "rivers"], tags: ["boat", "bamboo-huts"], popularityScore: 76, ratingAvg: 4.5, ratingCount: 310 },
  { slug: "talakona-waterfall", name: "Talakona Waterfall", type: "WATERFALL", districtCode: "TIR", summary: "Andhra's tallest waterfall (270 ft) inside a canopy walkway forest.", lat: 13.75, lng: 79.2833, visitDurationMin: 150, entryFeeAdult: 30, categories: ["waterfalls", "trekking"], tags: ["forest", "canopy-walk"], popularityScore: 64, ratingAvg: 4.4, ratingCount: 190 },
  { slug: "katiki-waterfalls", name: "Katiki Waterfalls", type: "WATERFALL", districtCode: "VSP", summary: "Hidden cascade near Borra Caves reached by a short trek and jeep ride.", lat: 18.2833, lng: 83.1167, visitDurationMin: 180, entryFeeAdult: 20, categories: ["waterfalls", "adventure"], tags: ["trek"], popularityScore: 56, ratingAvg: 4.4, ratingCount: 110 },
  { slug: "ethipothala-falls", name: "Ethipothala Waterfalls", type: "WATERFALL", districtCode: "PLD", summary: "Three-stream waterfall with a crocodile breeding pond below the viewing deck.", lat: 16.3436, lng: 79.3667, visitDurationMin: 90, entryFeeAdult: 20, categories: ["waterfalls"], tags: ["viewpoint"], easyAccess: true, popularityScore: 58, ratingAvg: 4.3, ratingCount: 140 },

  // Caves & wildlife
  { slug: "borra-caves", name: "Borra Caves", type: "CAVE", districtCode: "ASR", summary: "Million-year-old limestone caves with dramatic stalactite formations.", lat: 18.2833, lng: 83.1, visitDurationMin: 90, entryFeeAdult: 60, categories: ["caves", "geology"], tags: ["family"], easyAccess: true, popularityScore: 80, ratingAvg: 4.4, ratingCount: 420, openingHours: [{ days: [0, 1, 2, 3, 4, 5, 6], open: "10:00", close: "17:00" }] },
  { slug: "undavalli-caves", name: "Undavalli Caves", type: "CAVE", districtCode: "GNT", summary: "Rock-cut Buddhist vihara with a giant reclining Vishnu carved from sandstone.", lat: 16.4917, lng: 80.5917, visitDurationMin: 75, entryFeeAdult: 25, categories: ["caves", "heritage"], tags: ["buddhist"], easyAccess: true, popularityScore: 68, ratingAvg: 4.4, ratingCount: 230, openingHours: [{ days: [0, 1, 2, 3, 4, 5, 6], open: "09:00", close: "17:00" }] },
  { slug: "belum-caves", name: "Belum Caves", type: "CAVE", districtCode: "KNL", summary: "India's second-longest open-to-public cave system — 3.5 km of passages and the Patalaganga spring.", lat: 15.1042, lng: 78.1078, visitDurationMin: 120, entryFeeAdult: 65, categories: ["caves", "geology"], tags: ["family"], easyAccess: true, popularityScore: 72, ratingAvg: 4.5, ratingCount: 280, openingHours: [{ days: [0, 1, 2, 3, 4, 5, 6], open: "09:30", close: "17:30" }] },
  { slug: "rollapadu-sanctuary", name: "Rollapadu Wildlife Sanctuary", type: "WILDLIFE_SANCTUARY", districtCode: "KNL", summary: "Grassland sanctuary protecting the Great Indian Bustard and blackbuck herds.", lat: 15.7833, lng: 78.3833, visitDurationMin: 180, entryFeeAdult: 40, categories: ["wildlife", "birding"], tags: ["safari"], popularityScore: 44, ratingAvg: 4.2, ratingCount: 54 },
  { slug: "gandikota-gorge", name: "Gandikota — Grand Canyon of India", type: "FORT", districtCode: "YSD", summary: "Pennar river gorge beside an old fort — sunrise here rivals Arizona.", lat: 14.8167, lng: 78.2833, visitDurationMin: 180, entryFeeAdult: 0, bestTimeToVisit: "Sunrise/sunset; September–February", categories: ["heritage", "photography", "adventure"], tags: ["camping", "gorge"], popularityScore: 82, ratingAvg: 4.7, ratingCount: 350, isFeatured: true },
];

type StaySeed = {
  slug: string;
  name: string;
  type: string;
  districtCode: string;
  address: string;
  lat: number;
  lng: number;
  priceLevel: string;
  priceMin: number;
  priceMax: number;
  amenities: string[];
  verification?: "VERIFIED";
  partnerEmail?: string;
  description: string;
};

const STAYS: StaySeed[] = [
  { slug: "novotel-visakhapatnam-varun-beach", name: "Novotel Visakhapatnam Varun Beach", type: "HOTEL", districtCode: "VSP", address: "Beach Road, Sagar Nagar", lat: 17.7316, lng: 83.3248, priceLevel: "PREMIUM", priceMin: 7500, priceMax: 16000, amenities: ["Pool", "Sea view", "WiFi", "Gym", "Restaurant", "Bar"], verification: "VERIFIED", partnerEmail: "partner@sanchari.in", description: "Seafront high-rise with pools, spa and direct beach access." },
  { slug: "the-park-visakhapatnam", name: "The Park Visakhapatnam", type: "RESORT", districtCode: "VSP", address: "Beach Road, Maharanipeta", lat: 17.7056, lng: 83.3153, priceLevel: "PREMIUM", priceMin: 6500, priceMax: 14000, amenities: ["Pool", "Sea view", "Spa", "WiFi", "Restaurant"], verification: "VERIFIED", partnerEmail: "partner@sanchari.in", description: "Private stretch of RK Beach with resort gardens and multiple dining venues." },
  { slug: "marasa-araku-valley", name: "Marasa Sarovar Premiere, Araku", type: "RESORT", districtCode: "ASR", address: "Madagada, Araku Valley", lat: 18.3019, lng: 82.8717, priceLevel: "PREMIUM", priceMin: 4800, priceMax: 9000, amenities: ["Valley view", "WiFi", "Restaurant", "Bonfire", "Parking"], verification: "VERIFIED", description: "Valley-facing resort surrounded by coffee estates." },
  { slug: "araku-coffee-country-resort", name: "Coffee Country Resort Araku", type: "HOMESTAY", districtCode: "ASR", address: "Padmapuram Road, Araku", lat: 18.3206, lng: 82.8861, priceLevel: "BUDGET", priceMin: 1200, priceMax: 2600, amenities: ["Home food", "Estate walk", "WiFi"], verification: "VERIFIED", description: "Family-run homestay among coffee and pepper vines, tribal-cuisine dinners." },
  { slug: "fortune-murali-park-vijayawada", name: "Fortune Murali Park", type: "HOTEL", districtCode: "NTR", address: "Gandhi Nagar, Vijayawada", lat: 16.5133, lng: 80.6189, priceLevel: "MID", priceMin: 3200, priceMax: 6800, amenities: ["WiFi", "Restaurant", "Gym", "Parking"], verification: "VERIFIED", description: "Reliable mid-range business hotel close to the railway station." },
  { slug: "gateway-hotel-tirupati", name: "The Gateway Hotel Tirupati", type: "HOTEL", districtCode: "TIR", address: "Central Avenue, Tirupati", lat: 13.6321, lng: 79.4192, priceLevel: "MID", priceMin: 3800, priceMax: 8500, amenities: ["Pool", "WiFi", "Restaurant", "Temple-package desk"], verification: "VERIFIED", description: "Garden hotel convenient for Tirumala pilgrims with shuttle assistance." },
  { slug: "minerva-grand-tirupati", name: "Hotel Minerva Grand", type: "HOTEL", districtCode: "TIR", address: "Air Bypass Road, Tirupati", lat: 13.6412, lng: 79.4372, priceLevel: "MID", priceMin: 2600, priceMax: 5200, amenities: ["WiFi", "Pure-veg restaurant", "Parking"], verification: "VERIFIED", description: "Popular vegetarian-friendly stay near Alipiri footpath entrance." },
  { slug: "haritha-srisailam", name: "Haritha Hotel Srisailam", type: "GUESTHOUSE", districtCode: "NDY", address: "Near Temple Bus Stand, Srisailam", lat: 16.0772, lng: 78.8686, priceLevel: "BUDGET", priceMin: 1400, priceMax: 3200, amenities: ["Canteen", "Parking", "Temple walking distance"], verification: "VERIFIED", description: "State-run property steps from the Mallikarjuna temple complex." },
  { slug: "le-monorail-guntur", name: "Grand Inn Guntur", type: "HOTEL", districtCode: "GNT", address: "Arundelpet, Guntur", lat: 16.3117, lng: 80.4289, priceLevel: "BUDGET", priceMin: 1100, priceMax: 2400, amenities: ["WiFi", "Restaurant"], description: "Simple central budget option for Amaravati day-trips." },
  { slug: "horsley-hills-haritha", name: "Haritha Hill Resort Horsley", type: "RESORT", districtCode: "ANN", address: "Horsley Hills Top", lat: 13.7356, lng: 78.7122, priceLevel: "MID", priceMin: 2200, priceMax: 4600, amenities: ["Viewpoint deck", "Restaurant", "Bonfire"], verification: "VERIFIED", description: "Ridge-top cottages with valley views and cool evenings year-round." },
];

const ROOM_TEMPLATES = [
  { name: "Standard Double Room", capacity: 2, bedType: "Queen", basePriceFactor: 1.0, totalRooms: 6 },
  { name: "Deluxe Room", capacity: 3, bedType: "King", basePriceFactor: 1.35, totalRooms: 4 },
  { name: "Family Suite", capacity: 5, bedType: "King + 2 Single", basePriceFactor: 1.9, totalRooms: 2 },
];

async function main() {
  console.log("🌱 Seeding Project Sanchari…");

  // ── Users ────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Password123", 10);
  const usersData = [
    { email: "admin@sanchari.in", name: "Aarav Admin", role: "SUPER_ADMIN" as const, avatarEmoji: "🛡️" },
    { email: "editor@sanchari.in", name: "Esha Editor", role: "EDITOR" as const, avatarEmoji: "📝" },
    { email: "moderator@sanchari.in", name: "Modi Moderator", role: "MODERATOR" as const, avatarEmoji: "⚖️" },
    { email: "district@sanchari.in", name: "Divya District", role: "DISTRICT_ADMIN" as const, avatarEmoji: "🏛️" },
    { email: "tourism@sanchari.in", name: "Tarun Tourism", role: "TOURISM_ADMIN" as const, avatarEmoji: "🧳" },
    { email: "partner@sanchari.in", name: "Praveen Partner", role: "PARTNER" as const, avatarEmoji: "🏨" },
    { email: "demo@sanchari.in", name: "Demo Traveller", role: "TOURIST" as const, avatarEmoji: "🧭", interests: ["temples", "beaches", "food"] },
  ];
  const users: Record<string, string> = {};
  for (const u of usersData) {
    const row = await db.user.upsert({
      where: { email: u.email },
      create: { ...u, passwordHash, emailVerifiedAt: new Date() },
      update: {},
    });
    users[u.email] = row.id;
  }

  const partnerProfile = await db.partnerProfile.upsert({
    where: { userId: users["partner@sanchari.in"]! },
    create: {
      userId: users["partner@sanchari.in"]!,
      businessName: "Coastline Hospitality Pvt Ltd",
      businessType: "HOTEL",
      contactPhone: "+919000000007",
      contactEmail: "partnerships@coastline.example",
      gstin: "37ABCDE1234F1Z5",
      status: "APPROVED",
      verifiedAt: new Date(),
      verifiedByUserId: users["tourism@sanchari.in"]!,
      description: "Verified hospitality operator managing beach-front properties in Visakhapatnam.",
    },
    update: {},
  });

  // ── Districts ────────────────────────────────────────────────────────────
  const districtByCode = new Map<string, string>();
  for (const [code, name, slug, headquarters, region, lat, lng] of DISTRICTS) {
    const d = await db.district.upsert({
      where: { code },
      create: { code, name, slug, headquarters, region, lat, lng, description: `${name} district (${region} region). HQ: ${headquarters}.` },
      update: {},
    });
    districtByCode.set(code, d.id);
  }

  // ── Destinations ─────────────────────────────────────────────────────────
  const destBySlug = new Map<string, string>();
  for (const d of DESTINATIONS) {
    const row = await db.destination.upsert({
      where: { slug: d.slug },
      create: {
        slug: d.slug,
        name: d.name,
        nameTe: d.nameTe ?? null,
        type: d.type as never,
        districtId: districtByCode.get(d.districtCode)!,
        summary: d.summary,
        description: d.description ?? null,
        lat: d.lat,
        lng: d.lng,
        visitDurationMin: d.visitDurationMin ?? 60,
        entryFeeAdult: d.entryFeeAdult ?? null,
        bestTimeToVisit: d.bestTimeToVisit ?? null,
        categories: d.categories,
        tags: d.tags,
        easyAccess: d.easyAccess ?? false,
        popularityScore: d.popularityScore,
        ratingAvg: d.ratingAvg ?? 0,
        ratingCount: d.ratingCount ?? 0,
        isFeatured: d.isFeatured ?? false,
        status: "PUBLISHED",
        heroGradient: null,
        openingHours: (d.openingHours ?? undefined) as never,
        seoTitle: `${d.name} — travel guide`,
        seoDescription: d.summary.slice(0, 155),
      },
      update: {},
    });
    destBySlug.set(d.slug, row.id);
  }

  // ── Stays + rooms ────────────────────────────────────────────────────────
  for (const s of STAYS) {
    const stay = await db.stay.upsert({
      where: { slug: s.slug },
      create: {
        slug: s.slug,
        name: s.name,
        type: s.type as never,
        districtId: districtByCode.get(s.districtCode)!,
        address: s.address,
        lat: s.lat,
        lng: s.lng,
        description: s.description,
        amenities: s.amenities,
        pricePerNightMin: s.priceMin,
        pricePerNightMax: s.priceMax,
        priceLevel: s.priceLevel as never,
        verification: s.verification ?? "PENDING",
        partnerId: s.partnerEmail ? partnerProfile.id : null,
        heroGradient: null,
      },
      update: {},
    });
    const existingRooms = await db.room.count({ where: { stayId: stay.id } });
    if (existingRooms === 0) {
      for (const t of ROOM_TEMPLATES) {
        const basePrice = Math.max(800, Math.round((s.priceMin * t.basePriceFactor) / 100) * 100);
        await db.room.create({ data: { stayId: stay.id, name: t.name, capacity: t.capacity, bedType: t.bedType, basePrice, totalRooms: t.totalRooms } });
      }
    }
  }

  // ── Events (always upcoming relative to seed time) ───────────────────────
  const EVENTS = [
    { slug: "visakha-utsav", title: "Visakha Utsav", category: "FESTIVAL", districtCode: "VSP", venueName: "RK Beach grounds", startInDays: 21, lenDays: 3, description: "The city's flagship three-day cultural carnival — beach concerts, food streets and fireworks.", expectedVisitors: "200,000+" },
    { slug: "araku-balloon-festival", title: "Araku Balloon & Adventure Festival", category: "SPORTS", districtCode: "ASR", venueName: "Araku Valley grounds", startInDays: 45, lenDays: 4, description: "Hot-air balloons over coffee hills, paragliding demos and night glow shows.", expectedVisitors: "80,000+" },
    { slug: "kuchipudi-dance-festival", title: "Kuchipudi Dance Festival", category: "MUSIC_DANCE", districtCode: "KRS", venueName: "Kuchipudi village", startInDays: 60, lenDays: 2, description: "Classical dance performances in the birthplace of the Kuchipudi tradition.", expectedVisitors: "15,000+" },
    { slug: "lepakshi-utsavam", title: "Lepakshi Utsavam", category: "CULTURAL", districtCode: "SSS", venueName: "Lepakshi temple precinct", startInDays: 75, lenDays: 3, description: "Craft bazaars, Kalamkari workshops and heritage walks around the Vijayanagara temple.", expectedVisitors: "40,000+" },
    { slug: "kotappakonda-jathara", title: "Kotappakonda Trikoteswara Jathara", category: "FAIR", districtCode: "PLD", venueName: "Kotappakonda hill shrine", startInDays: 90, lenDays: 5, description: "One of AP's largest hill jatharas — prabha processions and lakhs of devotees.", expectedVisitors: "500,000+" },
    { slug: "flamingo-festival-nellore", title: "Flamingo Festival", category: "CULTURAL", districtCode: "PKM", venueName: "Nelapattu Bird Sanctuary", startInDays: 110, lenDays: 2, description: "Celebration of migratory birds at Nelapattu and Pulicat — guided birding and photo walks.", expectedVisitors: "30,000+" },
    { slug: "ugadi-celebrations", title: "Ugadi — Telugu New Year", category: "RELIGIOUS", districtCode: "NTR", venueName: "Statewide", startInDays: 130, lenDays: 1, description: "New Year festivities with panchanga sravanam, mango-neem ugadi pachadi and temple crowds.", expectedVisitors: "statewide" },
    { slug: "godavari-pushkaralu", title: "Godavari Pushkaralu", category: "RELIGIOUS", districtCode: "EGT", venueName: "Godavari ghats, Rajahmundry", startInDays: 160, lenDays: 12, description: "Twelve-day river festival held once every twelve years — millions take a holy dip.", expectedVisitors: "30 million+" },
  ];
  for (const e of EVENTS) {
    const start = daysFromNow(e.startInDays);
    await db.event.upsert({
      where: { slug: e.slug },
      create: {
        slug: e.slug,
        title: e.title,
        category: e.category as never,
        description: e.description,
        venueName: e.venueName,
        districtId: districtByCode.get(e.districtCode)!,
        lat: DISTRICTS.find((d) => d[0] === e.districtCode)![5] as number,
        lng: DISTRICTS.find((d) => d[0] === e.districtCode)![6] as number,
        startDate: start,
        endDate: new Date(start.getTime() + (e.lenDays - 1) * DAY),
        ticketInfo: "Most venues free; premium seating via event desk.",
        expectedVisitors: e.expectedVisitors,
        status: "PUBLISHED",
        recurrenceNote: "Check current-year dates before travel.",
        heroGradient: null,
      },
      update: {},
    });
  }

  // ── Transport options ────────────────────────────────────────────────────
  const TRANSPORT = [
    { mode: "RAIL", label: "Vistadome Kirandul Passenger", fromPlace: "Visakhapatnam", toPlace: "Araku Valley", operatorName: "Indian Railways", scheduleSummary: "Daily ~06:50 dep.; 40 tunnels, 4h", approxCostMin: 45, approxCostMax: 250, durationMinutes: 240, bookingHint: "General + reserved coaches; Vistadome seats sell out fast.", notes: "Sit right side for valley views." },
    { mode: "ROAD_BUS", label: "APSRTC Indra AC bus", fromPlace: "Hyderabad", toPlace: "Vijayawada", operatorName: "APSRTC", scheduleSummary: "Every 30 min, 4.5h", approxCostMin: 450, approxCostMax: 750, durationMinutes: 270 },
    { mode: "RAIL", label: "Falaknuma Express", fromPlace: "Hyderabad", toPlace: "Vijayawada", operatorName: "Indian Railways", scheduleSummary: "Night trains daily", approxCostMin: 340, approxCostMax: 1200, durationMinutes: 390 },
    { mode: "RAIL", label: "Tirumala Express", fromPlace: "Hyderabad", toPlace: "Tirupati", operatorName: "Indian Railways", scheduleSummary: "Daily overnight", approxCostMin: 400, approxCostMax: 1500, durationMinutes: 720 },
    { mode: "ROAD_BUS", label: "APSRTC express bus", fromPlace: "Tirupati", toPlace: "Tirumala", operatorName: "APSRTC/TTD", scheduleSummary: "Every 10 min, 40 min ghat road", approxCostMin: 40, approxCostMax: 90, durationMinutes: 45, notes: "Free darshan bus included with Srivani tickets." },
    { mode: "ROAD_TAXI", label: "Cab/taxi", fromPlace: "Vijayawada Airport", toPlace: "Amaravati", operatorName: "Local taxi unions", scheduleSummary: "On demand", approxCostMin: 1200, approxCostMax: 1800, durationMinutes: 75 },
    { mode: "FERRY", label: "Boat cruise", fromPlace: "Pattiseema", toPlace: "Papikondalu", operatorName: "AP Tourism", scheduleSummary: "Daily 08:00 season-dependent", approxCostMin: 450, approxCostMax: 900, durationMinutes: 480, notes: "Includes bamboo-hut lunch stop." },
  ];
  for (const t of TRANSPORT) {
    const exists = await db.transportOption.findFirst({ where: { label: t.label, fromPlace: t.fromPlace, toPlace: t.toPlace } });
    if (!exists) await db.transportOption.create({ data: t as never });
  }

  // ── Emergency contacts ───────────────────────────────────────────────────
  const EMERGENCY = [
    { category: "HELPLINE", name: "National Emergency Number", phone: "112", isUniversal: true },
    { category: "AMBULANCE", name: "Ambulance (national)", phone: "108", isUniversal: true },
    { category: "POLICE", name: "Police control room", phone: "100", isUniversal: true },
    { category: "WOMAN_CHILD", name: "Women & child helpline", phone: "181", isUniversal: true },
    { category: "DISASTER", name: "Disaster response (APSDMA)", phone: "1070", isUniversal: true },
    { category: "TOURISM", name: "AP Tourism information", phone: "180042545455", isUniversal: true },
    { category: "HOSPITAL", name: "Government General Hospital, Vizag", phone: "+918912563111", districtCode: "VSP" },
    { category: "POLICE", name: "Tirumala Police", phone: "+918772264343", districtCode: "TIR" },
    { category: "HOSPITAL", name: "SVIMS Hospital Tirupati", phone: "+918772287777", districtCode: "TIR" },
    { category: "POLICE", name: "Vijayawada Police Commissionerate", phone: "+918662575111", districtCode: "NTR" },
    { category: "HOSPITAL", name: "GGH Kurnool", phone: "+918512780222", districtCode: "KNL" },
  ] as Array<{ category: string; name: string; phone: string; isUniversal?: boolean; districtCode?: string }>;
  for (const c of EMERGENCY) {
    const exists = await db.emergencyContact.findFirst({ where: { name: c.name } });
    if (!exists) {
      await db.emergencyContact.create({
        data: { category: c.category, name: c.name, phone: c.phone, isUniversal: c.isUniversal ?? false, districtId: c.districtCode ? districtByCode.get(c.districtCode)! : null },
      });
    }
  }

  // ── Gamification ─────────────────────────────────────────────────────────
  const BADGES = [
    { code: "FIRST_STEPS", name: "First Steps", tier: "BRONZE", icon: "👣", criteriaJson: { type: "LEDGER_MIN", min: 50 }, description: "Earn your first 50 Sanchari points." },
    { code: "TRIP_PLANNER", name: "Trip Planner", tier: "BRONZE", icon: "🗺️", criteriaJson: { type: "TRIPS_CREATED", count: 1 }, description: "Create your first AI-assisted trip plan." },
    { code: "STORYTELLER", name: "Storyteller", tier: "SILVER", icon: "✍️", criteriaJson: { type: "REVIEWS_APPROVED", count: 1 }, description: "Have your first review published." },
    { code: "DISTRICT_EXPLORER", name: "District Explorer", tier: "GOLD", icon: "🧭", criteriaJson: { type: "DISTRICTS_IN_REVIEWS", districts: 2 }, description: "Review places across 2 different districts." },
    { code: "TEMPLE_WANDERER", name: "Temple Wanderer", tier: "SILVER", icon: "🛕", criteriaJson: { type: "CATEGORY_REVIEWED", category: "temples", count: 2 }, description: "Review two temple experiences." },
  ];
  for (const b of BADGES) {
    await db.badge.upsert({ where: { code: b.code }, create: b, update: {} });
  }

  await db.challenge.upsert({
    where: { code: "COAST_TO_HILLS" },
    create: {
      code: "COAST_TO_HILLS",
      name: "Coast to Hills Challenge",
      description: "Review one beach AND one hill-station experience this season.",
      rulesJson: { type: "MULTI_CATEGORY_REVIEWS", categories: ["beaches", "hills"], count: 2 },
      pointsReward: 150,
      startsAt: new Date(),
      endsAt: daysFromNow(60),
      isActive: true,
    },
    update: {},
  });

  // Config: editable point values consumed by gamification domain
  const { DEFAULT_POINTS } = await import("../src/server/domains/gamification");
  await db.config.upsert({
    where: { key: "gamification.points" },
    create: { key: "gamification.points", value: DEFAULT_POINTS as never, description: "Points awarded per action (admin-editable)." },
    update: {},
  });
  await db.config.upsert({
    where: { key: "sandbox.notice" },
    create: { key: "sandbox.notice", value: { payments: "Payments run in sandbox simulation until gateway credentials are configured." } as never, description: "Visible sandbox labeling copy." },
    update: {},
  });

  // ── CMS content ──────────────────────────────────────────────────────────
  await db.contentPage.upsert({
    where: { slug: "about-sanchari" },
    create: {
      slug: "about-sanchari",
      title: "About Sanchari",
      body: "Sanchari is the intelligent tourism platform for Andhra Pradesh. It combines a verified destination catalogue, honest cost-aware AI planning, live weather awareness, and clearly-labelled sandbox commerce so travellers can plan with confidence.",
      excerpt: "Plan Andhra Pradesh trips with verified data and honest AI.",
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
    update: {},
  });
  await db.contentPage.upsert({
    where: { slug: "travel-responsibly" },
    create: {
      slug: "travel-responsibly",
      title: "Travel Responsibly",
      body: "Respect temple dress codes, carry back your waste from hill and beach areas, hire local guides at heritage sites, and check safety alerts before remote-area travel.",
      excerpt: "Simple norms that keep Andhra beautiful.",
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
    update: {},
  });

  const FAQS = [
    { question: "Is Sanchari free to use?", answer: "Yes — planning, discovery and the AI assistant are free. You pay only for actual bookings made through partners." },
    { question: "How accurate are itinerary costs?", answer: "Estimates use real entry fees, typical meal costs by stay tier and empirical travel times. They are estimates, clearly marked, and exclude shopping." },
    { question: "Are bookings live?", answer: "Stay availability runs in labelled sandbox mode until a channel manager is connected. Payment flows are fully exercised in simulation." },
    { question: "Which languages are supported?", answer: "English, Telugu and Hindi for assistant conversations; interface translations roll out progressively." },
    { question: "How do I get darshan tickets for Tirumala?", answer: "Darshan slots are issued by TTD on their official portal. Sanchari links you there and plans logistics around your slot — we never resell darshan." },
    { question: "What happens in bad weather?", answer: "Your plan flags weather-sensitive stops. Ask the planner to 'adjust for rain' and outdoor items move later or get indoor replacements suggested." },
  ];
  let faqOrder = 0;
  for (const f of FAQS) {
    const exists = await db.faq.findFirst({ where: { question: f.question } });
    if (!exists) await db.faq.create({ data: { ...f, sortOrder: faqOrder++ } });
  }

  // ── Demo engagement for the tourist account ─────────────────────────────
  const reviewExists = await db.review.findFirst({ where: { userId: users["demo@sanchari.in"]!, destinationId: destBySlug.get("borra-caves")! } });
  if (!reviewExists) {
    await db.review.create({
      data: {
        userId: users["demo@sanchari.in"]!,
        targetType: "DESTINATION",
        destinationId: destBySlug.get("borra-caves")!,
        rating: 5,
        title: "Otherworldly limestone halls",
        body: "Went on the 10 AM opening — cool air inside was a blessing. Formations lit beautifully; guides explain the mythology behind each shape. Combine with Katiki falls the same morning.",
        status: "APPROVED",
        helpfulCount: 7,
      },
    });
  }
  const ledgerCount = await db.rewardLedgerEntry.count({ where: { userId: users["demo@sanchari.in"] } });
  if (ledgerCount === 0) {
    await db.rewardLedgerEntry.create({
      data: { userId: users["demo@sanchari.in"]!, action: "EARN", points: 50, reasonCode: "WELCOME", description: "Welcome to Sanchari!", balanceAfter: 50 },
    });
  }

  console.log("✅ Seed complete.");
  console.log("   Logins (password: Password123):");
  console.log("   • admin@sanchari.in   (SUPER_ADMIN)");
  console.log("   • editor@sanchari.in  (EDITOR)");
  console.log("   • moderator@sanchari.in (MODERATOR)");
  console.log("   • tourism@sanchari.in (TOURISM_ADMIN)");
  console.log("   • district@sanchari.in (DISTRICT_ADMIN)");
  console.log("   • partner@sanchari.in (PARTNER)");
  console.log("   • demo@sanchari.in    (TOURIST)");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
