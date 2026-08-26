import type { AiMessage, CompletionRequest, CompletionResult, LlmProvider, ToolCall } from "../types";

/**
 * Deterministic offline provider. Implements the same tool-loop contract as the
 * hosted providers using keyword routing + template composition over REAL
 * platform tool results — never fabricated facts. Used when no API key is
 * configured; UI labels responses as coming from the built-in engine.
 */

const GREETINGS = /^(hi|hello|hey|namaste|namaskaram)\b/i;
const WEATHER_RE = /weather|rain|temperature|hot|cold|forecast/i;
const NEARBY_RE = /near(by)?|around|close to|within \d+\s*km/i;
const HOTELS_RE = /hotel|resort|homestay|stay|accommodation|where to sleep|rooms?/i;
const EVENTS_RE = /festival|event|utsav|jathara|happening this month/i;
const TRANSPORT_RE = /how (do i )?(reach|get)|bus|train|flight|transport|reach/i;
const PLAN_RE = /\b(plan|itinerary|trip|days?\b.*\btrip|\d+ day)/i;

export const mockProvider: LlmProvider = {
  name: "sanchari-engine",
  model: "rules-v1",
  async complete(req: CompletionRequest): Promise<CompletionResult> {
    const lastUser = [...req.messages].reverse().find((m) => m.role === "user");

    // Tool-result turn: compose final grounded answer from real tool output.
    const pendingToolMsg = req.messages.find((m) => m.role === "tool");
    if (pendingToolMsg) {
      return { text: composeFromTools(req, pendingToolMsg), toolCalls: [], usage: {}, provider: this.name, model: this.model };
    }
    if (!lastUser) return { text: null, toolCalls: [], usage: {}, provider: this.name, model: this.model };
    const q = lastUser.content;

    const calls: ToolCall[] = [];
    if (WEATHER_RE.test(q)) {
      calls.push({ id: "c1", name: "getWeather", argumentsJson: JSON.stringify({ placeHint: extractPlace(q) ?? "" }) });
    } else if (NEARBY_RE.test(q)) {
      calls.push({ id: "c1", name: "nearbyPlaces", argumentsJson: JSON.stringify({ placeHint: extractPlace(q) ?? "", radiusKm: extractRadius(q) }) });
    } else if (HOTELS_RE.test(q)) {
      calls.push({ id: "c1", name: "searchHotels", argumentsJson: JSON.stringify({ district: extractPlace(q) }) });
    } else if (EVENTS_RE.test(q)) {
      calls.push({ id: "c1", name: "searchEvents", argumentsJson: "{}" });
    } else if (TRANSPORT_RE.test(q)) {
      const { from, to } = extractRoute(q);
      calls.push({ id: "c1", name: "getTransportOptions", argumentsJson: JSON.stringify({ from, to }) });
    } else if (!GREETINGS.test(q)) {
      calls.push({ id: "c1", name: "searchDestinations", argumentsJson: JSON.stringify({ q: stripStopwords(q) }) });
    }

    if (calls.length > 0 && !PLAN_RE.test(q)) {
      return { text: null, toolCalls: calls, usage: {}, provider: this.name, model: this.model };
    }
    if (PLAN_RE.test(q)) {
      calls.push({ id: "c9", name: "createItinerary", argumentsJson: "{}" });
      return { text: null, toolCalls: calls, usage: {}, provider: this.name, model: this.model };
    }

    return {
      text:
        "Namaskaram! I'm the Sanchari travel assistant. Ask me things like “What can I visit near Tirupati?”, “Weather in Araku”, “Temples within 20 km of Vijayawada”, or start planning with the AI Trip Planner.",
      toolCalls: [],
      usage: {},
      provider: this.name,
      model: this.model,
    };
  },
};

function stripStopwords(q: string): string {
  return q
    .replace(/what|can|i|visit|see|in|near|the|a|an|is|are|best|time|to|show|me|tell|about|for/gi, "")
    .replace(/\s+/g, " ")
    .trim() || "andhra pradesh";
}

