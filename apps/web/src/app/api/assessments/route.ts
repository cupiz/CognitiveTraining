import { NextRequest } from "next/server";
import { CreateAssessmentRequest } from "@cog/schemas";
import type { CognitiveDomain, GameKey } from "@cog/schemas";
import { prisma } from "@cog/db";
import { authorizeChild } from "@/lib/api/authorize";
import { dataResponse, errorResponse } from "@/lib/api/response";

/** Block configuration for assessment */
interface BlockConfig {
  domain: CognitiveDomain;
  gameKey: GameKey;
  gameVersion: string;
  practiceTrials: number;
  maxTrials: number;
  difficulty: number;
}

/** MVP assessment block configuration */
const MVP_BLOCK_CONFIGS: BlockConfig[] = [
  { domain: "working_memory", gameKey: "memory_matrix", gameVersion: "1.0.0", practiceTrials: 3, maxTrials: 20, difficulty: 5 },
  { domain: "sustained_attention", gameKey: "target_watch", gameVersion: "1.0.0", practiceTrials: 3, maxTrials: 25, difficulty: 5 },
  { domain: "processing_speed", gameKey: "quick_match", gameVersion: "1.0.0", practiceTrials: 3, maxTrials: 20, difficulty: 5 },
  { domain: "inhibitory_control", gameKey: "stop_signal", gameVersion: "1.0.0", practiceTrials: 3, maxTrials: 30, difficulty: 5 },
  { domain: "cognitive_flexibility", gameKey: "rule_switch", gameVersion: "1.0.0", practiceTrials: 3, maxTrials: 25, difficulty: 5 },
];

function getBlockConfigs(assessmentVersion: string): BlockConfig[] {
  if (assessmentVersion === "mvp-1") return MVP_BLOCK_CONFIGS;
  return MVP_BLOCK_CONFIGS;
}

/** POST /api/assessments — create a new assessment with auto-generated blocks */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateAssessmentRequest.safeParse(body);

    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid request", 400,
        parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      );
    }

    const { childId, assessmentVersion } = parsed.data;

    // Authorize: parent must own the child
    const auth = await authorizeChild(request, childId);
    if (!auth.ok) return auth.response;

    // Check for active assessment (only one per child at a time)
    const activeAssessment = await prisma.assessment.findFirst({
      where: {
        childId,
        status: { in: ["pending", "in_progress"] },
      },
    });

    if (activeAssessment) {
      return errorResponse("CONFLICT", "Child already has an active assessment", 409);
    }

    // Get block configuration for this assessment version
    const blockConfigs = getBlockConfigs(assessmentVersion);

    // Create assessment with blocks in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const a = await tx.assessment.create({
        data: {
          childId,
          assessmentVersion,
          status: "pending",
        },
      });

      // Create blocks
      const blocks = await Promise.all(
        blockConfigs.map((config, index) =>
          tx.assessmentBlock.create({
            data: {
              assessmentId: a.id,
              domain: config.domain,
              gameKey: config.gameKey,
              gameVersion: config.gameVersion,
              taskVersion: config.gameVersion,
              orderIndex: index,
              config: {
                practiceTrials: config.practiceTrials,
                maxTrials: config.maxTrials,
                difficulty: config.difficulty,
              },
            },
          })
        )
      );

      return { assessment: a, blocks };
    });

    return dataResponse(
      {
        assessmentId: result.assessment.id,
        assessmentVersion: result.assessment.assessmentVersion,
        status: result.assessment.status,
        blocks: result.blocks.map((b) => ({
          blockId: b.id,
          domain: b.domain,
          gameKey: b.gameKey,
          gameVersion: b.gameVersion,
          config: b.config,
          orderIndex: b.orderIndex,
        })),
      },
      201,
    );
  } catch (error) {
    console.error("Create assessment error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

/** GET /api/assessments — list assessments for a child (query param: childId) */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("childId");

    if (!childId) {
      return errorResponse("VALIDATION_ERROR", "childId query parameter is required", 400);
    }

    const auth = await authorizeChild(request, childId);
    if (!auth.ok) return auth.response;

    const assessments = await prisma.assessment.findMany({
      where: { childId },
      include: {
        blocks: {
          orderBy: { orderIndex: "asc" },
        },
      },
      orderBy: { id: "desc" },
    });

    return dataResponse({
      assessments: assessments.map((a) => ({
        id: a.id,
        childId: a.childId,
        assessmentVersion: a.assessmentVersion,
        startedAt: a.startedAt?.toISOString() ?? null,
        completedAt: a.completedAt?.toISOString() ?? null,
        status: a.status,
        blocks: a.blocks.map((b) => ({
          id: b.id,
          domain: b.domain,
          gameKey: b.gameKey,
          gameVersion: b.gameVersion,
          config: b.config,
          orderIndex: b.orderIndex,
        })),
      })),
    });
  } catch (error) {
    console.error("List assessments error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
