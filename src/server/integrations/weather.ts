import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export type WeatherNow = {
  temperatureC: number;
  feelsLikeC: number;
  humidityPct: number;
  precipitationMm: number;
  windKph: number;
  condition: string;
  isMock: boolean;
};

export type DailyForecast = {
  date: string;
  maxTempC: number;
  minTempC: number;
  rainProbabilityPct: number;
  condition: string;
};

export type WeatherReport = {
  current: WeatherNow;
  forecast: DailyForecast[];
  travelAdvice: string[];
  source: "open-meteo" | "mock";
};

function codeToCondition(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly cloudy";
  if (code === 45 || code === 48) return "Foggy";
  if (code >= 51 && code <= 67) return "Drizzle / Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code >= 95) return "Thunderstorm";
  return "Cloudy";
}

function adviceFor(current: WeatherNow, rainChance: number): string[] {
  const tips: string[] = [];
  if (current.temperatureC >= 38) tips.push("Peak heat — schedule outdoor visits before 10 AM or after 4 PM and carry water.");
  else if (current.temperatureC <= 18) tips.push("Cool weather — carry a light jacket, especially for hill areas like Lambasingi or Horsley Hills.");
  if (rainChance >= 60) tips.push("High chance of rain — keep a raincoat handy and prefer indoor sites (museums, temples) as backups.");
  if (current.windKph >= 35) tips.push("Windy conditions — boat rides and beach activities may be affected.");
  if (tips.length === 0) tips.push("Pleasant travel conditions expected.");
  return tips;
}

// In-process TTL cache — protects the upstream free API and keeps pages fast.
const cache = new Map<string, { at: number; report: WeatherReport }>();
const TTL_MS = 30 * 60 * 1000;

async function fetchOpenMeteo(lat: number, lng: number): Promise<WeatherReport> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lng.toFixed(3)}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code` +
    `&forecast_days=5&timezone=Asia%2FKolkata`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6000), next: { revalidate: 1800 } } as RequestInit);
  if (!res.ok) throw new Error(`open-meteo ${res.status}`);
  const j = (await res.json()) as {
    current: Record<string, number>;
    daily: { time: string[]; temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_probability_max: Array<number | null>; weather_code: number[] };
  };
  const current: WeatherNow = {
    temperatureC: Math.round(j.current.temperature_2m ?? 0),
    feelsLikeC: Math.round(j.current.apparent_temperature ?? j.current.temperature_2m ?? 0),
    humidityPct: Math.round(j.current.relative_humidity_2m ?? 0),
    precipitationMm: j.current.precipitation ?? 0,
    windKph: Math.round((j.current.wind_speed_10m ?? 0) * 3.6),
    condition: codeToCondition(Number(j.current.weather_code ?? 0)),
    isMock: false,
  };
  const forecast: DailyForecast[] = j.daily.time.map((d, i) => ({
    date: d,
    maxTempC: Math.round(j.daily.temperature_2m_max[i] ?? 0),
    minTempC: Math.round(j.daily.temperature_2m_min[i] ?? 0),
    rainProbabilityPct: j.daily.precipitation_probability_max[i] ?? 0,
    condition: codeToCondition(j.daily.weather_code[i] ?? 0),
  }));
  const rainChance = Math.max(forecast[0]?.rainProbabilityPct ?? 0, current.precipitationMm > 0 ? 80 : 0);
  return { current, forecast, travelAdvice: adviceFor(current, rainChance), source: "open-meteo" };
}

function mockReport(lat: number, lng: number): WeatherReport {
  // Deterministic pseudo-climate so UI/UX and planner flows work offline.
  // Clearly labeled isMock=true; never presented as live data.
  const seed = Math.abs(Math.sin(lat * 31 + lng * 17)) ;
  const temp = Math.round(24 + seed * 12);
  const current: WeatherNow = {
    temperatureC: temp,
    feelsLikeC: temp + 2,
    humidityPct: 55 + Math.round(seed * 30),
    precipitationMm: 0,
    windKph: 8 + Math.round(seed * 12),
    condition: seed > 0.7 ? "Partly cloudy" : "Clear",
    isMock: true,
  };
  const forecast: DailyForecast[] = Array.from({ length: 5 }, (_, i) => ({
    date: new Date(Date.now() + i * 86400000).toISOString().slice(0, 10),
    maxTempC: temp + ((i * 3) % 5) - 1,
    minTempC: temp - 8 + ((i * 2) % 4),
    rainProbabilityPct: (seed > 0.85 ? 65 : 15) + i,
    condition: i % 4 === 3 ? "Rain showers" : "Partly cloudy",
  }));
  return { current, forecast, travelAdvice: adviceFor(current, forecast[0]!.rainProbabilityPct), source: "mock" };
}

export async function getWeather(lat: number, lng: number): Promise<WeatherReport> {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.report;

  let report: WeatherReport;
  if (env.MOCK_WEATHER) {
    report = mockReport(lat, lng);
  } else {
    try {
      report = await fetchOpenMeteo(lat, lng);
    } catch (e) {
      logger.warn("weather.fallback_mock", { error: String(e) });
      report = mockReport(lat, lng);
    }
  }
  cache.set(key, { at: Date.now(), report });
  return report;
}
