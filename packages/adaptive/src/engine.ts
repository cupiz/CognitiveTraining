/**
 * Adaptive engine — main entry point.
 *
 * Orchestrates:
 * 1. Performance computation from trial metrics
 * 2. Ability estimation update
 * 3. Difficulty recommendation
 * 4. State persistence
 *
 * @see docs/07_ADAPTIVE_ENGINE.md
 */

import type {
  AbilityState,
  GameKey,
  PerformanceInput,
  UpdateResult,
} from "./types.js";
import { computePerformance } from "./performance.js";
import { updateAbility, createInitialState } from "./ability-estimator.js";
import { recommendDifficulty } from "./difficulty-controller.js";

// ── Main Functions ───────────────────────────────────────

/**
 * Process a completed game run and update adaptive state.
 *
 * @param state - Current adaptive state (or null for first run)
 * @param metrics - Raw metrics from the scoring engine
 * @param gameKey - Game key for difficulty bounds
 * @returns Update result with new state, recommendation, and performance
 */
export function processGameRun(
  state: AbilityState | null,
  metrics: PerformanceInput,
  gameKey: GameKey,
): UpdateResult {
  // Compute performance from trial metrics
  const performance = computePerformance(metrics);

  // Use existing state or create new one
  const currentState = state ?? createInitialState("", gameKey);

  // Update ability estimate
  const newState = updateAbility(currentState, performance);

  // Recommend difficulty based on updated ability
  const recommendation = recommendDifficulty(newState, performance, gameKey);

  // Apply recommended difficulty
  const finalState: AbilityState = {
    ...newState,
    difficulty: recommendation.difficulty,
  };

  return {
    state: finalState,
    recommendation,
    performance,
  };
}

/**
 * Get the initial adaptive state for a new child-game pair.
 */
export function getInitialState(childId: string, gameKey: string): AbilityState {
  return createInitialState(childId, gameKey);
}

/**
 * Compute performance without updating state.
 * Useful for previewing what the engine would do.
 */
export function previewPerformance(metrics: PerformanceInput) {
  return computePerformance(metrics);
}
