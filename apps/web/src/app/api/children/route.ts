import { NextRequest, NextResponse } from "next/server";
import { CreateChildRequest } from "@cog/schemas";
import { prisma } from "@cog/db";
import { requireAuth } from "@/lib/api/authorize";
import { dataResponse, errorResponse } from "@/lib/api/response";

/** POST /api/children — create a new child profile */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = CreateChildRequest.safeParse(body);

    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid request", 400,
        parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      );
    }

    const child = await prisma.childProfile.create({
      data: {
        accountId: auth.session.sub,
        displayName: parsed.data.displayName,
        birthMonth: parsed.data.birthMonth,
        birthYear: parsed.data.birthYear,
        locale: parsed.data.locale,
        accessibilityJson: parsed.data.accessibilityJson as unknown as Record<string, string>,
        status: "active",
      },
    });

    return dataResponse(
      {
        id: child.id,
        accountId: child.accountId,
        displayName: child.displayName,
        birthMonth: child.birthMonth,
        birthYear: child.birthYear,
        locale: child.locale,
        accessibilityJson: child.accessibilityJson,
        status: child.status,
        createdAt: child.createdAt.toISOString(),
        updatedAt: child.updatedAt.toISOString(),
      },
      201,
    );
  } catch (error) {
    console.error("Create child error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

/** GET /api/children — list all children for the current account */
export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const children = await prisma.childProfile.findMany({
      where: { accountId: auth.session.sub, status: { not: "deleted" } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      data: children.map((c) => ({
        id: c.id,
        accountId: c.accountId,
        displayName: c.displayName,
        birthMonth: c.birthMonth,
        birthYear: c.birthYear,
        locale: c.locale,
        accessibilityJson: c.accessibilityJson,
        status: c.status,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
      total: children.length,
      cursor: null,
      requestId: crypto.randomUUID(),
    });
  } catch (error) {
    console.error("List children error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
