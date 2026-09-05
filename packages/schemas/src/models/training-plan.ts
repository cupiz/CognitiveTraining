import { z } from "zod";
import { UUID, ISODateTime, JsonObject } from "../types.js";

export const TrainingPlan = z.object({
  id: UUID,
  childId: UUID,
  plannerVersion: z.string(),
  createdAt: ISODateTime,
  expiresAt: ISODateTime,
  itemsJson: JsonObject,
});
export type TrainingPlan = z.infer<typeof TrainingPlan>;