function extractPlace(q: string): string | undefined {
  const known = [
    "Tirupati", "Visakhapatnam", "Vizag", "Vijayawada", "Araku", "Amaravati", "Srisailam",
    "Gandikota", "Lepakshi", "Horsley Hills", "Lambasingi", "Rajahmundry", "Kakinada",
    "Kurnool", "Nellore", "Chittoor", "Anantapur", "Eluru", "Bheemili", "Papikondalu",
  ];
  const lower = q.toLowerCase();
  return known.find((k) => lower.includes(k.toLowerCase()));
}

function extractRadius(q: string): string {
  const m = q.match(/within\s+(\d+)\s*km/i);
  return m ? m[1]! : "25";
}

function extractRoute(q: string): { from: string; to: string } {
  const known = ["Visakhapatnam", "Vijayawada", "Tirupati", "Hyderabad", "Rajahmundry", "Araku", "Srisailam", "Kurnool"];
  const found = known.filter((k) => q.toLowerCase().includes(k.toLowerCase()));
  return { from: found[0] ?? "Hyderabad", to: found[1] ?? "Visakhapatnam" };
}

function composeFromTools(req: CompletionRequest, toolMsg: AiMessage): string {
  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(toolMsg.content) as Record<string, unknown>;
  } catch {
    return "I couldn't process that lookup. Could you rephrase?";
  }
  const lines: string[] = [];
  const toolName = req.tools?.length ? (req.messages.filter((m) => m.role === "assistant").pop(), undefined) : undefined;
  void toolName;

  if ("results" in payload && Array.isArray(payload.results)) {
    const results = payload.results as Array<Record<string, unknown>>;
    if (results.length === 0) {
      lines.push("I couldn't find matching entries in the platform catalog. Try a different spelling or broader search.");
    } else if ("distanceKm" in results[0]!) {
      lines.push("Here are places near that location:");
      for (const r of results.slice(0, 6)) lines.push(`• ${r.name} — ${r.distanceKm} km · [view](/destinations/${r.href ? String(r.href).split("/").pop() : r.slug})`);
    } else if ("priceRangeRupees" in results[0]!) {
      lines.push("Verified properties on the platform:");
      for (const r of results.slice(0, 5))
        lines.push(`• ${r.name} (${r.type}) — ₹${(r.priceRangeRupees as number[])[0]}–₹${(r.priceRangeRupees as number[])[1]}/night`);
      lines.push("_Note: live availability requires a connected booking partner._");
    } else if ("dates" in results[0]!) {
      lines.push("Upcoming festivals and events:");
      for (const r of results.slice(0, 6)) lines.push(`• ${r.title} — ${r.district} · ${r.dates}`);
    } else {
      lines.push("Top matches from the Andhra Pradesh catalog:");
      for (const r of results.slice(0, 5))
        lines.push(`• [${r.name}](/destinations/${r.slug})${r.district ? ` — ${r.district}` : ""}${r.rating ? ` ★${r.rating}` : ""}\n  ${(r.summary as string)?.slice(0, 120)}`);
    }
  } else if ("current" in payload) {
    lines.push(`${payload.place}: ${payload.current} (source: ${payload.source === "mock" ? "offline sample data" : "live weather"})`);
    for (const tip of (payload.advice as string[]) ?? []) lines.push(`• ${tip}`);
  } else if ("options" in payload) {
    lines.push("Curated transport options:");
    for (const o of (payload.options as Array<Record<string, unknown>>).slice(0, 5)) {
      lines.push(`• ${o.label}${o.operator ? ` (${o.operator})` : ""} — ${o.route}${o.approxCostRupees ? ` · ₹${(o.approxCostRupees as number[])[0]}–₹${(o.approxCostRupees as number[])[1]}` : ""}`);
    }
  } else if ("note" in payload) {
    lines.push(String(payload.note));
    if ("plannerUrl" in payload) lines.push("Open the [AI Trip Planner](/plan) and I'll build a full day-wise itinerary with costs.");
  } else if ("error" in payload) {
    lines.push(`Hmm — ${String(payload.error)}. Try naming a specific destination or district.`);
  } else {
    lines.push("Let me know what you'd like to explore in Andhra Pradesh — destinations, stays, events, weather or transport.");
  }

  return lines.join("\n");
}
