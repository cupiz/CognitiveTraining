import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? "dev-secret-change-me");

export interface SessionPayload extends JWTPayload {
  sub: string; // account ID
  email: string;
  role: string;
}

/** Create a signed JWT session token */
export async function createSessionToken(payload: {
  accountId: string;
  email: string;
  role: string;
}): Promise<string> {
  return new SignJWT({
    sub: payload.accountId,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);
}

/** Verify and decode a JWT session token */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as SessionPayload;
  } catch {
    return null;
  }
}
