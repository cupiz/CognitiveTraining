import { NextRequest } from "next/server";
import { VerifyEmailRequest } from "@cog/schemas";
import { prisma } from "@cog/db";
import { consumeToken } from "@/lib/auth";
import { dataResponse, errorResponse } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = VerifyEmailRequest.safeParse(body);

    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid request", 400,
        parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      );
    }

    const { token } = parsed.data;

    // Validate and consume the token
    const result = await consumeToken(token, "email_verification");
    if (!result) {
      return errorResponse("UNAUTHORIZED", "Invalid or expired verification token", 401);
    }

    // Mark email as verified
    await prisma.account.update({
      where: { id: result.accountId },
      data: { emailVerified: new Date() },
    });

    return dataResponse(true);
  } catch (error) {
    console.error("Email verification error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
