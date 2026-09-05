import { z } from "zod";
import { UUID, ISODateTime, JsonObject } from "../types.js";
import { CognitiveDomain, AssessmentStatus, GameKey } from "../enums.js";

// ── Assessment ────────────────────────────────────────────

export const Assessment = z.object({
  id: UUID,
  childId: UUID,
  assessmentVersion: z.string(),
  startedAt: ISODateTime.nullable(),
  completedAt: ISODateTime.nullable(),
  status: AssessmentStatus,
  deviceContextJson: JsonObject.default({}),
});
export type Assessment = z.infer<typeof Assessment>;

// ── AssessmentBlock ───────────────────────────────────────

export const AssessmentBlock = z.object({
  id: UUID,
  assessmentId: UUID,
  domain: CognitiveDomain,
  gameKey: GameKey,
  gameVersion: z.string(),
  taskVersion: z.string(),
  orderIndex: z.number().int().min(0),
  config: JsonObject.default({}),
});
export type AssessmentBlock = z.infer<typeof AssessmentBlock>;

// ── Block Configuration ───────────────────────────────────

/** Predefined block configuration for each assessment version */
export interface BlockConfig {
  domain: CognitiveDomain;
  gameKey: GameKey;
  gameVersion: string;
  practiceTrials: number;
  maxTrials: number;
  difficulty: number;
}

/** MVP assessment block configuration */
export const MVP_BLOCK_CONFIGS: BlockConfig[] = [
  {
    domain: "working_memory",
    gameKey: "memory_matrix",
    gameVersion: "1.0.0",
    practiceTrials: 3,
    maxTrials: 20,
    difficulty: 5,
  },
  {
    domain: "sustained_attention",
    gameKey: "target_watch",
    gameVersion: "1.0.0",
    practiceTrials: 3,
    maxTrials: 25,
    difficulty: 5,
  },
  {
    domain: "processing_speed",
    gameKey: "quick_match",
    gameVersion: "1.0.0",
    practiceTrials: 3,
    maxTrials: 20,
    difficulty: 5,
  },
  {
    domain: "inhibitory_control",
    gameKey: "stop_signal",
    gameVersion: "1.0.0",
    practiceTrials: 3,
    maxTrials: 30,
    difficulty: 5,
  },
  {
    domain: "cognitive_flexibility",
    gameKey: "rule_switch",
    gameVersion: "1.0.0",
    practiceTrials: 3,
    maxTrials: 25,
    difficulty: 5,
  },
];

/** Get block configs for an assessment version */
export function getBlockConfigs(assessmentVersion: string): BlockConfig[] {
  if (assessmentVersion === "mvp-1") {
    return MVP_BLOCK_CONFIGS;
  }
  // Default to MVP config for unknown versions
  return MVP_BLOCK_CONFIGS;
}
