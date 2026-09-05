import { NextRequest } from "next/server";
import { PasswordResetRequest } from "@cog/schemas";
import { prisma } from "@cog/db";
import { createPasswordResetToken } from "@/lib/auth";
import { sendEmail, getPasswordResetEmailHtml, getAuthBaseUrl } from "@/lib/auth/email";
import { dataResponse, errorResponse } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = PasswordResetRequest.safeParse(body);

    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid request", 400,
        parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      );
    }

    const { email } = parsed.data;

    // Always return success to prevent email enumeration
    const account = await prisma.account.findUnique({ where: { email } });

    if (account) {
      const token = await createPasswordResetToken(account.id);
      const baseUrl = getAuthBaseUrl();

      // Send password reset email
      await sendEmail({
        to: email,
        subject: "Reset Your Password - Cognitive Training Platform",
        html: getPasswordResetEmailHtml(token, baseUrl),
        text: `Reset your password: ${baseUrl}/api/auth/password-reset/confirm?token=${encodeURIComponent(token)}`,
      });
    }

    return dataResponse(true);
  } catch (error) {
    console.error("Password reset error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
