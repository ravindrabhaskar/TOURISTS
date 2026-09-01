import { z } from "zod";
import { handle, ok } from "@/lib/http";
import { getViewer } from "@/server/auth/guard";
import {
  addToShortlist,
  listShortlist,
  mergeShortlist,
  removeFromShortlist,
} from "@/server/domains/shortlist";

const slugSchema = z.string().min(1).max(120).regex(/^[a-z0-9-]+$/);

/** Current account shortlist. Signed out returns null so the client keeps using
 *  its local list instead of treating it as an error. */
export async function GET() {
  return handle(async () => {
    const viewer = await getViewer();
    if (!viewer) return ok({ slugs: null });
    return ok({ slugs: await listShortlist(viewer.id) });
  });
}

/** Merges the device shortlist into the account on sign-in. */
export async function POST(req: Request) {
  return handle(async () => {
    const viewer = await getViewer();
    if (!viewer) return ok({ slugs: null });
    const body = await req.json().catch(() => ({}));
    const slugs = z.array(slugSchema).max(200).catch([]).parse(body?.slugs);
    return ok({ slugs: await mergeShortlist(viewer.id, slugs) });
  });
}

/** Adds or removes a single trip. */
export async function PATCH(req: Request) {
  return handle(async () => {
    const viewer = await getViewer();
    if (!viewer) return ok({ slugs: null });
    const body = await req.json().catch(() => ({}));
    const { slug, action } = z
      .object({ slug: slugSchema, action: z.enum(["add", "remove"]) })
      .parse(body);

    if (action === "add") await addToShortlist(viewer.id, slug);
    else await removeFromShortlist(viewer.id, slug);

    return ok({ slugs: await listShortlist(viewer.id) });
  });
}
