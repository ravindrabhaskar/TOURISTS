import { errors, handle, ok } from "@/lib/http";
import { guardRate } from "@/lib/rate-limit";
import { getWeather } from "@/server/integrations/weather";

export async function GET(req: Request) {
  return handle(async () => {
    guardRate(req, "api:weather", 90, 60);
    const p = new URL(req.url).searchParams;
    const lat = Number(p.get("lat"));
    const lng = Number(p.get("lng"));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw errors.badRequest("lat and lng required.");
    const report = await getWeather(lat, lng);
    return ok(report);
  });
}
