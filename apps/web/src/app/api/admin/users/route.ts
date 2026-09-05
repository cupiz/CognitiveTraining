import { NextRequest } from "next/server";
import { SignupRequest } from "@cog/schemas";
import { prisma } from "@cog/db";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/api/authorize";
import { dataResponse, errorResponse } from "@/lib/api/response";
import { logAudit } from "@/lib/security/audit";

const ROLES = ["parent", "admin", "researcher"] as const;
const MAX_LIMIT = 100;

/** POST /api/admin/users — create an account with a chosen role (admin only) */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => null);
    const credentials = SignupRequest.safeParse({
      email: body?.email,
      password: body?.password,
    });
    const role = body?.role;
    if (!credentials.success || !(ROLES as readonly string[]).includes(role)) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Email valid, sandi min. 8 karakter, dan role (parent/admin/researcher) wajib diisi",
        400,
      );
    }

    const { email, password } = credentials.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.account.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (existing) {
      return errorResponse("CONFLICT", "Email sudah terdaftar", 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const created = await prisma.account.create({
      data: { email: normalizedEmail, passwordHash, role },
      select: { id: true, email: true, role: true },
    });

    logAudit({
      action: "admin.user_create",
      accountId: auth.session.sub,
      resourceId: created.id,
      details: { createdEmail: created.email, role: created.role },
    });

    return dataResponse(created);
  } catch (error) {
    console.error("Admin user create error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

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
