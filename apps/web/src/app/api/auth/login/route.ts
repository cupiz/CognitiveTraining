import { NextRequest } from "next/server";
import { LoginRequest } from "@cog/schemas";
import { prisma } from "@cog/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { dataResponse, errorResponse } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = LoginRequest.safeParse(body);

    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid request", 400,
        parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      );
    }

    const { email, password } = parsed.data;

    // Find account
    const account = await prisma.account.findUnique({ where: { email } });
    if (!account) {
      return errorResponse("UNAUTHORIZED", "Invalid email or password", 401);
    }

    // Verify password
    const valid = await verifyPassword(password, account.passwordHash);
    if (!valid) {
      return errorResponse("UNAUTHORIZED", "Invalid email or password", 401);
    }

    // Create session
    await createSession({
      id: account.id,
      email: account.email,
      role: account.role,
    });

    return dataResponse({
      id: account.id,
      email: account.email,
      role: account.role,
      locale: account.locale,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
