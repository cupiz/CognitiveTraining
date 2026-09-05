import { NextRequest } from "next/server";
import { CreateGameRunRequest } from "@cog/schemas";
import { prisma } from "@cog/db";
import { requireAuth } from "@/lib/api/authorize";
import { dataResponse, errorResponse } from "@/lib/api/response";

/** POST /api/game-runs — create a new game run within a training session */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = CreateGameRunRequest.safeParse(body);

    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid request", 400,
        parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      );
    }

    const { sessionId, gameKey, gameVersion, configuration } = parsed.data;

    // Verify session exists and belongs to this user
    const session = await prisma.trainingSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        child: { select: { accountId: true } },
        status: true,
      },
    });

    if (!session) {
      return errorResponse("NOT_FOUND", "Training session not found", 404);
    }

    if (session.child.accountId !== auth.session.sub) {
      return errorResponse("FORBIDDEN", "Not authorized", 403);
    }

    if (session.status === "completed" || session.status === "abandoned") {
      return errorResponse("CONFLICT", "Cannot create game run for completed/abandoned session", 409);
    }

    // Create game run
    const gameRun = await prisma.gameRun.create({
      data: {
        sessionId,
        gameKey,
        gameVersion,
        configurationJson: configuration,
        status: "pending",
      },
    });

    return dataResponse(
      {
        id: gameRun.id,
        sessionId: gameRun.sessionId,
        gameKey: gameRun.gameKey,
        gameVersion: gameRun.gameVersion,
        configurationJson: gameRun.configurationJson,
        startedAt: gameRun.startedAt?.toISOString() ?? null,
        endedAt: gameRun.endedAt?.toISOString() ?? null,
        status: gameRun.status,
      },
      201,
    );
  } catch (error) {
    console.error("Create game run error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

/** GET /api/game-runs — list game runs for a session (query param: sessionId) */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return errorResponse("VALIDATION_ERROR", "sessionId query parameter is required", 400);
    }

    // Verify session belongs to user
    const session = await prisma.trainingSession.findUnique({
      where: { id: sessionId },
      select: { child: { select: { accountId: true } } },
    });

    if (!session || session.child.accountId !== auth.session.sub) {
      return errorResponse("FORBIDDEN", "Not authorized", 403);
    }

    const gameRuns = await prisma.gameRun.findMany({
      where: { sessionId },
      orderBy: { id: "asc" },
    });

    return dataResponse({
      gameRuns: gameRuns.map((gr) => ({
        id: gr.id,
        sessionId: gr.sessionId,
        gameKey: gr.gameKey,
        gameVersion: gr.gameVersion,
        configurationJson: gr.configurationJson,
        startedAt: gr.startedAt?.toISOString() ?? null,
        endedAt: gr.endedAt?.toISOString() ?? null,
        status: gr.status,
      })),
    });
  } catch (error) {
    console.error("List game runs error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
