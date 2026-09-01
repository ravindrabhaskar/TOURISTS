import type { EnquiryStatus } from "@/lib/types";

export const SITE = {
  name: "Sanchari Travel Co.",
  shortName: "Sanchari",
  since: 2011,
  address: "Banjara Hills, Hyderabad 500034",
  phone: "+91 40 4000 1120",
  whatsapp: "+91 98480 11220",
  email: "hello@sanchari.travel",
  coords: "17.4065° N, 78.4772° E",
};

export interface Testimonial {
  quote: string;
  name: string;
  trip: string;
  rating: number;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "They moved our Pangong camp a day earlier because of a weather warning I never even saw. That is not an app, that is a person watching the sky for you.",
    name: "Sneha Reddy",
    trip: "Ladakh High Passes",
    rating: 5,
  },
  {
    quote:
      "Third trip with Sanchari. The month advice is real — they talked us out of Goa in June and into Coorg instead. Best holiday decision we didn't make ourselves.",
    name: "Arjun & Meera Iyer",
    trip: "Coorg Coffee & Hampi Ruins",
    rating: 5,
  },
  {
    quote:
      "Twelve strangers on day one, a WhatsApp group that still runs on day four hundred. The Mara camp they picked was worth every rupee.",
    name: "Farhan Ali",
    trip: "Kenya: Masai Mara Migration",
    rating: 5,
  },
  {
    quote:
      "My mother needs slower mornings. They rebuilt the Kerala route around it without charging extra and never once made it feel like a fuss.",
    name: "Divya Menon",
    trip: "Kerala Backwaters & Hills",
    rating: 5,
  },
  {
    quote:
      "The season bar on each trip is honest — we went to Meghalaya in October exactly as suggested and had waterfalls at full volume with empty viewpoints.",
    name: "Karthik Rao",
    trip: "Meghalaya Living Root Bridges",
    rating: 5,
  },
  {
    quote:
      "Enquiry to confirmation in nine hours flat, with a reference code and an actual human signature. Felt like 2011 in the best possible way.",
    name: "Priya Sharma",
    trip: "Vietnam North to South",
    rating: 4,
  },
];

export interface Faq {
  q: string;
  a: string;
}

export const FAQS: Faq[] = [
  {
    q: "How big are the groups, really?",
    a: "Never more than sixteen travellers, and several treks cap at ten or twelve. If bookings pass the cap we open a second departure rather than squeeze another seat.",
  },
  {
    q: "What does 'per person, ex-India' mean?",
    a: "Prices cover everything once you land at the destination — stays, transfers, listed meals, permits, guides and entries. Flights from India are quoted separately so you can use miles or your own booking.",
  },
  {
    q: "Are solo travellers welcome?",
    a: "Yes — roughly a third of our travellers come alone. We pair solo travellers of the same gender to avoid single supplements wherever possible, and the planner confirms pairing status before you pay.",
  },
  {
    q: "How firm are the prices?",
    a: "The rupee figure you see is the figure you are quoted. It moves only if you ask for upgrades — a suite, a helicopter hop, a private vehicle — and the quote itemises any change.",
  },
  {
    q: "What happens after I send an enquiry?",
    a: "You get a reference code instantly. A planner replies within one working day with availability, answers and a hold on your seats. Nothing is payable until you say yes in writing.",
  },
  {
    q: "What is your cancellation position?",
    a: "Full refund minus actual costs until 45 days before departure, 50% until 21 days, and credit valid for a year after that. Weather-forced changes by us are always rebooked free.",
  },
];

export interface ValueProp {
  icon: string;
  title: string;
  body: string;
}

