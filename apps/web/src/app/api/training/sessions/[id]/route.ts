import { NextRequest } from "next/server";
import { prisma } from "@cog/db";
import { requireAuth } from "@/lib/api/authorize";
import { dataResponse, errorResponse } from "@/lib/api/response";

/** Helper to verify session ownership */
async function verifySessionOwnership(sessionId: string, accountId: string) {
  const session = await prisma.trainingSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      childId: true,
      plannerVersion: true,
      startedAt: true,
      completedAt: true,
      status: true,
      targetDurationSec: true,
      child: { select: { accountId: true } },
    },
  });

  if (!session) {
    return { ok: false as const, error: errorResponse("NOT_FOUND", "Training session not found", 404) };
  }

  if (session.child.accountId !== accountId) {
    return { ok: false as const, error: errorResponse("FORBIDDEN", "Not authorized", 403) };
  }

  return { ok: true as const, session };
}

/** GET /api/training/sessions/[id] — get a single training session */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const result = await verifySessionOwnership(id, auth.session.sub);
    if (!result.ok) return result.error;

    return dataResponse({
      id: result.session.id,
      childId: result.session.childId,
      plannerVersion: result.session.plannerVersion,
      startedAt: result.session.startedAt?.toISOString() ?? null,
      completedAt: result.session.completedAt?.toISOString() ?? null,
      status: result.session.status,
      targetDurationSec: result.session.targetDurationSec,
    });
  } catch (error) {
    console.error("Get training session error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

/** POST /api/training/sessions/[id]/complete — mark session as completed */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const result = await verifySessionOwnership(id, auth.session.sub);
    if (!result.ok) return result.error;

    if (result.session.status === "completed") {
      return errorResponse("CONFLICT", "Session already completed", 409);
    }

    if (result.session.status === "abandoned") {
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

/** PATCH /api/training/sessions/[id] — update session status */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const result = await verifySessionOwnership(id, auth.session.sub);
    if (!result.ok) return result.error;

    const body = await request.json();
    const { status } = body as { status?: string };

    if (!status || !["in_progress", "abandoned"].includes(status)) {
      return errorResponse("VALIDATION_ERROR", "Status must be 'in_progress' or 'abandoned'", 400);
    }

    const updateData: Record<string, unknown> = { status };
    if (status === "in_progress" && result.session.status === "pending") {
      updateData.startedAt = new Date();
    }
    if (status === "abandoned") {
      updateData.completedAt = new Date();
    }

    const updated = await prisma.trainingSession.update({
      where: { id },
      data: updateData,
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
    console.error("Update training session error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
