/**
 * Regression fixtures — deterministic test cases for adaptive algorithm.
 *
 * Provides fixed input/output pairs to detect algorithm regressions.
 *
 * @see docs/10_TEST_STRATEGY.md §Game simulation
 */

import type { AbilityState, PerformanceInput, PerformanceScore } from "./types.js";

// ── Fixed Performance Inputs ─────────────────────────────

export const PERFECT_PERFORMANCE: PerformanceInput = {
  accuracy: 1.0,
  medianRtMs: 500,
  meanRtMs: 520,
  rtVariability: 50,
  omissionErrors: 0,
  commissionErrors: 0,
  validTrialCount: 20,
  qualityFlags: [],
};

export const GOOD_PERFORMANCE: PerformanceInput = {
  accuracy: 0.85,
  medianRtMs: 800,
  meanRtMs: 850,
  rtVariability: 150,
  omissionErrors: 2,
  commissionErrors: 1,
  validTrialCount: 20,
  qualityFlags: [],
};

export const AVERAGE_PERFORMANCE: PerformanceInput = {
  accuracy: 0.65,
  medianRtMs: 1200,
  meanRtMs: 1300,
  rtVariability: 300,
  omissionErrors: 5,
  commissionErrors: 3,
  validTrialCount: 20,
  qualityFlags: [],
};

export const POOR_PERFORMANCE: PerformanceInput = {
  accuracy: 0.35,
  medianRtMs: 2000,
  meanRtMs: 2200,
  rtVariability: 500,
  omissionErrors: 8,
  commissionErrors: 6,
  validTrialCount: 20,
  qualityFlags: [],
};

export const TERRIBLE_PERFORMANCE: PerformanceInput = {
  accuracy: 0.1,
  medianRtMs: 3000,
  meanRtMs: 3500,
  rtVariability: 800,
  omissionErrors: 15,
  commissionErrors: 5,
  validTrialCount: 20,
  qualityFlags: [{ code: "IMPOSSIBLE_RT" }],
};

// ── Fixed Performance Scores ─────────────────────────────

export const PERFECT_SCORE: PerformanceScore = {
  score: 1.0,
  accuracyComponent: 1.0,
  speedComponent: 0.9,
  consistencyComponent: 0.95,
  usable: true,
};

export const GOOD_SCORE: PerformanceScore = {
  score: 0.82,
  accuracyComponent: 0.85,
  speedComponent: 0.75,
  consistencyComponent: 0.8,
  usable: true,
};

export const AVERAGE_SCORE: PerformanceScore = {
  score: 0.6,
  accuracyComponent: 0.65,
  speedComponent: 0.55,
  consistencyComponent: 0.6,
  usable: true,
};

export const POOR_SCORE: PerformanceScore = {
  score: 0.35,
  accuracyComponent: 0.35,
  speedComponent: 0.3,
  consistencyComponent: 0.4,
  usable: true,
};

export const USABLE_FALSE: PerformanceScore = {
  score: 0,
  accuracyComponent: 0,
  speedComponent: 0,
  consistencyComponent: 0,
  usable: false,
  unusableReason: "Insufficient trials",
};

// ── Initial States ───────────────────────────────────────

export const INITIAL_STATE: AbilityState = {
  ability: 5.0,
  uncertainty: 4.0,
  difficulty: 5.0,
  attempts: 0,
  lastUpdatedAt: "2026-01-01T00:00:00.000Z",
  algorithmVersion: "adaptive-v0.1-mvp",
};

export const LOW_ABILITY_STATE: AbilityState = {
  ability: 2.0,
  uncertainty: 2.0,
  difficulty: 2.0,
  attempts: 10,
  lastUpdatedAt: "2026-01-01T00:00:00.000Z",
  algorithmVersion: "adaptive-v0.1-mvp",
};

export const HIGH_ABILITY_STATE: AbilityState = {
  ability: 8.5,
  uncertainty: 1.0,
  difficulty: 8.0,
  attempts: 20,
  lastUpdatedAt: "2026-01-01T00:00:00.000Z",
  algorithmVersion: "adaptive-v0.1-mvp",
};

// ── Expected Outputs ─────────────────────────────────────

export interface ExpectedOutput {
  ability: number;
  uncertainty: number;
  difficulty: number;
  tolerance: number;
}

export const EXPECTED_OUTPUTS: Record<string, ExpectedOutput> = {
  "perfect_from_initial": {
    ability: 5.5,
    uncertainty: 3.5,
    difficulty: 5.5,
    tolerance: 0.5,
  },
  "good_from_initial": {
    ability: 5.3,
    uncertainty: 3.5,
    difficulty: 5.3,
    tolerance: 0.5,
  },
  "average_from_initial": {
    ability: 4.9,
    uncertainty: 3.5,
    difficulty: 4.9,
    tolerance: 0.5,
  },
  "poor_from_initial": {
    ability: 4.5,
    uncertainty: 3.5,
    difficulty: 4.5,
    tolerance: 0.5,
  },
  "perfect_from_low": {
    ability: 2.5,
    uncertainty: 1.5,
    difficulty: 2.5,
    tolerance: 0.5,
  },
  "poor_from_high": {
    ability: 8.0,
    uncertainty: 0.5,
    difficulty: 8.0,
    tolerance: 0.5,
  },
};

// ── Helper Functions ─────────────────────────────────────

/**
 * Check if actual output matches expected within tolerance.
 */
export function matchesExpected(
  actual: { ability: number; uncertainty: number; difficulty: number },
  expected: ExpectedOutput,
): boolean {
  return (
    Math.abs(actual.ability - expected.ability) <= expected.tolerance &&
    Math.abs(actual.uncertainty - expected.uncertainty) <= expected.tolerance &&
    Math.abs(actual.difficulty - expected.difficulty) <= expected.tolerance
  );
}

/**
 * Get all fixture names.
 */
export function getFixtureNames(): string[] {
  return Object.keys(EXPECTED_OUTPUTS);
}
