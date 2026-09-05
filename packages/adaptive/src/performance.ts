/**
 * Performance computation for the adaptive engine.
 *
 * Combines accuracy, speed, and consistency into a single score (0–1).
 * Filters out unusable data (too few trials, quality issues).
 *
 * @see docs/07_ADAPTIVE_ENGINE.md §4
 */

import type { PerformanceInput, PerformanceScore } from "./types.js";

// ── Constants ────────────────────────────────────────────

/** Minimum valid trials for a usable performance score */
const MIN_VALID_TRIALS = 3;

/** RT bounds for normalization (ms) */
const RT_FLOOR = 200; // Fastest plausible human RT
const RT_CEILING = 5000; // Slowest plausible engaged RT

/** Weight components */
const WEIGHT_ACCURACY = 0.6;
const WEIGHT_SPEED = 0.25;
const WEIGHT_CONSISTENCY = 0.15;

// ── Main Function ────────────────────────────────────────

/**
 * Compute a normalized performance score from trial metrics.
 *
 * @param input - Metrics from the scoring engine
 * @returns Performance score with components and usability flag
 */
export function computePerformance(input: PerformanceInput): PerformanceScore {
  // Check usability
  if (input.validTrialCount < MIN_VALID_TRIALS) {
    return {
      score: 0,
      accuracyComponent: 0,
      speedComponent: 0,
      consistencyComponent: 0,
      usable: false,
      unusableReason: `Insufficient trials: ${input.validTrialCount} < ${MIN_VALID_TRIALS}`,
    };
  }

  // Check for critical quality flags
  const criticalFlags = input.qualityFlags.filter((f) =>
    ["IMPOSSIBLE_RT", "DEVICE_CLOCK_ANOMALY"].includes(f.code),
  );
  if (criticalFlags.length > input.validTrialCount * 0.5) {
    return {
      score: 0,
      accuracyComponent: 0,
      speedComponent: 0,
      consistencyComponent: 0,
      usable: false,
      unusableReason: `Too many quality flags: ${criticalFlags.length}/${input.validTrialCount}`,
    };
  }

  // Accuracy component (0–1, already normalized)
  const accuracyComponent = clamp(input.accuracy, 0, 1);

  // Speed component (normalized RT)
  const speedComponent = computeSpeedComponent(input.medianRtMs);

  // Consistency component (inverse of RT variability)
  const consistencyComponent = computeConsistencyComponent(
    input.rtVariability,
    input.meanRtMs,
  );

  // Combined score
  const score =
    WEIGHT_ACCURACY * accuracyComponent +
    WEIGHT_SPEED * speedComponent +
    WEIGHT_CONSISTENCY * consistencyComponent;

  return {
    score: clamp(score, 0, 1),
    accuracyComponent,
    speedComponent,
    consistencyComponent,
    usable: true,
  };
}

// ── Speed Component ──────────────────────────────────────

/**
 * Normalize reaction time to 0–1 where 1 = fastest.
 * Uses inverse mapping: faster RT → higher score.
 */
function computeSpeedComponent(medianRtMs: number): number {
  if (medianRtMs <= 0) return 0;

  // Map RT to 0–1 using inverse normalization
  // RT_FLOOR → 1.0, RT_CEILING → 0.0
  const normalized = 1 - (medianRtMs - RT_FLOOR) / (RT_CEILING - RT_FLOOR);
  return clamp(normalized, 0, 1);
}

// ── Consistency Component ────────────────────────────────

/**
 * Compute consistency from RT variability.
 * Low variability relative to mean = high consistency.
 */
function computeConsistencyComponent(
  rtVariability: number,
  meanRtMs: number,
): number {
  if (meanRtMs <= 0 || rtVariability <= 0) return 0.5; // Default for no data

  // Coefficient of variation (lower = more consistent)
  const cv = rtVariability / meanRtMs;

  // Map CV to consistency score
  // CV = 0 → 1.0 (perfectly consistent)
  // CV = 1 → 0.0 (highly variable)
  const consistency = 1 - cv;
  return clamp(consistency, 0, 1);
}

// ── Helpers ──────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
