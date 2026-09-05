import { z } from "zod";
import { UUID, ISODateTime, Difficulty } from "../types.js";
import { GameKey } from "../enums.js";

export const AdaptiveState = z.object({
  id: UUID,
  childId: UUID,
  gameKey: GameKey,
  abilityEstimate: z.number().min(0).max(10),
  uncertainty: z.number().min(0).max(5),
  currentDifficulty: Difficulty,
  algorithmVersion: z.string(),
  updatedAt: ISODateTime,
});
export type AdaptiveState = z.infer<typeof AdaptiveState>;
