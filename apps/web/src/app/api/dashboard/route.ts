import { prisma } from "@cog/db";
import { requireAuth } from "@/lib/api/authorize";
import { dataResponse, errorResponse } from "@/lib/api/response";

/** GET /api/dashboard — get dashboard overview data for authenticated user */
export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const accountId = auth.session.sub;

    // Get all children for this account
    const children = await prisma.childProfile.findMany({
      where: { accountId },
      select: {
        id: true,
        displayName: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            assessments: true,
            trainingSessions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get total assessments and sessions
    const totalAssessments = children.reduce((sum, c) => sum + c._count.assessments, 0);
    const totalSessions = children.reduce((sum, c) => sum + c._count.trainingSessions, 0);

    // Get recent sessions across all children
    const recentSessions = await prisma.trainingSession.findMany({
      where: {
        childId: { in: children.map((c) => c.id) },
      },
      include: {
        gameRuns: {
          select: { gameKey: true, status: true },
        },
      },
      orderBy: { id: "desc" },
      take: 10,
    });

    // Get adaptive states summary
    const adaptiveStates = await prisma.adaptiveState.findMany({
      where: {
        childId: { in: children.map((c) => c.id) },
      },
      select: {
        childId: true,
        gameKey: true,
        abilityEstimate: true,
        uncertainty: true,
        currentDifficulty: true,
      },
    });

    return dataResponse({
      children: children.map((c) => ({
        id: c.id,
        displayName: c.displayName,
        status: c.status,
        createdAt: c.createdAt.toISOString(),
        assessmentCount: c._count.assessments,
        sessionCount: c._count.trainingSessions,
      })),
      stats: {
        totalChildren: children.length,
        totalAssessments,
        totalSessions,
      },
      recentSessions: recentSessions.map((s) => ({
        id: s.id,
        status: s.status,
        startedAt: s.startedAt?.toISOString() ?? null,
        completedAt: s.completedAt?.toISOString() ?? null,
        gameCount: s.gameRuns.length,
      })),
      adaptiveStates: adaptiveStates.map((as) => ({
        childId: as.childId,
        gameKey: as.gameKey,
        ability: Number(as.abilityEstimate),
        uncertainty: Number(as.uncertainty),
        difficulty: as.currentDifficulty,
      })),
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
