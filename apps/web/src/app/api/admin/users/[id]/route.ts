import { NextRequest } from "next/server";
import { prisma } from "@cog/db";
import { requireAdmin } from "@/lib/api/authorize";
import { dataResponse, errorResponse } from "@/lib/api/response";
import { logAudit } from "@/lib/security/audit";

const ROLES = ["parent", "admin", "researcher"] as const;

/** PATCH /api/admin/users/[id] — change an account's role (admin only) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const body = await request.json().catch(() => null);
    const role = body?.role;
    if (!(ROLES as readonly string[]).includes(role)) {
      return errorResponse(
        "VALIDATION_ERROR",
        "role harus salah satu dari: parent, admin, researcher",
        400,
      );
    }

    // Lockout guard: an admin cannot change their own role.
    if (id === auth.session.sub) {
      return errorResponse(
        "FORBIDDEN",
        "Tidak bisa mengubah role akun sendiri. Gunakan akun admin lain.",
        403,
      );
    }

    const account = await prisma.account.findUnique({ where: { id }, select: { id: true } });
    if (!account) {
      return errorResponse("NOT_FOUND", "Akun tidak ditemukan", 404);
    }

    const updated = await prisma.account.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, role: true },
    });

    logAudit({
      action: "admin.user_role_change",
      accountId: auth.session.sub,
      resourceId: id,
      details: { targetEmail: updated.email, newRole: role },
    });

    return dataResponse(updated);
  } catch (error) {
    console.error("Admin user role change error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

/** DELETE /api/admin/users/[id] — delete an account and all its data (admin only) */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const { id } = await params;

    // Lockout guard: an admin cannot delete their own account.
    if (id === auth.session.sub) {
      return errorResponse(
        "FORBIDDEN",
        "Tidak bisa menghapus akun sendiri. Gunakan akun admin lain.",
        403,
      );
    }

    const account = await prisma.account.findUnique({
      where: { id },
      select: { id: true, email: true },
    });
    if (!account) {
      return errorResponse("NOT_FOUND", "Akun tidak ditemukan", 404);
    }

    await prisma.account.delete({ where: { id } });

    logAudit({
      action: "admin.user_delete",
      accountId: auth.session.sub,
      resourceId: id,
      details: { deletedEmail: account.email },
    });

    return dataResponse({ deleted: true, id, email: account.email });
  } catch (error) {
    console.error("Admin user delete error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
