import { z } from "zod";
import { UUID, ISODateTime, JsonObject, PerformanceScore, Difficulty } from "../types.js";

export const TaskMetric = z.object({
  id: UUID,
  gameRunId: UUID,
  metricVersion: z.string(),
  accuracy: PerformanceScore,
  medianRtMs: z.number().min(0),
  meanRtMs: z.number().min(0),
  rtVariability: z.number().min(0),
  omissionErrors: z.number().int().min(0),
  commissionErrors: z.number().int().min(0),
  difficulty: Difficulty,
  validTrialCount: z.number().int().min(0),
  qualityFlagsJson: JsonObject.default({}),
  createdAt: ISODateTime,
});
export type TaskMetric = z.infer<typeof TaskMetric>;
