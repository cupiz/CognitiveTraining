import { getSession } from "@/lib/auth";
import { prisma } from "@cog/db";
import { dataResponse, errorResponse } from "@/lib/api/response";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Not authenticated", 401);
    }

    const account = await prisma.account.findUnique({
      where: { id: session.sub },
      select: {
        id: true,
        email: true,
        role: true,
        locale: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!account) {
      return errorResponse("NOT_FOUND", "Account not found", 404);
    }

    return dataResponse({
      ...account,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
      emailVerified: account.emailVerified?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("Get session error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
