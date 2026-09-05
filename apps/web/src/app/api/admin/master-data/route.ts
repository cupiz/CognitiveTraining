import { prisma } from "@cog/db";
import { requireAdmin } from "@/lib/api/authorize";
import { dataResponse, errorResponse } from "@/lib/api/response";
import { GAMES } from "@/lib/games";

/** GET /api/admin/master-data — reference data: game catalog, domains, versions (admin only) */
export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const [visibilityRows, runGroups, domainGroups, plannerVersions, assessmentVersions, metricVersions] =
      await Promise.all([
        prisma.gameVisibility.findMany(),
        prisma.gameRun.groupBy({ by: ["gameKey", "status"], _count: { _all: true } }),
        prisma.assessmentBlock.groupBy({ by: ["domain"], _count: { _all: true } }),
        prisma.trainingSession.findMany({
          select: { plannerVersion: true },
          distinct: ["plannerVersion"],
        }),
        prisma.assessment.findMany({
          select: { assessmentVersion: true },
          distinct: ["assessmentVersion"],
        }),
        prisma.taskMetric.findMany({
          select: { metricVersion: true },
          distinct: ["metricVersion"],
        }),
      ]);

    const visibleByKey = new Map(visibilityRows.map((r) => [r.gameKey, r.visible]));

    // Per-game usage: total runs vs completed runs.
    const usage = new Map<
      string,
      { totalRuns: number; completedRuns: number; inProgress: number }
    >();
    for (const row of runGroups) {
      const entry = usage.get(row.gameKey) ?? { totalRuns: 0, completedRuns: 0, inProgress: 0 };
      entry.totalRuns += row._count._all;
      if (row.status === "completed") entry.completedRuns += row._count._all;
      if (row.status === "in_progress") entry.inProgress += row._count._all;
      usage.set(row.gameKey, entry);
    }

    const games = GAMES.map((g) => ({
      key: g.key,
      name: g.name,
      domain: g.domain,
      domainKey: g.domainKey,
      family: g.family,
      color: g.color,
      tint: g.tint,
      deep: g.deep,
      description: g.description,
      defaultDifficulty: g.defaultDifficulty,
      visible: visibleByKey.get(g.key) ?? false,
      usage: usage.get(g.key) ?? { totalRuns: 0, completedRuns: 0, inProgress: 0 },
    }));

    // Domain aggregates: how many assessment blocks reference each domain
    // and which games belong to it (from the registry).
    const domainNames = new Set(games.map((g) => g.domainKey));
    for (const row of domainGroups) domainNames.add(row.domain);
    const domains = Array.from(domainNames).map((domainKey) => ({
      key: domainKey,
      label: GAMES.find((g) => g.domainKey === domainKey)?.domain ?? domainKey,
      gameCount: games.filter((g) => g.domainKey === domainKey).length,
      assessmentBlocks: domainGroups.find((r) => r.domain === domainKey)?._count._all ?? 0,
    }));

    return dataResponse({
      games,
      domains,
      versions: {
        planner: plannerVersions.map((r) => r.plannerVersion).sort(),
        assessment: assessmentVersions.map((r) => r.assessmentVersion).sort(),
        metric: metricVersions.map((r) => r.metricVersion).sort(),
      },
    });
  } catch (error) {
    console.error("Admin master data error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
