import { handle, ok } from "@/lib/http";
import { guardRate } from "@/lib/rate-limit";
import { requireUser } from "@/server/auth/guard";
import { applyTripModification } from "@/server/domains/trips/modify-service";

/** Day-level itinerary modification endpoint. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    guardRate(req, "api:trip-modify", 30, 60);
    const user = await requireUser();
    const { id } = await params;
    const result = await applyTripModification(user.id, id, await req.json().catch(() => null));
    return ok(result);
  });
}
