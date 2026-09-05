import { prisma } from "@cog/db";
import { dataResponse, errorResponse } from "@/lib/api/response";
import { GAMES } from "@/lib/games";

/**
 * GET /api/games/visibility — visibility map per game (public).
 * Only per-game booleans — no child/parent data — so the public landing
 * page can filter which games it showcases.
 */
export async function GET() {
  try {
    const rows = await prisma.gameVisibility.findMany();
    const visibleByKey = new Map(rows.map((r) => [r.gameKey, r.visible]));

    const visibility: Record<string, boolean> = {};
    for (const g of GAMES) {
      visibility[g.key] = visibleByKey.get(g.key) ?? false;
    }

    return dataResponse(visibility);
  } catch (error) {
    console.error("Games visibility error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}