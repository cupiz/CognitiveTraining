import { NextRequest } from "next/server";
import { prisma } from "@cog/db";
import { authorizeChild } from "@/lib/api/authorize";
import { dataResponse, errorResponse } from "@/lib/api/response";

/** GET /api/dashboard/[childId] — get detailed dashboard data for a specific child */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> },
) {
  try {
    const { childId } = await params;
    const auth = await authorizeChild(request, childId);
    if (!auth.ok) return auth.response;

    // Get child info
    const child = await prisma.childProfile.findUnique({
      where: { id: childId },
      select: {
        id: true,
        displayName: true,
        birthMonth: true,
        birthYear: true,
        status: true,
        createdAt: true,
      },
    });

    if (!child) {
      return errorResponse("NOT_FOUND", "Child not found", 404);
    }

    // Get adaptive states
    const adaptiveStates = await prisma.adaptiveState.findMany({
      where: { childId },
      select: {
        gameKey: true,
        abilityEstimate: true,
        uncertainty: true,
        currentDifficulty: true,
        algorithmVersion: true,
        updatedAt: true,
      },
    });

    // Get domain performances
    const domainPerformances = await prisma.domainPerformance.findMany({
      where: { childId },
      orderBy: { id: "desc" },
      take: 50,
      select: {
        domain: true,
        score: true,
        confidence: true,
        windowStart: true,
        windowEnd: true,
        sourceRunCount: true,
      },
    });

    // Get session history
    const sessions = await prisma.trainingSession.findMany({
      where: { childId },
      include: {
        gameRuns: {
          select: {
            id: true,
            gameKey: true,
            status: true,
            startedAt: true,
            endedAt: true,
          },
        },
      },
      orderBy: { id: "desc" },
      take: 20,
    });

    // Get game run statistics
    const gameRunStats = await prisma.gameRun.groupBy({
      by: ["gameKey", "status"],
      where: {
        session: { childId },
      },
      _count: true,
    });

    // Get assessment history
    const assessments = await prisma.assessment.findMany({
      where: { childId },
      orderBy: { id: "desc" },
      take: 10,
      select: {
        id: true,
        status: true,
        assessmentVersion: true,
        startedAt: true,
        completedAt: true,
      },
    });

    // Calculate age
    const now = new Date();
    const ageYears = now.getFullYear() - child.birthYear;
    const ageMonths = now.getMonth() - child.birthMonth;
    const age = ageYears + (ageMonths < 0 ? -1 : 0);

    return dataResponse({
      child: {
        id: child.id,
        displayName: child.displayName,
        age,
        status: child.status,
        createdAt: child.createdAt.toISOString(),
      },
      adaptiveStates: adaptiveStates.map((as) => ({
        gameKey: as.gameKey,
        ability: Number(as.abilityEstimate),
        uncertainty: Number(as.uncertainty),
        difficulty: as.currentDifficulty,
        algorithmVersion: as.algorithmVersion,
        updatedAt: as.updatedAt.toISOString(),
      })),
      domainPerformances: domainPerformances.map((dp) => ({
        domain: dp.domain,
        score: Number(dp.score),
        confidence: Number(dp.confidence),
        windowStart: dp.windowStart.toISOString(),
        windowEnd: dp.windowEnd.toISOString(),
        sourceRunCount: dp.sourceRunCount,
      })),
      sessions: sessions.map((s) => ({
        id: s.id,
        status: s.status,
        plannerVersion: s.plannerVersion,
        startedAt: s.startedAt?.toISOString() ?? null,
        completedAt: s.completedAt?.toISOString() ?? null,
        targetDurationSec: s.targetDurationSec,
        gameRuns: s.gameRuns.map((gr) => ({
          id: gr.id,
          gameKey: gr.gameKey,
          status: gr.status,
          startedAt: gr.startedAt?.toISOString() ?? null,
          endedAt: gr.endedAt?.toISOString() ?? null,
        })),
      })),
      gameRunStats: gameRunStats.map((grs) => ({
        gameKey: grs.gameKey,
        status: grs.status,
        count: grs._count,
      })),
      assessments: assessments.map((a) => ({
        id: a.id,
        status: a.status,
        assessmentVersion: a.assessmentVersion,
        startedAt: a.startedAt?.toISOString() ?? null,
        completedAt: a.completedAt?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    console.error("Child dashboard error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
