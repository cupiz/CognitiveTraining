import { NextRequest } from "next/server";
import { prisma } from "@cog/db";
import { requireAuth } from "@/lib/api/authorize";
import { dataResponse, errorResponse } from "@/lib/api/response";

/** POST /api/game-runs/[id]/start — mark game run as started */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const gameRun = await prisma.gameRun.findUnique({
      where: { id },
      select: {
        status: true,
        sessionId: true,
        session: { select: { child: { select: { accountId: true } } } },
      },
    });

    if (!gameRun) {
      return errorResponse("NOT_FOUND", "Game run not found", 404);
    }

    if (gameRun.session.child.accountId !== auth.session.sub) {
      return errorResponse("FORBIDDEN", "Not authorized", 403);
    }

    if (gameRun.status !== "pending") {
      return errorResponse("CONFLICT", `Cannot start game run in "${gameRun.status}" status`, 409);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const gr = await tx.gameRun.update({
        where: { id },
        data: {
          status: "in_progress",
          startedAt: new Date(),
        },
      });

      // Also update the parent training session to in_progress if it's pending
      await tx.trainingSession.updateMany({
        where: {
          id: gameRun.sessionId,
          status: "pending",
        },
        data: {
          status: "in_progress",
          startedAt: new Date(),
        },
      });

      return gr;
    });

    return dataResponse({
      id: updated.id,
      sessionId: updated.sessionId,
      gameKey: updated.gameKey,
      gameVersion: updated.gameVersion,
      configurationJson: updated.configurationJson,
      startedAt: updated.startedAt?.toISOString() ?? null,
      endedAt: updated.endedAt?.toISOString() ?? null,
      status: updated.status,
    });
  } catch (error) {
    console.error("Start game run error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
