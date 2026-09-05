import { NextRequest } from "next/server";
import { prisma } from "@cog/db";
import { requireAdmin } from "@/lib/api/authorize";
import { dataResponse, errorResponse } from "@/lib/api/response";

const STATUSES = ["active", "archived", "deleted"] as const;
const MAX_LIMIT = 100;

/** GET /api/admin/children — list all child profiles with search & status filter (admin only) */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() ?? "";
    const status = searchParams.get("status") ?? "";
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") ?? "25", 10) || 25, 1),
      MAX_LIMIT,
    );
    const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10) || 0, 0);

    const where: Record<string, unknown> = {};
    if (search) {
      where.displayName = { contains: search, mode: "insensitive" };
    }
    if ((STATUSES as readonly string[]).includes(status)) {
      where.status = status;
    }

    const [children, total] = await Promise.all([
      prisma.childProfile.findMany({
        where,
        select: {
          id: true,
          displayName: true,
          birthMonth: true,
          birthYear: true,
          status: true,
          locale: true,
          createdAt: true,
          account: { select: { id: true, email: true } },
          _count: { select: { assessments: true, trainingSessions: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.childProfile.count({ where }),
    ]);

    return dataResponse({ children, total, limit, offset });
  } catch (error) {
    console.error("Admin children list error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
