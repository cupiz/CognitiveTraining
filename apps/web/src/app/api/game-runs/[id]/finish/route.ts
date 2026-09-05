import { NextRequest } from "next/server";
import { prisma } from "@cog/db";
import { computeMetrics, checkSessionQuality } from "@cog/scoring";
import { processGameRun, type GameKey } from "@cog/adaptive";
import { requireAuth } from "@/lib/api/authorize";
import { dataResponse, errorResponse } from "@/lib/api/response";

/** PATCH /api/game-runs/[id]/finish — mark game run as completed/interrupted, compute metrics, and update adaptive state */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const gameRun = await prisma.gameRun.findUnique({
      where: { id },
      select: {
        id: true,
        sessionId: true,
        gameKey: true,
        gameVersion: true,
        status: true,
        configurationJson: true,
        startedAt: true,
        endedAt: true,
        session: { select: { child: { select: { accountId: true, id: true } } } },
      },
    });

    if (!gameRun) {
      return errorResponse("NOT_FOUND", "Game run not found", 404);
    }

    if (gameRun.session.child.accountId !== auth.session.sub) {
      return errorResponse("FORBIDDEN", "Not authorized", 403);
    }

    if (gameRun.status !== "in_progress") {
      return errorResponse("CONFLICT", `Cannot finish game run in "${gameRun.status}" status`, 409);
    }

    const body = await request.json();
    const { status } = body as { status?: string };

    if (!status || !["completed", "interrupted"].includes(status)) {
      return errorResponse("VALIDATION_ERROR", "Status must be 'completed' or 'interrupted'", 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const gr = await tx.gameRun.update({
        where: { id },
        data: {
          status: status as "completed" | "interrupted",
          endedAt: new Date(),
        },
      });

      let adaptiveResult = null;

      // If completed, compute task metrics and update adaptive state
      if (status === "completed") {
        const rawEvents = await tx.rawEvent.findMany({
          where: { gameRunId: id },
          orderBy: { sequenceNo: "asc" },
        });

        if (rawEvents.length > 0) {
          const sessionFlags = checkSessionQuality(
            rawEvents.map((e) => ({
              sequenceNo: e.sequenceNo,
              eventType: e.eventType,
              clientTimeMs: e.clientTimeMs,
              payload: e.payloadJson as Record<string, unknown>,
            }))
          );

          const config = gameRun.configurationJson as Record<string, unknown>;
          const difficulty = (config.difficulty as number) ?? 5;

          const metrics = computeMetrics(
            rawEvents.map((e) => ({
              sequenceNo: e.sequenceNo,
              eventType: e.eventType,
              clientTimeMs: e.clientTimeMs,
              payload: e.payloadJson as Record<string, unknown>,
            })),
            difficulty
          );

          const allFlags = [...metrics.qualityFlags, ...sessionFlags];

          await tx.taskMetric.create({
            data: {
              gameRunId: id,
              metricVersion: "1.0.0",
              accuracy: metrics.accuracy,
              medianRtMs: metrics.medianRtMs,
              meanRtMs: metrics.meanRtMs,
              rtVariability: metrics.rtVariability,
              omissionErrors: metrics.omissionErrors,
              commissionErrors: metrics.commissionErrors,
              difficulty,
              validTrialCount: metrics.validTrialCount,
              qualityFlagsJson: JSON.parse(JSON.stringify({ flags: allFlags })),
            },
          });

          // ── Adaptive Engine ─────────────────────────────
          const childId = gameRun.session.child.id;
          const gameKey = gameRun.gameKey as GameKey;

          // Get or create adaptive state
          let adaptiveState = await tx.adaptiveState.findUnique({
            where: { childId_gameKey: { childId, gameKey } },
          });

          // Convert Prisma state to engine format
          const currentState = adaptiveState
            ? {
                ability: Number(adaptiveState.abilityEstimate),
                uncertainty: Number(adaptiveState.uncertainty),
                difficulty: adaptiveState.currentDifficulty,
                attempts: 0, // Will be tracked from task metrics
                lastUpdatedAt: adaptiveState.updatedAt.toISOString(),
                algorithmVersion: adaptiveState.algorithmVersion,
              }
            : null;

          // Process through adaptive engine
          adaptiveResult = processGameRun(
            currentState,
            {
              accuracy: metrics.accuracy,
              medianRtMs: metrics.medianRtMs,
              meanRtMs: metrics.meanRtMs,
              rtVariability: metrics.rtVariability,
              omissionErrors: metrics.omissionErrors,
              commissionErrors: metrics.commissionErrors,
              validTrialCount: metrics.validTrialCount,
              qualityFlags: allFlags,
            },
            gameKey
          );

          // Persist updated adaptive state
          const newState = adaptiveResult.state;
          await tx.adaptiveState.upsert({
            where: { childId_gameKey: { childId, gameKey } },
            create: {
              childId,
              gameKey,
              abilityEstimate: newState.ability,
              uncertainty: newState.uncertainty,
              currentDifficulty: Math.round(newState.difficulty),
              algorithmVersion: newState.algorithmVersion,
            },
            update: {
              abilityEstimate: newState.ability,
              uncertainty: newState.uncertainty,
              currentDifficulty: Math.round(newState.difficulty),
              algorithmVersion: newState.algorithmVersion,
            },
          });
        }
      }

      return { gr, adaptiveResult };
    });

    return dataResponse({
      id: updated.gr.id,
      sessionId: updated.gr.sessionId,
      gameKey: updated.gr.gameKey,
      gameVersion: updated.gr.gameVersion,
      configurationJson: updated.gr.configurationJson,
      startedAt: updated.gr.startedAt?.toISOString() ?? null,
      endedAt: updated.gr.endedAt?.toISOString() ?? null,
      status: updated.gr.status,
      adaptive: updated.adaptiveResult
        ? {
            ability: updated.adaptiveResult.state.ability,
            uncertainty: updated.adaptiveResult.state.uncertainty,
            difficulty: updated.adaptiveResult.recommendation.difficulty,
            changed: updated.adaptiveResult.recommendation.changed,
            rationale: updated.adaptiveResult.recommendation.rationale,
          }
        : null,
    });
  } catch (error) {
    console.error("Finish game run error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
