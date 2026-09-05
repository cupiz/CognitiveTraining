import { NextRequest } from "next/server";
import { TelemetryBatchRequest } from "@cog/schemas";
import { prisma } from "@cog/db";
import { requireAuth } from "@/lib/api/authorize";
import { dataResponse, errorResponse } from "@/lib/api/response";
import { checkResponseQuality } from "@cog/scoring";

/** POST /api/telemetry/batch — receive telemetry events from game client */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    // Idempotency key from header
    const idempotencyKey = request.headers.get("idempotency-key");

    const body = await request.json();
    const parsed = TelemetryBatchRequest.safeParse(body);

    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid telemetry payload", 400,
        parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      );
    }

    const { gameRunId, events } = parsed.data;

    // Verify game run exists and belongs to this user
    const gameRun = await prisma.gameRun.findUnique({
      where: { id: gameRunId },
      select: {
        id: true,
        session: {
          select: { child: { select: { accountId: true } } },
        },
      },
    });

    if (!gameRun) {
      return errorResponse("NOT_FOUND", "Game run not found", 404);
    }

    if (gameRun.session.child.accountId !== auth.session.sub) {
      return errorResponse("FORBIDDEN", "Not authorized", 403);
    }

    // Insert events, skip duplicates (unique constraint on gameRunId + sequenceNo)
    // Also run quality checks on response events
    let accepted = 0;
    let rejected = 0;
    const rejectedSequences: number[] = [];
    const qualityFlags: Array<{ code: string; trialId?: string; details?: Record<string, unknown> }> = [];
    const previousResponses = new Map<string, number>();

    for (const event of events) {
      try {
        await prisma.rawEvent.create({
          data: {
            gameRunId,
            sequenceNo: event.sequenceNo,
            eventType: event.eventType as never,
            clientTimeMs: event.clientTimeMs,
            payloadJson: event.payload,
            idempotencyKey: idempotencyKey ?? crypto.randomUUID(),
          },
        });
        accepted++;

        // Quality check on response events
        if (event.eventType === "response") {
          const check = checkResponseQuality(event.eventType, event.payload, previousResponses);
          qualityFlags.push(...check.flags);

          // Track response counts for duplicate detection
          const trialId = event.payload.trialId as string | undefined;
          if (trialId) {
            previousResponses.set(trialId, (previousResponses.get(trialId) ?? 0) + 1);
          }
        }
      } catch (err: unknown) {
        // Prisma unique constraint violation = duplicate sequence
        const isPrismaError = err && typeof err === "object" && "code" in err;
        if (isPrismaError && (err as { code: string }).code === "P2002") {
          rejected++;
          rejectedSequences.push(event.sequenceNo);
        } else {
          throw err;
        }
      }
    }

    return dataResponse({
      accepted,
      rejected,
      rejectedSequences,
      qualityFlags: qualityFlags.length > 0 ? qualityFlags : undefined,
    });
  } catch (error) {
    console.error("Telemetry batch error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
