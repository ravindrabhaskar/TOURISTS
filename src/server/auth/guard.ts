import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { readSession } from "./session";
import { can, type Permission, type Role } from "./rbac";
import { errors } from "@/lib/http";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

/** Authenticated user for API routes. Verifies tokenVersion (logout-all). */
export async function currentUser(): Promise<CurrentUser | null> {
  const session = await readSession();
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: { id: true, email: true, name: true, role: true, isActive: true, tokenVersion: true },
  });
  if (!user || !user.isActive || user.tokenVersion !== session.tv) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await currentUser();
  if (!user) throw errors.unauthorized();
  return user;
}

export async function requirePermission(permission: Permission): Promise<CurrentUser> {
  const user = await requireUser();
  if (!can(user.role, permission)) throw errors.forbidden();
  return user;
}

/**
 * For signed-in server components. Middleware already gates these routes, but
 * the page body still runs before the redirect lands — so redirect here too
 * rather than asserting non-null and throwing on every signed-out request.
 */
export async function requireViewer(): Promise<CurrentUser> {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");
  return viewer;
}

/** For server components / layouts — returns null instead of throwing. */
export async function getViewer(): Promise<CurrentUser | null> {
  try {
    return await currentUser();
  } catch {
    return null;
  }
}
