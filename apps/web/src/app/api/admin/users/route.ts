import { NextRequest } from "next/server";
import { prisma } from "@cog/db";
import { requireAdmin } from "@/lib/api/authorize";
import { dataResponse, errorResponse } from "@/lib/api/response";

const ROLES = ["parent", "admin", "researcher"] as const;
const MAX_LIMIT = 100;

/** GET /api/admin/users — list accounts with search, role filter, pagination (admin only) */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() ?? "";
    const role = searchParams.get("role") ?? "";
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") ?? "25", 10) || 25, 1),
      MAX_LIMIT,
    );
    const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10) || 0, 0);

    const where: Record<string, unknown> = {};
    if (search) {
      where.email = { contains: search, mode: "insensitive" };
    }
    if ((ROLES as readonly string[]).includes(role)) {
      where.role = role;
    }

    const [accounts, total] = await Promise.all([
      prisma.account.findMany({
        where,
        select: {
          id: true,
          email: true,
          role: true,
          locale: true,
          emailVerified: true,
          createdAt: true,
          _count: { select: { children: true, sessions: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.account.count({ where }),
    ]);

    return dataResponse({ users: accounts, total, limit, offset });
  } catch (error) {
    console.error("Admin users list error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
