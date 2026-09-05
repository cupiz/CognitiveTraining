import { z } from "zod";
import { UUID, Difficulty } from "../types.js";
import { GameKey, CognitiveDomain } from "../enums.js";
import { DataEnvelope } from "./envelope.js";

// ── POST /planner/preview ─────────────────────────────────

export const PlannerPreviewRequest = z.object({
  childId: UUID,
  constraints: z
    .object({
      maxMinutes: z.number().int().min(1).max(60).default(15),
    })
    .default({}),
});
export type PlannerPreviewRequest = z.infer<typeof PlannerPreviewRequest>;

export const PlannerItem = z.object({
  gameKey: GameKey,
  gameVersion: z.string(),
  difficulty: Difficulty,
  targetDomains: z.array(CognitiveDomain),
  rationaleCodes: z.array(z.string()),
});
export type PlannerItem = z.infer<typeof PlannerItem>;

export const PlannerPreviewResponse = DataEnvelope(
  z.object({
    plannerVersion: z.string(),
    items: z.array(PlannerItem),
  }),
);
export type PlannerPreviewResponse = z.infer<typeof PlannerPreviewResponse>;
