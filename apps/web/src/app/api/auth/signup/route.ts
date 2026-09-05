import { NextRequest } from "next/server";
import { SignupRequest } from "@cog/schemas";
import { prisma } from "@cog/db";
import { hashPassword, createSession } from "@/lib/auth";
import { dataResponse, errorResponse } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = SignupRequest.safeParse(body);

    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid request", 400, 
        parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      );
    }

    const { email, password } = parsed.data;

    // Check if email already exists
    const existing = await prisma.account.findUnique({ where: { email } });
    if (existing) {
      return errorResponse("CONFLICT", "An account with this email already exists", 409);
    }

    // Create account
    const passwordHash = await hashPassword(password);
    const account = await prisma.account.create({
      data: {
        email,
        passwordHash,
        role: "parent",
      },
    });

    // Create session
    await createSession({
      id: account.id,
      email: account.email,
      role: account.role,
    });

    return dataResponse(
      {
        id: account.id,
        email: account.email,
        role: account.role,
        locale: account.locale,
        createdAt: account.createdAt.toISOString(),
        updatedAt: account.updatedAt.toISOString(),
      },
      201,
    );
  } catch (error) {
    console.error("Signup error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
