import type { GameSummary } from "./game.js";
import type { TrialTracker } from "./trial-tracker.js";

/** Median of a numeric sample (interpolated for even lengths); undefined when empty. */
export function median(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Arithmetic mean; undefined when empty. */
export function mean(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Sample standard deviation; undefined with fewer than two samples. */
export function stdDev(values: number[]): number | undefined {
  if (values.length < 2) return undefined;
  const m = mean(values)!;
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/** Engine-specific overrides on top of the tracker-derived summary. */
export interface BuildSummaryOptions {
  /**
   * RT sample (ms) for median/mean/variability. Defaults to the tracker's
   * correct-trial RTs; pass an engine-specific sample when the game measures
   * timing itself (e.g. serve RTs on a conveyor belt).
   */
  rts?: number[];
  /** Override the tracker's accuracy (e.g. go-accuracy in stop-signal tasks). */
  accuracy?: number;
  /** Override the tracker's omission count (default: tracker omissions). */
  omissionErrors?: number;
  /** Override the tracker's commission count (default: tracker commissions). */
  commissionErrors?: number;
}

/**
 * Map a finished game's TrialTracker onto the shared GameSummary shape.
 *
 * Every engine's onFinish() routes through here so the trial accounting
 * (totalTrials / validTrials / accuracy / error counts) is written exactly
 * once — hand-rolled copies of this mapping are where the zero-metrics bug
 * class (never-ended trials, mis-counted errors) crept in.
 */
export function buildSummary(
  meta: { key: string; version: string; config: Record<string, unknown> },
  trials: TrialTracker,
  options: BuildSummaryOptions = {},
): GameSummary {
  const rts = options.rts ?? trials.correctRts;
  return {
    gameKey: meta.key,
    gameVersion: meta.version,
    config: meta.config,
    totalTrials: trials.totalTrials,
    validTrials: trials.scoredTrialCount,
    accuracy: options.accuracy ?? trials.accuracy,
    medianRtMs: median(rts),
    meanRtMs: mean(rts),
    rtVariability: stdDev(rts),
    omissionErrors: options.omissionErrors ?? trials.omissionErrors,
    commissionErrors: options.commissionErrors ?? trials.commissionErrors,
    qualityFlags: trials.allQualityFlags,
  };
}
