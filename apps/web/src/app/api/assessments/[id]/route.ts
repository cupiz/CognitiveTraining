import { NextRequest } from "next/server";
import { prisma } from "@cog/db";
import { requireAuth } from "@/lib/api/authorize";
import { dataResponse, errorResponse } from "@/lib/api/response";

/** GET /api/assessments/[id] — get a single assessment with blocks */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        blocks: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!assessment) {
      return errorResponse("NOT_FOUND", "Assessment not found", 404);
    }

    // Verify ownership
    const child = await prisma.childProfile.findUnique({
      where: { id: assessment.childId },
      select: { accountId: true },
    });

    if (!child || child.accountId !== auth.session.sub) {
      return errorResponse("FORBIDDEN", "Not authorized", 403);
    }

    return dataResponse({
      id: assessment.id,
      childId: assessment.childId,
      assessmentVersion: assessment.assessmentVersion,
      startedAt: assessment.startedAt?.toISOString() ?? null,
      completedAt: assessment.completedAt?.toISOString() ?? null,
      status: assessment.status,
      deviceContextJson: assessment.deviceContextJson,
      blocks: assessment.blocks.map((b) => ({
        id: b.id,
        domain: b.domain,
        gameKey: b.gameKey,
        gameVersion: b.gameVersion,
        taskVersion: b.taskVersion,
        config: b.config,
        orderIndex: b.orderIndex,
      })),
    });
  } catch (error) {
    console.error("Get assessment error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

/** PATCH /api/assessments/[id] — update assessment status (in_progress, abandoned) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const assessment = await prisma.assessment.findUnique({
      where: { id },
      select: { childId: true, status: true },
    });

    if (!assessment) {
      return errorResponse("NOT_FOUND", "Assessment not found", 404);
    }

    // Verify ownership
    const child = await prisma.childProfile.findUnique({
      where: { id: assessment.childId },
      select: { accountId: true },
    });

    if (!child || child.accountId !== auth.session.sub) {
      return errorResponse("FORBIDDEN", "Not authorized", 403);
    }

    const body = await request.json();
    const { status } = body as { status?: string };

    if (!status || !["in_progress", "abandoned"].includes(status)) {
      return errorResponse("VALIDATION_ERROR", "Status must be 'in_progress' or 'abandoned'", 400);
    }

    const updateData: Record<string, unknown> = { status };
    if (status === "in_progress" && assessment.status === "pending") {
      updateData.startedAt = new Date();
    }
    if (status === "abandoned") {
      updateData.completedAt = new Date();
    }

    const updated = await prisma.assessment.update({
      where: { id },
      data: updateData,
    });

    return dataResponse({
      id: updated.id,
      childId: updated.childId,
      assessmentVersion: updated.assessmentVersion,
      startedAt: updated.startedAt?.toISOString() ?? null,
      completedAt: updated.completedAt?.toISOString() ?? null,
      status: updated.status,
    });
  } catch (error) {
    console.error("Update assessment error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
