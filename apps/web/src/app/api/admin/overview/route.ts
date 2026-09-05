import { prisma } from "@cog/db";
import { requireAdmin } from "@/lib/api/authorize";
import { dataResponse, errorResponse } from "@/lib/api/response";

/** GET /api/admin/overview — platform-wide stats for the admin hub (admin only) */
export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalAccounts,
      accountsByRole,
      newAccounts7d,
      totalChildren,
      activeChildren,
      totalAssessments,
      completedAssessments,
      totalTrainingSessions,
      completedTrainingSessions,
      totalGameRuns,
      completedGameRuns,
      totalRawEvents,
      visibleGames,
    ] = await Promise.all([
      prisma.account.count(),
      prisma.account.groupBy({ by: ["role"], _count: { _all: true } }),
      prisma.account.count({ where: { createdAt: { gte: since7d } } }),
      prisma.childProfile.count(),
      prisma.childProfile.count({ where: { status: "active" } }),
      prisma.assessment.count(),
      prisma.assessment.count({ where: { status: "completed" } }),
      prisma.trainingSession.count(),
      prisma.trainingSession.count({ where: { status: "completed" } }),
      prisma.gameRun.count(),
      prisma.gameRun.count({ where: { status: "completed" } }),
      prisma.rawEvent.count(),
      prisma.gameVisibility.count({ where: { visible: true } }),
    ]);

    const roles: Record<string, number> = {};
    for (const row of accountsByRole) roles[row.role] = row._count._all;

    return dataResponse({
      accounts: {
        total: totalAccounts,
        byRole: roles,
        newLast7d: newAccounts7d,
      },
      children: { total: totalChildren, active: activeChildren },
      assessments: { total: totalAssessments, completed: completedAssessments },
      trainingSessions: {
        total: totalTrainingSessions,
        completed: completedTrainingSessions,
      },
      gameRuns: { total: totalGameRuns, completed: completedGameRuns },
      telemetry: { rawEvents: totalRawEvents },
      games: { visible: visibleGames },
    });
  } catch (error) {
    console.error("Admin overview error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
