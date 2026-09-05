import { NextRequest } from "next/server";
import { PasswordResetConfirmRequest } from "@cog/schemas";
import { prisma } from "@cog/db";
import { hashPassword, consumeToken, deleteAllSessions } from "@/lib/auth";
import { dataResponse, errorResponse } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = PasswordResetConfirmRequest.safeParse(body);

    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid request", 400,
        parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      );
    }

    const { token, password } = parsed.data;

    // Validate and consume the token
    const result = await consumeToken(token, "password_reset");
    if (!result) {
      return errorResponse("UNAUTHORIZED", "Invalid or expired reset token", 401);
    }

    // Update password
    const passwordHash = await hashPassword(password);
    await prisma.account.update({
      where: { id: result.accountId },
      data: { passwordHash },
    });

    // Invalidate all existing sessions
    await deleteAllSessions(result.accountId);

    return dataResponse(true);
  } catch (error) {
    console.error("Password reset confirm error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
