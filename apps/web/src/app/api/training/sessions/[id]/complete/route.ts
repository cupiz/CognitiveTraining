import { NextRequest } from "next/server";
import { prisma } from "@cog/db";
import { requireAuth } from "@/lib/api/authorize";
import { dataResponse, errorResponse } from "@/lib/api/response";

/** POST /api/training/sessions/[id]/complete — mark session as completed */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const session = await prisma.trainingSession.findUnique({
      where: { id },
      select: {
        id: true,
        childId: true,
        status: true,
        plannerVersion: true,
        startedAt: true,
        completedAt: true,
        targetDurationSec: true,
        child: { select: { accountId: true } },
      },
    });

    if (!session) {
      return errorResponse("NOT_FOUND", "Training session not found", 404);
    }

    if (session.child.accountId !== auth.session.sub) {
      return errorResponse("FORBIDDEN", "Not authorized", 403);
    }

    if (session.status === "completed") {
      return errorResponse("CONFLICT", "Session already completed", 409);
    }

    if (session.status === "abandoned") {
      return errorResponse("CONFLICT", "Cannot complete an abandoned session", 409);
    }

    const updated = await prisma.trainingSession.update({
      where: { id },
      data: {
        status: "completed",
        completedAt: new Date(),
      },
    });

    return dataResponse({
      id: updated.id,
      childId: updated.childId,
      plannerVersion: updated.plannerVersion,
      startedAt: updated.startedAt?.toISOString() ?? null,
      completedAt: updated.completedAt?.toISOString() ?? null,
      status: updated.status,
      targetDurationSec: updated.targetDurationSec,
    });
  } catch (error) {
    console.error("Complete training session error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
