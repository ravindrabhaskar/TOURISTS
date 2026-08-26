import { handle, ok } from "@/lib/http";
import { requireUser } from "@/server/auth/guard";
import { deleteTrip, getTripForOwner } from "@/server/domains/trips/service";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await params;
    return ok(await getTripForOwner(id, user.id));
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await params;
    await deleteTrip(id, user.id);
    return ok({ deleted: true });
  });
}
