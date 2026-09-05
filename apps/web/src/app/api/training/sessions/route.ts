import { NextRequest } from "next/server";
import { CreateSessionRequest } from "@cog/schemas";
import { prisma } from "@cog/db";
import { authorizeChild } from "@/lib/api/authorize";
import { dataResponse, errorResponse } from "@/lib/api/response";
import { generatePlan, type GameKey, type AbilityState, type DomainPerformance, type GameExposure } from "@cog/planner";

/** POST /api/training/sessions — create a new training session with planner */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateSessionRequest.safeParse(body);

    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid request", 400,
        parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      );
    }

    const { childId } = parsed.data;
    const auth = await authorizeChild(request, childId);
    if (!auth.ok) return auth.response;

    // Check for active session
    const activeSession = await prisma.trainingSession.findFirst({
      where: {
        childId,
        status: { in: ["pending", "in_progress"] },
      },
    });

    if (activeSession) {
      return errorResponse("CONFLICT", "Child already has an active training session", 409);
    }

    // Gather data for planner
    const [adaptiveStates, domainPerformances, recentGameRuns] = await Promise.all([
      // Get adaptive states for all games
      prisma.adaptiveState.findMany({
        where: { childId },
      }),
      // Get domain performances
      prisma.domainPerformance.findMany({
        where: { childId },
        orderBy: { createdAt: "desc" },
        take: 50, // Recent performances
      }),
      // Get recent game runs for exposure calculation
      prisma.gameRun.findMany({
        where: {
          session: { childId },
          status: "completed",
        },
        include: {
          session: { select: { startedAt: true } },
        },
        orderBy: { id: "desc" },
        take: 50,
      }),
    ]);

    // Convert Prisma adaptive states to planner format
    const adaptiveStatesMap: Partial<Record<GameKey, AbilityState | null>> = {};
    for (const state of adaptiveStates) {
      adaptiveStatesMap[state.gameKey as GameKey] = {
        ability: Number(state.abilityEstimate),
        uncertainty: Number(state.uncertainty),
        difficulty: state.currentDifficulty,
        attempts: 0,
        lastUpdatedAt: state.updatedAt.toISOString(),
        algorithmVersion: state.algorithmVersion,
      };
    }

    // Convert Prisma domain performances to planner format
    const domainPerformancesList: DomainPerformance[] = domainPerformances.map((dp) => ({
      domain: dp.domain as DomainPerformance["domain"],
      score: Number(dp.score),
      confidence: Number(dp.confidence),
      sourceRunCount: dp.sourceRunCount,
    }));

    // Calculate game exposure from recent runs
    const gameExposureMap = new Map<GameKey, GameExposure>();
    const now = new Date();
    const recentCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days

    for (const run of recentGameRuns) {
      const gameKey = run.gameKey as GameKey;
      const existing = gameExposureMap.get(gameKey) ?? {
        gameKey,
        lastPlayedAt: null,
        totalPlays: 0,
        recentPlays: 0,
      };

      existing.totalPlays++;
      if (run.session.startedAt && run.session.startedAt > recentCutoff) {
        existing.recentPlays++;
      }
      if (!existing.lastPlayedAt || (run.endedAt && run.endedAt > new Date(existing.lastPlayedAt))) {
        existing.lastPlayedAt = run.endedAt?.toISOString() ?? null;
      }

      gameExposureMap.set(gameKey, existing);
    }

    // Generate plan
    const plan = generatePlan({
      childId,
      adaptiveStates: adaptiveStatesMap,
      domainPerformances: domainPerformancesList,
      gameExposures: Array.from(gameExposureMap.values()),
      constraints: {
        maxDurationSec: 900, // 15 minutes
      },
    });

    // Create session with planner output
    const session = await prisma.trainingSession.create({
      data: {
        childId,
        plannerVersion: plan.plannerVersion,
        status: "pending",
        targetDurationSec: plan.estimatedDurationSec || 900,
      },
    });

    return dataResponse(
      {
        sessionId: session.id,
        plannerVersion: session.plannerVersion,
        status: session.status,
        targetDurationSec: session.targetDurationSec,
        items: plan.items,
        estimatedDurationSec: plan.estimatedDurationSec,
        rationale: plan.rationale,
      },
      201,
    );
  } catch (error) {
    console.error("Create training session error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

/** GET /api/training/sessions — list sessions for a child (query param: childId) */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("childId");

    if (!childId) {
      return errorResponse("VALIDATION_ERROR", "childId query parameter is required", 400);
    }

    const auth = await authorizeChild(request, childId);
    if (!auth.ok) return auth.response;

    const sessions = await prisma.trainingSession.findMany({
      where: { childId },
      include: {
        gameRuns: {
          orderBy: { id: "asc" },
        },
      },
      orderBy: { id: "desc" },
    });

    return dataResponse({
      sessions: sessions.map((s) => ({
        id: s.id,
        childId: s.childId,
        plannerVersion: s.plannerVersion,
        startedAt: s.startedAt?.toISOString() ?? null,
        completedAt: s.completedAt?.toISOString() ?? null,
        status: s.status,
        targetDurationSec: s.targetDurationSec,
        gameRunCount: s.gameRuns.length,
      })),
    });
  } catch (error) {
    console.error("List training sessions error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
