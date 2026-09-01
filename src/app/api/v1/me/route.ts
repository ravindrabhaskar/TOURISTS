import { handle, ok } from "@/lib/http";
import { getViewer } from "@/server/auth/guard";

/**
 * Current viewer for client shells (the site header) that must stay statically
 * rendered. Returns `{ viewer: null }` when signed out rather than a 401 so the
 * header can render its signed-out state without treating it as an error.
 */
export async function GET() {
  return handle(async () => {
    const viewer = await getViewer();
    return ok({
      viewer: viewer ? { name: viewer.name, role: viewer.role } : null,
    });
  });
}
