/**
 * Core types for the adaptive engine.
 *
 * @see docs/07_ADAPTIVE_ENGINE.md
 */

// ── Ability State ────────────────────────────────────────

export interface AbilityState {
  /** Ability estimate (0–10) */
  ability: number;
  /** Uncertainty (0–5), lower = more confident */
  uncertainty: number;
  /** Current difficulty level (1–10, fractional) */
  difficulty: number;
  /** Total valid attempts */
  attempts: number;
  /** Last update timestamp */
  lastUpdatedAt: string;
  /** Algorithm version */
  algorithmVersion: string;
}

// ── Performance Input ────────────────────────────────────

export interface PerformanceInput {
  /** Accuracy from scoring engine (0–1) */
  accuracy: number;
  /** Median reaction time in ms */
  medianRtMs: number;
  /** Mean reaction time in ms */
  meanRtMs: number;
  /** RT variability (standard deviation) */
  rtVariability: number;
  /** Number of omission errors */
  omissionErrors: number;
  /** Number of commission errors */
  commissionErrors: number;
  /** Number of valid trials */
  validTrialCount: number;
  /** Quality flags from scoring */
  qualityFlags: Array<{ code: string; trialId?: string }>;
}

// ── Performance Score ────────────────────────────────────

export interface PerformanceScore {
  /** Normalized performance (0–1) */
  score: number;
  /** Normalized accuracy component (0–1) */
  accuracyComponent: number;
  /** Normalized speed component (0–1) */
  speedComponent: number;
  /** Consistency component (0–1) */
  consistencyComponent: number;
  /** Whether the trial data is usable */
  usable: boolean;
  /** Reason if unusable */
  unusableReason?: string;
}

// ── Difficulty Recommendation ────────────────────────────

export interface DifficultyRecommendation {
  /** Recommended difficulty (1–10, fractional) */
  difficulty: number;
  /** Rationale codes */
  rationale: string[];
  /** Whether difficulty changed */
  changed: boolean;
  /** Previous difficulty */
  previousDifficulty: number;
}

// ── Update Result ────────────────────────────────────────

export interface UpdateResult {
  /** Updated ability state */
  state: AbilityState;
  /** Difficulty recommendation */
  recommendation: DifficultyRecommendation;
  /** Performance score used */
  performance: PerformanceScore;
}

// ── Game Key Constants ───────────────────────────────────

export type GameKey =
  | "memory_matrix"
  | "target_watch"
  | "quick_match"
  | "stop_signal"
  | "rule_switch"
  | "spice_stall"
  | "red_light"
  | "courier_map"
  | "lighthouse_keeper"
  | "sushi_express"
  | "crystal_palace";

// ── Difficulty Bounds ────────────────────────────────────

export interface DifficultyBounds {
  min: number;
  max: number;
  /** Maximum change per update (absolute) */
  maxStep: number;
}
