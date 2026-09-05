import { nanoid } from "nanoid";
import { prisma } from "@cog/db";

const TOKEN_EXPIRY_MS = 60 * 60 * 24 * 1000; // 24 hours

/** Create an email verification token */
export async function createEmailVerificationToken(accountId: string): Promise<string> {
  const token = nanoid(32);

  await prisma.verificationToken.create({
    data: {
      accountId,
      token,
      type: "email_verification",
      expiresAt: new Date(Date.now() + TOKEN_EXPIRY_MS),
    },
  });

  return token;
}

/** Create a password reset token */
export async function createPasswordResetToken(accountId: string): Promise<string> {
  // Invalidate any existing reset tokens for this account
  await prisma.verificationToken.deleteMany({
    where: {
      accountId,
      type: "password_reset",
      usedAt: null,
    },
  });

  const token = nanoid(32);

  await prisma.verificationToken.create({
    data: {
      accountId,
      token,
      type: "password_reset",
      expiresAt: new Date(Date.now() + TOKEN_EXPIRY_MS),
    },
  });

  return token;
}

/** Validate and consume a verification token */
export async function consumeToken(
  token: string,
  type: "email_verification" | "password_reset",
): Promise<{ accountId: string } | null> {
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!record) return null;
  if (record.type !== type) return null;
  if (record.usedAt !== null) return null;
  if (record.expiresAt < new Date()) return null;

  // Mark as used
  await prisma.verificationToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return { accountId: record.accountId };
}
