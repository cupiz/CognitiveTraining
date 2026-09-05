import { NextRequest } from "next/server";
import { prisma } from "@cog/db";
import { requireAuth } from "@/lib/api/authorize";
import { dataResponse, errorResponse } from "@/lib/api/response";

/** POST /api/assessments/[id]/complete — mark assessment as completed */
export async function POST(
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

    if (assessment.status === "completed") {
      return errorResponse("CONFLICT", "Assessment already completed", 409);
    }

    if (assessment.status === "abandoned") {
      return errorResponse("CONFLICT", "Cannot complete an abandoned assessment", 409);
    }

    // Parse optional body (device context)
    let deviceContextJson = {};
    try {
      const body = await request.json();
      deviceContextJson = body.deviceContextJson ?? {};
    } catch {
      // No body provided, that's fine
    }

    const updated = await prisma.assessment.update({
      where: { id },
      data: {
        status: "completed",
        completedAt: new Date(),
        deviceContextJson,
      },
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
    console.error("Complete assessment error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
