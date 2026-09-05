/**
 * Difficulty controller for the adaptive engine.
 *
 * Maps ability estimate to difficulty level with guardrails:
 * - Bounded step changes (max ±1 per update)
 * - Game-specific difficulty ranges
 * - Rationale codes for transparency
 *
 * @see docs/07_ADAPTIVE_ENGINE.md §6, §7
 */

import type {
  AbilityState,
  DifficultyBounds,
  DifficultyRecommendation,
  GameKey,
  PerformanceScore,
} from "./types.js";

// ── Game-Specific Bounds ─────────────────────────────────

const GAME_BOUNDS: Record<GameKey, DifficultyBounds> = {
  memory_matrix: { min: 1, max: 10, maxStep: 1.0 },
  target_watch: { min: 1, max: 10, maxStep: 1.0 },
  quick_match: { min: 1, max: 10, maxStep: 1.0 },
  stop_signal: { min: 1, max: 10, maxStep: 1.0 },
  rule_switch: { min: 1, max: 10, maxStep: 1.0 },
  spice_stall: { min: 1, max: 10, maxStep: 1.0 },
  red_light: { min: 1, max: 10, maxStep: 1.0 },
  courier_map: { min: 1, max: 10, maxStep: 1.0 },
  lighthouse_keeper: { min: 1, max: 10, maxStep: 1.0 },
  sushi_express: { min: 1, max: 10, maxStep: 1.0 },
  crystal_palace: { min: 1, max: 10, maxStep: 1.0 },
};

// ── Thresholds ───────────────────────────────────────────

/** Performance above this → increase difficulty */
const INCREASE_THRESHOLD = 0.85;

/** Performance below this → decrease difficulty */
const DECREASE_THRESHOLD = 0.55;

/** Maximum change per session (cumulative) */
const MAX_SESSION_CHANGE = 1.0;

// ── Main Functions ───────────────────────────────────────

/**
 * Recommend a new difficulty based on ability and performance.
 *
 * @param state - Current adaptive state
 * @param performance - Computed performance score
 * @param gameKey - Game key for bounds lookup
 * @returns Difficulty recommendation with rationale
 */
export function recommendDifficulty(
  state: AbilityState,
  performance: PerformanceScore,
  gameKey: GameKey,
): DifficultyRecommendation {
  const bounds = GAME_BOUNDS[gameKey] ?? { min: 1, max: 10, maxStep: 1.0 };
  const { difficulty: currentDifficulty } = state;

  const rationale: string[] = [];
  let newDifficulty = currentDifficulty;

  if (!performance.usable) {
    rationale.push("no_change_unusable_data");
    return {
      difficulty: currentDifficulty,
      rationale,
      changed: false,
      previousDifficulty: currentDifficulty,
    };
  }

  // Rule-based adjustment based on performance
  if (performance.score > INCREASE_THRESHOLD) {
    // High performance → increase difficulty
    const step = computeStepSize(performance.score, bounds.maxStep);
    newDifficulty = currentDifficulty + step;
    rationale.push("high_performance");
    rationale.push(`score_${performance.score.toFixed(2)}`);
  } else if (performance.score < DECREASE_THRESHOLD) {
    // Low performance → decrease difficulty
    const step = computeStepSize(1 - performance.score, bounds.maxStep);
    newDifficulty = currentDifficulty - step;
    rationale.push("low_performance");
    rationale.push(`score_${performance.score.toFixed(2)}`);
  } else {
    // In target zone → no change
    rationale.push("accuracy_in_target_zone");
    rationale.push(`score_${performance.score.toFixed(2)}`);
  }

  // Uncertainty consideration
  if (state.uncertainty > 3.0) {
    rationale.push("high_uncertainty");
  } else if (state.uncertainty < 1.0) {
    rationale.push("uncertainty_decreasing");
  }

  // Clamp to bounds
  newDifficulty = Math.max(bounds.min, Math.min(bounds.max, newDifficulty));

  // Prevent excessive change within session
  const sessionDelta = Math.abs(newDifficulty - state.ability);
  if (sessionDelta > MAX_SESSION_CHANGE) {
    const direction = newDifficulty > state.ability ? 1 : -1;
    newDifficulty = state.ability + direction * MAX_SESSION_CHANGE;
    rationale.push("session_change_limited");
  }

  // Round to 1 decimal
  newDifficulty = Math.round(newDifficulty * 10) / 10;

  return {
    difficulty: newDifficulty,
    rationale,
    changed: Math.abs(newDifficulty - currentDifficulty) > 0.01,
    previousDifficulty: currentDifficulty,
  };
}

/**
 * Get difficulty bounds for a game.
 */
export function getGameBounds(gameKey: GameKey): DifficultyBounds {
  return GAME_BOUNDS[gameKey] ?? { min: 1, max: 10, maxStep: 1.0 };
}

/**
 * Clamp difficulty to game-specific bounds.
 */
export function clampDifficulty(difficulty: number, gameKey: GameKey): number {
  const bounds = getGameBounds(gameKey);
  return Math.max(bounds.min, Math.min(bounds.max, difficulty));
}

/**
 * Get difficulty level (integer 1–10) from fractional difficulty.
 */
export function getDifficultyLevel(difficulty: number): number {
  return Math.max(1, Math.min(10, Math.round(difficulty)));
}

// ── Internal Helpers ─────────────────────────────────────

/**
 * Compute step size based on how far performance is from threshold.
 * More extreme performance → larger step (up to maxStep).
 */
function computeStepSize(extremity: number, maxStep: number): number {
  // extremity is 0–1 (distance from threshold)
  // Scale step from 0.25 to maxStep
  const minStep = 0.25;
  return minStep + (maxStep - minStep) * extremity;
}
