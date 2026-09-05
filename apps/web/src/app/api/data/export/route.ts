import { NextRequest } from "next/server";
import { prisma } from "@cog/db";
import { requireAuth } from "@/lib/api/authorize";
import { errorResponse } from "@/lib/api/response";
import { logAudit } from "@/lib/security/audit";

/** GET /api/data/export — export all data for the authenticated user */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const accountId = auth.session.sub;

    // Get all children
    const children = await prisma.childProfile.findMany({
      where: { accountId },
      include: {
        consentRecords: true,
        assessments: {
          include: {
            blocks: true,
          },
        },
        trainingSessions: {
          include: {
            gameRuns: {
              include: {
                rawEvents: true,
                taskMetrics: true,
              },
            },
          },
        },
        adaptiveStates: true,
        domainPerformance: true,
        reports: true,
      },
    });

    // Log the export
    logAudit({
      action: "data.export",
      accountId,
      details: { childCount: children.length },
      ip: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    // Build export data
    const exportData = {
      exportedAt: new Date().toISOString(),
      accountId,
      children: children.map((child) => ({
        id: child.id,
        displayName: child.displayName,
        birthMonth: child.birthMonth,
        birthYear: child.birthYear,
        locale: child.locale,
        status: child.status,
        createdAt: child.createdAt.toISOString(),
        consentRecords: child.consentRecords.map((cr) => ({
          consentType: cr.consentType,
          documentVersion: cr.documentVersion,
          grantedAt: cr.grantedAt.toISOString(),
          revokedAt: cr.revokedAt?.toISOString() ?? null,
          source: cr.source,
        })),
        assessments: child.assessments.map((a) => ({
          id: a.id,
          status: a.status,
          assessmentVersion: a.assessmentVersion,
          startedAt: a.startedAt?.toISOString() ?? null,
          completedAt: a.completedAt?.toISOString() ?? null,
          blocks: a.blocks.map((b) => ({
            domain: b.domain,
            gameKey: b.gameKey,
            gameVersion: b.gameVersion,
            orderIndex: b.orderIndex,
          })),
        })),
        trainingSessions: child.trainingSessions.map((s) => ({
          id: s.id,
          status: s.status,
          plannerVersion: s.plannerVersion,
          startedAt: s.startedAt?.toISOString() ?? null,
          completedAt: s.completedAt?.toISOString() ?? null,
          targetDurationSec: s.targetDurationSec,
          gameRuns: s.gameRuns.map((gr) => ({
            id: gr.id,
            gameKey: gr.gameKey,
            gameVersion: gr.gameVersion,
            status: gr.status,
            startedAt: gr.startedAt?.toISOString() ?? null,
            endedAt: gr.endedAt?.toISOString() ?? null,
            rawEventCount: gr.rawEvents.length,
            taskMetrics: gr.taskMetrics.map((tm) => ({
              accuracy: Number(tm.accuracy),
              medianRtMs: Number(tm.medianRtMs),
              meanRtMs: Number(tm.meanRtMs),
              rtVariability: Number(tm.rtVariability),
              omissionErrors: tm.omissionErrors,
              commissionErrors: tm.commissionErrors,
              difficulty: tm.difficulty,
              validTrialCount: tm.validTrialCount,
              createdAt: tm.createdAt.toISOString(),
            })),
          })),
        })),
        adaptiveStates: child.adaptiveStates.map((as) => ({
          gameKey: as.gameKey,
          abilityEstimate: Number(as.abilityEstimate),
          uncertainty: Number(as.uncertainty),
          currentDifficulty: as.currentDifficulty,
          algorithmVersion: as.algorithmVersion,
          updatedAt: as.updatedAt.toISOString(),
        })),
        domainPerformances: child.domainPerformance.map((dp) => ({
          domain: dp.domain,
          score: Number(dp.score),
          confidence: Number(dp.confidence),
          windowStart: dp.windowStart.toISOString(),
          windowEnd: dp.windowEnd.toISOString(),
          sourceRunCount: dp.sourceRunCount,
          createdAt: dp.createdAt.toISOString(),
        })),
        reports: child.reports.map((r) => ({
          id: r.id,
          periodStart: r.periodStart.toISOString(),
          periodEnd: r.periodEnd.toISOString(),
          reportVersion: r.reportVersion,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
        })),
      })),
    };

    // Return as JSON download
    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="cognitive-training-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    console.error("Data export error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
