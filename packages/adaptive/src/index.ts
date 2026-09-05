// ── Adaptive Engine ──────────────────────────────────────
export { processGameRun, getInitialState, previewPerformance } from "./engine.js";

// ── Ability Estimation ───────────────────────────────────
export { createInitialState, updateAbility, batchUpdateAbility, ALGORITHM_VERSION } from "./ability-estimator.js";

// ── Performance Computation ──────────────────────────────
export { computePerformance } from "./performance.js";

// ── Difficulty Controller ────────────────────────────────
export { recommendDifficulty, getGameBounds, clampDifficulty, getDifficultyLevel } from "./difficulty-controller.js";

// ── Types ────────────────────────────────────────────────
export type {
  AbilityState,
  PerformanceInput,
  PerformanceScore,
  DifficultyRecommendation,
  UpdateResult,
  GameKey,
  DifficultyBounds,
} from "./types.js";
