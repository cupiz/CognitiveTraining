import { prisma } from "@cog/db";
import { requireAdmin } from "@/lib/api/authorize";
import { dataResponse, errorResponse } from "@/lib/api/response";
import { GAMES } from "@/lib/games";

/** GET /api/admin/games — list every game with its visibility (admin only) */
export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const rows = await prisma.gameVisibility.findMany();
    const visibleByKey = new Map(rows.map((r) => [r.gameKey, r.visible]));

    const games = GAMES.map((g) => ({
      key: g.key,
      name: g.name,
      domain: g.domain,
      color: g.color,
      tint: g.tint,
      deep: g.deep,
      family: g.family,
      visible: visibleByKey.get(g.key) ?? false,
    }));

    return dataResponse({ games });
  } catch (error) {
    console.error("Admin games list error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}