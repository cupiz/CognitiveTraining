import { NextRequest } from "next/server";
import { prisma } from "@cog/db";
import { getSession } from "@/lib/auth";
import type { SessionPayload } from "@/lib/auth/jwt";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Authorize an API request: validates session + verifies the account owns the child.
 * Returns the session payload or an error response.
 */
export async function authorizeChild(
  _request: NextRequest,
  childId: string,
): Promise<
  | { ok: true; session: SessionPayload }
  | { ok: false; response: Response }
> {
  const session = await getSession();
  if (!session) {
    return {
      ok: false,
      response: Response.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" }, requestId: crypto.randomUUID() },
        { status: 401 },
      ),
    };
  }

  // Malformed ids must not reach Prisma — it throws on non-UUID input and the
  // route would answer 500 instead of a clean 404.
  if (!UUID_RE.test(childId)) {
    return {
      ok: false,
      response: Response.json(
        { error: { code: "NOT_FOUND", message: "Child not found" }, requestId: crypto.randomUUID() },
        { status: 404 },
      ),
    };
  }

  // Verify the child belongs to this account
  const child = await prisma.childProfile.findUnique({
    where: { id: childId },
    select: { accountId: true },
  });

  if (!child) {
    return {
      ok: false,
      response: Response.json(
        { error: { code: "NOT_FOUND", message: "Child not found" }, requestId: crypto.randomUUID() },
        { status: 404 },
      ),
    };
  }

  if (child.accountId !== session.sub) {
    return {
      ok: false,
      response: Response.json(
        { error: { code: "FORBIDDEN", message: "You do not have access to this child's data" }, requestId: crypto.randomUUID() },
        { status: 403 },
      ),
    };
  }

  return { ok: true, session };
}

/**
 * Authorize a request that only requires authentication (no child ownership check).
 */
export async function requireAuth(): Promise<
  | { ok: true; session: SessionPayload }
  | { ok: false; response: Response }
> {
  const session = await getSession();
  if (!session) {
    return {
      ok: false,
      response: Response.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" }, requestId: crypto.randomUUID() },
        { status: 401 },
      ),
    };
  }
  return { ok: true, session };
}

/**
 * Authorize a request that requires an admin account.
 */
export async function requireAdmin(): Promise<
  | { ok: true; session: SessionPayload }
  | { ok: false; response: Response }
> {
  const auth = await requireAuth();
  if (!auth.ok) return auth;

  if (auth.session.role !== "admin") {
    return {
      ok: false,
      response: Response.json(
        { error: { code: "FORBIDDEN", message: "Admin access required" }, requestId: crypto.randomUUID() },
        { status: 403 },
      ),
    };
  }

  return auth;
}
