import { NextRequest } from "next/server";
import { prisma } from "@cog/db";
import { requireAdmin } from "@/lib/api/authorize";
import { dataResponse, errorResponse } from "@/lib/api/response";
import { logAudit } from "@/lib/security/audit";
import { GAMES } from "@/lib/games";

/** PATCH /api/admin/games/[key] — set a game's visibility (admin only) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const { key } = await params;
    if (!GAMES.some((g) => g.key === key)) {
      return errorResponse("NOT_FOUND", "Unknown game key", 404);
    }

    const body = await request.json().catch(() => null);
    const visible = typeof body?.visible === "boolean" ? body.visible : null;
    if (visible === null) {
      return errorResponse("VALIDATION_ERROR", "visible must be a boolean", 400);
    }

    const row = await prisma.gameVisibility.upsert({
      where: { gameKey: key },
      update: { visible },
      create: { gameKey: key, visible },
    });

    logAudit({
      action: "admin.game_visibility",
      accountId: auth.session.sub,
      resourceId: key,
      details: { visible: row.visible },
    });

    return dataResponse({ key, visible: row.visible });
  } catch (error) {
    console.error("Admin game visibility error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}