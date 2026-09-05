/**
 * Adaptive engine simulation — tests with synthetic user profiles.
 *
 * Generates synthetic users with different ability levels and simulates
 * their gameplay to verify adaptive engine convergence and stability.
 *
 * @see docs/07_ADAPTIVE_ENGINE.md §8
 */

import type { AbilityState, GameKey, PerformanceScore } from "./types.js";
import { createInitialState, updateAbility } from "./ability-estimator.js";

// ── Types ────────────────────────────────────────────────

export interface SyntheticUser {
  /** User profile name */
  name: string;
  /** True ability level (0–10) */
  trueAbility: number;
  /** Performance variability */
  variability: number;
  /** Learning rate */
  learningRate: number;
  /** Description */
  description: string;
}

export interface SimulationResult {
  /** Final ability state */
  finalState: AbilityState;
  /** All states during simulation */
  states: AbilityState[];
  /** All performances during simulation */
  performances: PerformanceScore[];
  /** Whether the user converged */
  converged: boolean;
  /** Final uncertainty */
  finalUncertainty: number;
  /** Ability error (estimated vs true) */
  abilityError: number;
}

export interface SimulationReport {
  /** Results for each user profile */
  results: Record<string, SimulationResult>;
  /** Summary statistics */
  summary: {
    /** Average convergence rate */
    convergenceRate: number;
    /** Average ability error */
    averageAbilityError: number;
    /** Maximum ability error */
    maxAbilityError: number;
  };
  /** All passed */
  passed: boolean;
}

// ── Synthetic User Profiles ──────────────────────────────

export const SYNTHETIC_USERS: SyntheticUser[] = [
  {
    name: "high_ability",
    trueAbility: 8.5,
    variability: 0.1,
    learningRate: 0.05,
    description: "High ability, consistent performance",
  },
  {
    name: "low_ability",
    trueAbility: 2.0,
    variability: 0.15,
    learningRate: 0.03,
    description: "Low ability, slightly variable",
  },
  {
    name: "average_ability",
    trueAbility: 5.0,
    variability: 0.2,
    learningRate: 0.04,
    description: "Average ability, moderate variability",
  },
  {
    name: "inconsistent",
    trueAbility: 5.0,
    variability: 0.5,
    learningRate: 0.02,
    description: "Average ability, highly variable",
  },
  {
    name: "fast_inaccurate",
    trueAbility: 6.0,
    variability: 0.3,
    learningRate: 0.04,
    description: "Fast but inaccurate responses",
  },
  {
    name: "slow_accurate",
    trueAbility: 7.0,
    variability: 0.15,
    learningRate: 0.03,
    description: "Slow but accurate responses",
  },
  {
    name: "learning_curve",
    trueAbility: 4.0,
    variability: 0.2,
    learningRate: 0.1,
    description: "Starts low, improves over time",
  },
  {
    name: "ceiling_effect",
    trueAbility: 9.5,
    variability: 0.05,
    learningRate: 0.01,
    description: "Near ceiling, minimal room for improvement",
  },
];

// ── Simulation Functions ─────────────────────────────────

/**
 * Run simulation for a single synthetic user.
 */
export function simulateUser(
  user: SyntheticUser,
  gameKey: GameKey,
  sessions: number = 20,
  trialsPerSession: number = 20,
): SimulationResult {
  let state = createInitialState("simulation", gameKey);
  const states: AbilityState[] = [state];
  const performances: PerformanceScore[] = [];

  for (let session = 0; session < sessions; session++) {
    // Simulate trials in this session
    for (let trial = 0; trial < trialsPerSession; trial++) {
      const performance = generatePerformance(user, state, session, trial);
      performances.push(performance);

      // Update state
      state = updateAbility(state, performance);
    }

    states.push(state);
  }

  // Check convergence (uncertainty < 1.5 after 5 sessions)
  const converged = state.uncertainty < 1.5 && states.length >= 5;
  const abilityError = Math.abs(state.ability - user.trueAbility);

  return {
    finalState: state,
    states,
    performances,
    converged,
    finalUncertainty: state.uncertainty,
    abilityError,
  };
}

/**
 * Run full simulation across all user profiles.
 */
export function runSimulation(
  gameKey: GameKey,
  sessions: number = 20,
  trialsPerSession: number = 20,
): SimulationReport {
  const results: Record<string, SimulationResult> = {};

  for (const user of SYNTHETIC_USERS) {
    results[user.name] = simulateUser(user, gameKey, sessions, trialsPerSession);
  }

  // Calculate summary
  const resultValues = Object.values(results);
  const convergenceRate = resultValues.filter((r) => r.converged).length / resultValues.length;
  const abilityErrors = resultValues.map((r) => r.abilityError);
  const averageAbilityError = abilityErrors.reduce((s, e) => s + e, 0) / abilityErrors.length;
  const maxAbilityError = Math.max(...abilityErrors);

  // Check if simulation passed
  const passed = convergenceRate >= 0.7 && averageAbilityError < 2.0;

  return {
    results,
    summary: {
      convergenceRate,
      averageAbilityError,
      maxAbilityError,
    },
    passed,
  };
}

// ── Performance Generation ───────────────────────────────

/**
 * Generate synthetic performance based on user profile and current state.
 */
function generatePerformance(
  user: SyntheticUser,
  _state: AbilityState,
  session: number,
  _trial: number,
): PerformanceScore {
  // Base accuracy from true ability
  let accuracy = user.trueAbility / 10;

  // Add learning effect (improves over time)
  const learningEffect = user.learningRate * session;
  accuracy += learningEffect;

  // Add variability
  const noise = (Math.random() - 0.5) * user.variability;
  accuracy += noise;

  // Clamp to 0–1
  accuracy = Math.max(0, Math.min(1, accuracy));

  // RT based on accuracy (inverse relationship with noise)
  const baseRt = 1000 + (1 - accuracy) * 2000;
  const rtNoise = (Math.random() - 0.5) * 500;
  const rt = Math.max(200, Math.min(5000, baseRt + rtNoise));

  // Consistency based on variability
  const consistency = 1 - user.variability;

  // Compute composite score
  const score = accuracy * 0.6 + (1 - rt / 5000) * 0.25 + consistency * 0.15;

  return {
    score: Math.max(0, Math.min(1, score)),
    accuracyComponent: accuracy,
    speedComponent: 1 - rt / 5000,
    consistencyComponent: consistency,
    usable: true,
  };
}

// ── Validation Functions ─────────────────────────────────

/**
 * Validate simulation results against expected behavior.
 */
export function validateSimulation(report: SimulationReport): string[] {
  const issues: string[] = [];

  // Check convergence rate
  if (report.summary.convergenceRate < 0.7) {
    issues.push(`Low convergence rate: ${(report.summary.convergenceRate * 100).toFixed(1)}%`);
  }

  // Check average ability error
  if (report.summary.averageAbilityError > 2.0) {
    issues.push(`High average ability error: ${report.summary.averageAbilityError.toFixed(2)}`);
  }

  // Check individual users
  for (const [name, result] of Object.entries(report.results)) {
    if (result.abilityError > 3.0) {
      issues.push(`${name}: ability error too high (${result.abilityError.toFixed(2)})`);
    }
    if (result.finalUncertainty > 2.0 && result.states.length >= 10) {
      issues.push(`${name}: uncertainty still high after 10+ sessions`);
    }
  }

  return issues;
}
