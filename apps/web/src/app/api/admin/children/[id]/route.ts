import { NextRequest } from "next/server";
import { prisma } from "@cog/db";
import { requireAdmin } from "@/lib/api/authorize";
import { dataResponse, errorResponse } from "@/lib/api/response";
import { logAudit } from "@/lib/security/audit";

const STATUSES = ["active", "archived"] as const;

/** PATCH /api/admin/children/[id] — change a child profile's status (admin only) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const body = await request.json().catch(() => null);
    const status = body?.status;
    if (!(STATUSES as readonly string[]).includes(status)) {
      return errorResponse(
        "VALIDATION_ERROR",
        "status harus 'active' atau 'archived' (deleted hanya lewat alur penghapusan data)",
        400,
      );
    }

    const child = await prisma.childProfile.findUnique({
      where: { id },
      select: { id: true, displayName: true },
    });
    if (!child) {
      return errorResponse("NOT_FOUND", "Profil anak tidak ditemukan", 404);
    }

    const updated = await prisma.childProfile.update({
      where: { id },
      data: { status },
      select: { id: true, displayName: true, status: true },
    });

    logAudit({
      action: "admin.child_status",
      accountId: auth.session.sub,
      childId: id,
      details: { displayName: updated.displayName, newStatus: status },
    });

    return dataResponse(updated);
  } catch (error) {
    console.error("Admin child status error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
