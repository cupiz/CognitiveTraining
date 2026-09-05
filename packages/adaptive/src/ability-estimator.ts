/**
 * Ability estimation for the adaptive engine.
 *
 * Uses an Elo-like rating system with uncertainty tracking.
 * Ability is on a 0–10 scale (matching difficulty).
 * Uncertainty decreases with more observations.
 *
 * @see docs/07_ADAPTIVE_ENGINE.md §2, §5
 */

import type { AbilityState, PerformanceScore } from "./types.js";

// ── Constants ────────────────────────────────────────────

/** Algorithm version */
export const ALGORITHM_VERSION = "adaptive-v0.1-mvp";

/** Initial ability for new users (mid-range) */
const INITIAL_ABILITY = 5.0;

/** Initial uncertainty (high = unknown) */
const INITIAL_UNCERTAINTY = 4.0;

/** Maximum uncertainty */
const MAX_UNCERTAINTY = 5.0;

/** Minimum uncertainty (with enough data) */
const MIN_UNCERTAINTY = 0.5;

/** Learning rate for ability updates */
const LEARNING_RATE = 0.3;

/** Uncertainty reduction per valid observation */
const UNCERTAINTY_REDUCTION_RATE = 0.15;

/** K-factor (controls update magnitude) */
const K_FACTOR = 0.5;

// ── Main Functions ───────────────────────────────────────

/**
 * Create a new adaptive state for a child-game pair.
 */
export function createInitialState(_childId: string, _gameKey: string): AbilityState {
  return {
    ability: INITIAL_ABILITY,
    uncertainty: INITIAL_UNCERTAINTY,
    difficulty: INITIAL_ABILITY,
    attempts: 0,
    lastUpdatedAt: new Date().toISOString(),
    algorithmVersion: ALGORITHM_VERSION,
  };
}

/**
 * Update ability estimate based on performance.
 *
 * Uses a simplified Elo-like update:
 * - Expected performance based on ability vs difficulty
 * - Actual performance from trial metrics
 * - Update magnitude scaled by uncertainty and learning rate
 *
 * @param state - Current adaptive state
 * @param performance - Computed performance score
 * @returns Updated ability state
 */
export function updateAbility(
  state: AbilityState,
  performance: PerformanceScore,
): AbilityState {
  if (!performance.usable) {
    return state; // No update for unusable data
  }

  const { ability, uncertainty, difficulty, attempts } = state;

  // Expected performance: how well should this ability do at this difficulty?
  // If ability > difficulty, expect high performance
  // If ability < difficulty, expect low performance
  const expectedPerformance = sigmoid(ability - difficulty);

  // Actual performance
  const actualPerformance = performance.score;

  // Prediction error
  const error = actualPerformance - expectedPerformance;

  // Update magnitude: scaled by K-factor, uncertainty, and learning rate
  // Higher uncertainty → larger updates (we're less sure)
  const updateMagnitude = K_FACTOR * error * (uncertainty / MAX_UNCERTAINTY) * LEARNING_RATE;

  // Update ability
  const newAbility = clamp(ability + updateMagnitude, 0, 10);

  // Reduce uncertainty with each valid observation
  const newUncertainty = Math.max(
    MIN_UNCERTAINTY,
    uncertainty - UNCERTAINTY_REDUCTION_RATE,
  );

  // Difficulty follows ability (will be adjusted by controller)
  const newDifficulty = newAbility;

  return {
    ability: round2(newAbility),
    uncertainty: round2(newUncertainty),
    difficulty: round2(newDifficulty),
    attempts: attempts + 1,
    lastUpdatedAt: new Date().toISOString(),
    algorithmVersion: state.algorithmVersion,
  };
}

/**
 * Batch update ability from multiple performance observations.
 * Useful for re-scoring historical data.
 */
export function batchUpdateAbility(
  initialState: AbilityState,
  performances: PerformanceScore[],
): AbilityState {
  let state = initialState;
  for (const perf of performances) {
    state = updateAbility(state, perf);
  }
  return state;
}

// ── Helper Functions ─────────────────────────────────────

/**
 * Logistic sigmoid function.
 * Maps x to (0, 1) where 0 → 0.5.
 */
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
