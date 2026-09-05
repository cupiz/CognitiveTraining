import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api/authorize";
import { dataResponse, errorResponse } from "@/lib/api/response";
import { getAuditLog, getAuditLogCount, type AuditAction } from "@/lib/security/audit";

/** GET /api/admin/audit — get audit log entries (admin only) */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId") ?? undefined;
    const childId = searchParams.get("childId") ?? undefined;
    const action = searchParams.get("action") as AuditAction | null;
    const limit = parseInt(searchParams.get("limit") ?? "100", 10);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);

    const entries = getAuditLog({
      accountId: accountId ?? undefined,
      childId: childId ?? undefined,
      action: action ?? undefined,
      limit,
      offset,
    });

    const total = getAuditLogCount({
      accountId: accountId ?? undefined,
      childId: childId ?? undefined,
      action: action ?? undefined,
    });

    return dataResponse({
      entries,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Audit log error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
