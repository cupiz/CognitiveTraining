import { NextRequest } from "next/server";
import { prisma } from "@cog/db";
import { requireAuth } from "@/lib/api/authorize";
import { dataResponse, errorResponse } from "@/lib/api/response";

/** Helper to verify game run ownership */
async function verifyGameRunOwnership(gameRunId: string, accountId: string) {
  const gameRun = await prisma.gameRun.findUnique({
    where: { id: gameRunId },
    select: {
      id: true,
      sessionId: true,
      gameKey: true,
      gameVersion: true,
      status: true,
      configurationJson: true,
      startedAt: true,
      endedAt: true,
      session: {
        select: { child: { select: { accountId: true } } },
      },
    },
  });

  if (!gameRun) {
    return { ok: false as const, error: errorResponse("NOT_FOUND", "Game run not found", 404) };
  }

  if (gameRun.session.child.accountId !== accountId) {
    return { ok: false as const, error: errorResponse("FORBIDDEN", "Not authorized", 403) };
  }

  return { ok: true as const, gameRun };
}

/** GET /api/game-runs/[id] — get a single game run */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const result = await verifyGameRunOwnership(id, auth.session.sub);
    if (!result.ok) return result.error;

    return dataResponse({
      id: result.gameRun.id,
      sessionId: result.gameRun.sessionId,
      gameKey: result.gameRun.gameKey,
      gameVersion: result.gameRun.gameVersion,
      configurationJson: result.gameRun.configurationJson,
      startedAt: result.gameRun.startedAt?.toISOString() ?? null,
      endedAt: result.gameRun.endedAt?.toISOString() ?? null,
      status: result.gameRun.status,
    });
  } catch (error) {
    console.error("Get game run error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
