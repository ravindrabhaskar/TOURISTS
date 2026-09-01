export interface JournalPost {
  slug: string;
  title: string;
  date: string;
  readMins: number;
  tag: string;
  excerpt: string;
  cover: string;
  relatedTrips: string[];
  body: string[];
}

export const JOURNAL: JournalPost[] = [
  {
    slug: "valley-of-flowers-timing",
    title: "The two weeks that make the Valley of Flowers worth it",
    date: "2026-06-18",
    readMins: 5,
    tag: "Season intel",
    excerpt:
      "The valley opens for four months, but there is a narrow window when it is genuinely unmissable. Here is how we read the bloom.",
    cover: "https://picsum.photos/seed/tw-journal-vof/1200/700",
    relatedTrips: ["valley-of-flowers"],
    body: [
      "The Valley of Flowers opens on June 1st and closes around October 31st, and every year someone asks whether they should go in June to beat the crowds. Our answer is always the same: wait.",
      "June is snowmelt season. The valley is green but shy — most of its famous blooms flower after the first monsoon spells arrive, and the blue poppy, the plant people climb seven hours for, barely shows itself before mid-July. What June offers is waterfalls and empty trails; what it withholds is flowers.",
      "Our data puts prime time at July and August, and within those months the second half of July through the first week of August is the sweet spot. By late August the meadows are seeding out, and by September the show has moved on to golden grasses.",
      "One honest note: this is a rain-fed ecosystem, which means rain is part of the ticket. We run the trip in July because the alternatives are worse, not because they are dry. Pack a proper shell, not an umbrella.",
    ],
  },
  {
    slug: "kashmir-vs-spiti",
    title: "Kashmir or Spiti? Choosing your Himalaya",
    date: "2026-05-02",
    readMins: 6,
    tag: "Trip picking",
    excerpt:
      "Both are mountains, both are July trips, and they could not be more different holidays. A planner's decision tree.",
    cover: "https://picsum.photos/seed/tw-journal-kvsp/1200/700",
    relatedTrips: ["kashmir-great-lakes", "spiti-valley-homestays", "ladakh-high-passes"],
    body: [
      "Every June our inbox splits into two camps: people who want the Kashmir Great Lakes trek, and people who want Spiti. They have usually chosen their dates before their landscape, which is backwards. Start with the kind of quiet you are looking for.",
      "Kashmir Great Lakes is a moving holiday. You walk every day, camp beside a different lake each night, and carry nothing heavier than a daypack. Phone signal disappears on day one and most trekkers describe getting it back as mildly disappointing.",
      "Spiti is a staying holiday. You sleep in village homestays at 4,000 metres, eat what the family eats, and spend mornings in monasteries where the only schedule is butter tea. It is culturally dense and physically gentler — though the altitude deserves the same respect as any trek.",
      "The tiebreaker is almost always roads. If long drives on narrow cliff roads excite you rather than exhaust you, Spiti wins. If you would rather earn your views on foot, Kashmir does. And if you cannot decide, Ladakh gives you a little of both with a bed at night.",
    ],
  },
  {
    slug: "kerala-monsoon-honest-guide",
    title: "An honest guide to Kerala in the monsoon",
    date: "2026-04-20",
    readMins: 5,
    tag: "Season intel",
    excerpt:
      "Everyone says avoid June. We send people anyway — here is when it works, what closes, and why the rates drop by a third.",
    cover: "https://picsum.photos/seed/tw-journal-kerala-rain/1200/700",
    relatedTrips: ["kerala-backwaters-hills"],
    body: [
      "June to September is monsoon in Kerala, and most guides tell you to simply not go. That advice is half right, which for us is the dangerous kind.",
      "What genuinely suffers: beach time, houseboat upper-deck lounging, and hill treks in Munnar on slippery trails. What improves dramatically: the backwaters in rain are moody and gorgeous, Ayurvedic treatments are traditionally done in this season, waterfall country roars, and room rates fall by thirty to forty percent.",
      "We grade Kerala's monsoon months as shoulder, not closed — deliberately. Travellers who want the classic sun-and-backwater holiday should come between October and March. Travellers who want the greenest version of the state at the year's best prices should consider August, with flexible plans.",
      "The one month we would genuinely avoid is June, when the season's first bursts arrive with the year's heaviest downpours and the highest cancellation odds. By August the rhythm has settled into predictable afternoon spells you can plan around.",
    ],
  },
  {
    slug: "safari-budgets-in-rupees",
    title: "What an African safari actually costs, in rupees",
    date: "2026-03-11",
    readMins: 7,
    tag: "Budgets",
    excerpt:
      "₹1.28 lakh for the Mara sounds like a lot until you see where every rupee goes. A line-by-line breakdown of safari economics.",
    cover: "https://picsum.photos/seed/tw-journal-safari-cost/1200/700",
    relatedTrips: ["kenya-masai-mara", "tanzania-serengeti-zanzibar"],
    body: [
      "The first question about our Masai Mara trip is rarely where — it is why. So here is the arithmetic we walk every enquirer through.",
      "Park and conservation fees inside Kenyan reserves run roughly $80–100 per person per day. On a nine-day trip with multiple reserves, that is ₹60,000–70,000 of your ₹1.28 lakh before a single night's stay. These fees fund the rangers who keep the rhinos alive; they are not negotiable and they are not markup.",
      "Then the camp: legitimate conservancy camps cost $250–400 per person per night full-board, with game drives led by spotters who radio each other about leopard movements. Add a 4×4 Land Cruiser with fuel across hundreds of kilometres, and the internal flight from the Mara back to Nairobi.",
      "What you can control: travel dates (shoulder-season camps discount 20–30%), group size (our eight-person cap splits vehicle costs eight ways instead of four), and balloon safaris, which remain the single most optional ₹45,000 you will ever be offered.",
      "The honest summary: a safari is expensive because conservation is expensive. Book with operators who show you the fee breakdown — anyone quoting ₹60,000 all-in for the Mara in July is cutting corners somewhere you should worry about.",
    ],
  },
  {
    slug: "why-thailand-closes-in-march",
    title: "Why we close Thailand in March and April",
    date: "2026-02-14",
    readMins: 4,
    tag: "How we work",
    excerpt:
      "Northern Thailand burns its fields every spring, and we refuse to sell a trip that ruins the view and the lungs. Our most-argued data point.",
    cover: "https://picsum.photos/seed/tw-journal-thailand-smoke/1200/700",
    relatedTrips: ["thailand-bangkok-chiangmai"],
    body: [
      "On our Thailand page you will find March and April marked closed while every other operator runs trips. This is the most-argued cell in our entire season dataset, so here is the reasoning.",
      "Every spring, farmers across northern Thailand, Myanmar and Laos burn crop residue after harvest. The smoke pools in the mountain basins around Chiang Mai and Pai, and between late February and April the region records some of the worst air quality on the planet. Temple viewpoints disappear. Trekking becomes a respiratory event.",
      "Could we still sell it? Easily. Bangkok and the islands are fine, and clients who book blind rarely complain loudly enough to matter. But travellers remember the trip they could not breathe through, and we would rather lose the sale than the trust.",
      "The good news is that the calendar is generous: November to February is genuinely prime — cool nights, clear skies, lantern festivals — and the green monsoon months from May to October bring shoulder prices with afternoon showers you can set a watch by. There is no bad choice except the two months we have blacked out.",
    ],
  },
  {
    slug: "packing-for-ladakh",
    title: "Packing for Ladakh: the only list that matters",
    date: "2026-01-08",
    readMins: 6,
    tag: "Field notes",
    excerpt:
      "Layering beats luggage. What our trip leaders actually carry on ten days across the high passes.",
    cover: "https://picsum.photos/seed/tw-journal-ladakh-pack/1200/700",
    relatedTrips: ["ladakh-high-passes"],
    body: [
      "Ladakh in July is two climates wearing the same postcode. Leh afternoons touch 25°C while Pangong Tso at midnight falls below freezing, and Khardung La manages both within an hour's drive. The packing question is entirely about layers, not volume.",
      "The non-negotiables: a proper insulated jacket for evenings, fleece mid-layer, thermal base for lake nights, and sun protection that respects the fact that you are closer to the sun than you have ever been — SPF 50, lip balm with SPF, and category-4 sunglasses. The sunburn tourists get in Ladakh is not a metaphor.",
      "The frequently forgotten: a reusable water bottle (we carry purification tabs), moisturiser for air so dry it crackles skin in a day, high-energy snacks for pass crossings, and cash — ATMs in Leh run dry exactly when the town is fullest.",
      "What you can leave behind: trekking poles unless your knees insist (this is a road trip, not a trek), a sleeping bag (camps provide proper ones), and more than one book. Evening downtime is shorter than you think — acclimatisation makes everyone sleepy by nine.",
      "And the item our leaders rate highest: electrolyte sachets. Altitude headache is usually dehydration wearing a scary costume. Drink more than feels reasonable, and Pangong sunrise will thank you.",
    ],
  },
];
