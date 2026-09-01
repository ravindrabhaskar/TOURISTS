import { promises as fs } from "fs";
import path from "path";
import type { EnquiryRecord } from "@/lib/types";
import { SITE } from "@/lib/data/site";

export type StoredEnquiry = EnquiryRecord & {
  utm?: Record<string, string>;
};

const DIR = process.env.DATA_DIR || path.join(process.cwd(), ".data");
const FILE = path.join(DIR, "enquiries.json");

async function readAll(): Promise<StoredEnquiry[]> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return JSON.parse(raw) as StoredEnquiry[];
  } catch {
    return [];
  }
}

async function writeAll(list: StoredEnquiry[]) {
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(list, null, 2), "utf8");
}

function demoEnquiries(): StoredEnquiry[] {
  const day = 86400000;
  const mk = (
    ref: string,
    daysAgo: number,
    name: string,
    email: string,
    slug: string,
    travellers: number,
    status: EnquiryRecord["status"],
    estTotal: number,
  ): StoredEnquiry => {
    const tripName =
      {
        "ladakh-high-passes": "Ladakh High Passes",
        "kenya-masai-mara": "Kenya: Masai Mara Migration",
        "kerala-backwaters-hills": "Kerala Backwaters & Hills",
        "bali-nusa-islands": "Bali & the Nusa Islands",
        "meghalaya-root-bridges": "Meghalaya Living Root Bridges",
        "switzerland-alps-rail": "Switzerland Alps Rail Explorer",
      }[slug] ?? slug;
    return {
      ref,
      createdAt: new Date(Date.now() - daysAgo * day).toISOString(),
      name,
      email,
      phone: "+91 98xxx xxxxx",
      travellers,
      tripSlug: slug,
      tripName,
      departure: null,
      estTotal,
      status,
      note: "",
      demo: true,
    };
  };
  return [
    mk("TW-K7M2PX", 1, "Ananya Rao", "ananya.r@example.com", "ladakh-high-passes", 2, "new", 97000),
    mk("TW-Q4T8LD", 2, "Vikram Sethi", "v.sethi@example.com", "kenya-masai-mara", 4, "planning", 512000),
    mk("TW-H3N9WB", 5, "Fatima Sheikh", "fatima.s@example.com", "kerala-backwaters-hills", 6, "quoted", 165720),
    mk("TW-D8R5JC", 8, "Nikhil Bose", "nikhil.b@example.com", "bali-nusa-islands", 2, "confirmed", 99600),
    mk("TW-M6Y2KA", 12, "Ishita Ghosh", "ishita.g@example.com", "meghalaya-root-bridges", 3, "new", 85500),
    mk("TW-P2C7VE", 15, "Rohan Kulkarni", "rohan.k@example.com", "switzerland-alps-rail", 2, "archived", 336000),
  ];
}

export async function seedIfEmpty() {
  const list = await readAll();
  if (list.length === 0) {
    await writeAll(demoEnquiries());
  }
}

export async function resetEnquiries() {
  try {
    await fs.rm(FILE, { force: true });
  } catch {}
  await writeAll(demoEnquiries());
}

export async function listEnquiries(): Promise<StoredEnquiry[]> {
  const list = await readAll();
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function insertEnquiry(rec: StoredEnquiry) {
  const list = await readAll();
  list.unshift(rec);
  await writeAll(list);
}

export async function mutateEnquiry(
  ref: string,
  patch: Partial<Pick<StoredEnquiry, "status" | "note">>,
) {
  const list = await readAll();
  const idx = list.findIndex((r) => r.ref === ref);
  const existing = list[idx];
  if (!existing) return false;
  list[idx] = { ...existing, ...patch };
  await writeAll(list);
  return true;
}

export async function findStored(ref: string, email: string) {
  const list = await readAll();
  return (
    list.find(
      (r) =>
        r.ref.toUpperCase() === ref.trim().toUpperCase() &&
        r.email.toLowerCase() === email.trim().toLowerCase(),
    ) ?? null
  );
}

export function sanitizeForPublic(r: StoredEnquiry): EnquiryRecord & { utmSource?: string } {
  return {
    ref: r.ref,
    createdAt: r.createdAt,
    name: r.name,
    email: r.email,
    phone: r.phone,
    travellers: r.travellers,
    tripSlug: r.tripSlug,
    tripName: r.tripName,
    departure: r.departure,
    estTotal: r.estTotal,
    message: r.message,
    status: r.status,
    utmSource: r.utm?.utm_source,
  };
}

export const INTERNAL_INBOX = SITE.email;
