import { z } from "zod";
import { UUID, ISODateTime } from "../types.js";
import { TrainingSessionStatus } from "../enums.js";

export const TrainingSession = z.object({
  id: UUID,
  childId: UUID,
  plannerVersion: z.string(),
  startedAt: ISODateTime.nullable(),
  completedAt: ISODateTime.nullable(),
  status: TrainingSessionStatus,
  targetDurationSec: z.number().int().min(1),
});
export type TrainingSession = z.infer<typeof TrainingSession>;
