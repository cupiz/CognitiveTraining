import { cookies } from "next/headers";
import { prisma } from "@cog/db";
import { createSessionToken, verifySessionToken, type SessionPayload } from "./jwt";

const SESSION_COOKIE = "cog_session";
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours in seconds

/** Create a new session and set the cookie */
export async function createSession(account: {
  id: string;
  email: string;
  role: string;
}): Promise<string> {
  const token = await createSessionToken({
    accountId: account.id,
    email: account.email,
    role: account.role,
  });

  // Store session in DB
  await prisma.session.create({
    data: {
      accountId: account.id,
      token,
      expiresAt: new Date(Date.now() + SESSION_MAX_AGE * 1000),
    },
  });

  // Set cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  return token;
}

/** Get the current session from the cookie */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  // Verify JWT
  const payload = await verifySessionToken(token);
  if (!payload) return null;

  // Check if session exists in DB and is not expired
  const session = await prisma.session.findUnique({
    where: { token },
  });
  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return payload;
}

/** Get the current session or throw if not authenticated */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

/** Delete the current session (logout) */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    // Delete from DB
    await prisma.session.deleteMany({ where: { token } });

    // Clear cookie
    cookieStore.delete(SESSION_COOKIE);
  }
}

/** Delete all sessions for an account (e.g. on password change) */
export async function deleteAllSessions(accountId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { accountId } });
}
