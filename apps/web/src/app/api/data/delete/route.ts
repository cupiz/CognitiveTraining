import { NextRequest } from "next/server";
import { prisma } from "@cog/db";
import { requireAuth } from "@/lib/api/authorize";
import { dataResponse, errorResponse } from "@/lib/api/response";
import { logAudit } from "@/lib/security/audit";

/** POST /api/data/delete — delete all data for a specific child */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const accountId = auth.session.sub;
    const body = await request.json();
    const { childId, confirmDelete } = body as {
      childId?: string;
      confirmDelete?: boolean;
    };

    if (!childId) {
      return errorResponse("VALIDATION_ERROR", "childId is required", 400);
    }

    if (!confirmDelete) {
      return errorResponse("VALIDATION_ERROR", "confirmDelete must be true", 400);
    }

    // Verify child belongs to this account
    const child = await prisma.childProfile.findUnique({
      where: { id: childId },
      select: { accountId: true, displayName: true },
    });

    if (!child) {
      return errorResponse("NOT_FOUND", "Child not found", 404);
    }

    if (child.accountId !== accountId) {
      return errorResponse("FORBIDDEN", "You do not have access to this child's data", 403);
    }

    // Delete all child data in order (respecting foreign keys)
    await prisma.$transaction(async (tx) => {
      // Get all game runs for this child's sessions
      const sessions = await tx.trainingSession.findMany({
        where: { childId },
        select: { id: true },
      });
      const sessionIds = sessions.map((s) => s.id);

      const gameRuns = await tx.gameRun.findMany({
        where: { sessionId: { in: sessionIds } },
        select: { id: true },
      });
      const gameRunIds = gameRuns.map((gr) => gr.id);

      // Delete raw events
      await tx.rawEvent.deleteMany({
        where: { gameRunId: { in: gameRunIds } },
      });

      // Delete task metrics
      await tx.taskMetric.deleteMany({
        where: { gameRunId: { in: gameRunIds } },
      });

      // Delete game runs
      await tx.gameRun.deleteMany({
        where: { sessionId: { in: sessionIds } },
      });

      // Delete training sessions
      await tx.trainingSession.deleteMany({
        where: { childId },
      });

      // Delete assessment blocks
      const assessments = await tx.assessment.findMany({
        where: { childId },
        select: { id: true },
      });
      const assessmentIds = assessments.map((a) => a.id);

      await tx.assessmentBlock.deleteMany({
        where: { assessmentId: { in: assessmentIds } },
      });

      // Delete assessments
      await tx.assessment.deleteMany({
        where: { childId },
      });

      // Delete adaptive states
      await tx.adaptiveState.deleteMany({
        where: { childId },
      });

      // Delete domain performances
      await tx.domainPerformance.deleteMany({
        where: { childId },
      });

      // Delete training plans
      await tx.trainingPlan.deleteMany({
        where: { childId },
      });

      // Delete reports
      await tx.report.deleteMany({
        where: { childId },
      });

      // Delete consent records
      await tx.consentRecord.deleteMany({
        where: { childId },
      });

      // Delete child profile
      await tx.childProfile.delete({
        where: { id: childId },
      });
    });

    // Log the deletion
    logAudit({
      action: "data.delete",
      accountId,
      childId,
      details: { childName: child.displayName },
      ip: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return dataResponse({
      deleted: true,
      childId,
      message: "All data for this child has been permanently deleted",
    });
  } catch (error) {
    console.error("Data deletion error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