export const VALUES: ValueProp[] = [
  {
    icon: "calendar",
    title: "We lead with the month",
    body: "Every trip carries honest twelve-month season data. If March is burning season in northern Thailand, we say so — even though it costs us the enquiry.",
  },
  {
    icon: "users",
    title: "Sixteen, never sixty",
    body: "Groups stay under sixteen so restaurants can seat you, guides can hear you and nobody waits at a gate counting heads.",
  },
  {
    icon: "wallet",
    title: "Rupee-honest pricing",
    body: "One per-person price in INR covering the ground product. No drip pricing, no 'starting from' sleight of hand, GST shown upfront.",
  },
  {
    icon: "compass",
    title: "Run by travellers",
    body: "Founded in Hyderabad in 2011 by four people who quit desk jobs to plan trips. Every route is walked by us before it is sold by us.",
  },
];

export interface Step {
  title: string;
  body: string;
}

export const STEPS: Step[] = [
  {
    title: "Tell us the shape of the trip",
    body: "Pick a trip and a date — or just describe the mood. The enquiry takes ninety seconds and asks nothing you don't want to answer.",
  },
  {
    title: "A planner replies within a day",
    body: "You get availability, an honest read on the month you chose, and a complimentary hold on your seats. No payment yet.",
  },
  {
    title: "Confirm with a reference code",
    body: "Happy with the plan? One confirmation locks it. Your reference tracks the booking end-to-end, and your shortlist travels with it.",
  },
  {
    title: "Show up; we handle the weather",
    body: "Permits, porters, tables, tents. If a pass closes or a storm rolls in, the itinerary bends and you find out over chai, not in panic.",
  },
];

export const STATUS_FLOW: EnquiryStatus[] = [
  "new",
  "planning",
  "quoted",
  "confirmed",
];

export const STATUS_LABEL: Record<EnquiryStatus, string> = {
  new: "New",
  planning: "Planning",
  quoted: "Quoted",
  confirmed: "Confirmed",
  archived: "Archived",
};

export interface TeamMember {
  name: string;
  role: string;
  bio: string;
}

export const TEAM: TeamMember[] = [
  {
    name: "Ananya Rao",
    role: "Founder · Routes & Data",
    bio: "Quit a consulting desk in 2011, walked Ladakh on a dare, and started grading months instead of brochures. Owns the season dataset everyone else argues with.",
  },
  {
    name: "Farhan Quresi",
    role: "Head of Operations",
    bio: "The reason a landslide on the Sela road becomes a better itinerary by lunchtime. Fifteen years of moving people through mountains calmly.",
  },
  {
    name: "Meghna Iyer",
    role: "Lead Planner · South & Islands",
    bio: "Has personally slept on every houseboat we sell. Will talk you out of Goa in June and never once make it feel like a sales pitch.",
  },
  {
    name: "Debasish Borah",
    role: "Lead Planner · Himalaya & Northeast",
    bio: "Grew up in Guwahati, has crossed Meghalaya's root-bridge trail more times than he can count, and knows which homestay makes the best pork.",
  },
];

export function whatsappLink(message?: string): string {
  const text = encodeURIComponent(
    message ||
      `Hi Sanchari! I'm browsing your trips and have a question.`,
  );
  return `https://wa.me/${SITE.whatsapp.replace(/[\s+]/g, "")}?text=${text}`;
}

export interface Collection {
  title: string;
  sub: string;
  href: string;
  image: string;
}

export const COLLECTIONS: Collection[] = [
  {
    title: "Winter sun escapes",
    sub: "Prime in December & January",
    href: "/trips?month=0&sort=popular",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Under ₹30,000",
    sub: "Big weeks, small budgets",
    href: "/trips?budget=under-30&sort=price-asc",
    image:
      "https://picsum.photos/seed/tradewinds-budget/900/600",
  },
  {
    title: "Long weekends",
    sub: "Five days or fewer",
    href: "/trips?dur=short",
    image:
      "https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Festival departures",
    sub: "Timed to the calendar",
    href: "/trips?tag=Festival",
    image:
      "https://picsum.photos/seed/tradewinds-festival/900/600",
  },
];
