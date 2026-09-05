import { now, elapsed, toMs } from "./timing.js";

/**
 * Tracks trial lifecycle for a single trial within a game.
 */
export interface TrialRecord {
  /** Unique trial ID (assigned by game) */
  trialId: string;
  /** Whether this is a practice (non-scored) trial */
  isPractice: boolean;
  /** When the trial started (performance.now()) */
  startedAt: number;
  /** When the trial ended (performance.now()), null if ongoing */
  endedAt: number | null;
  /** Duration of stimulus exposure (ms) */
  exposureMs: number;
  /** Time when stimulus was hidden (performance.now()) */
  stimulusHiddenAt: number | null;
  /** Time when user responded (performance.now()) */
  respondedAt: number | null;
  /** Whether the response was correct */
  correct: boolean | null;
  /** Game-specific response data */
  responsePayload: Record<string, unknown>;
  /** Quality flags for this trial */
  qualityFlags: string[];
}

/**
 * Collects and manages trial records within a game.
 * Provides helpers for timing and summary computation.
 */
export class TrialTracker {
  private trials: TrialRecord[] = [];
  private currentTrial: TrialRecord | null = null;
  private trialCounter = 0;

  /** Start a new trial */
  startTrial(params: { isPractice: boolean; exposureMs: number; [key: string]: unknown }): TrialRecord {
    this.trialCounter++;
    const trial: TrialRecord = {
      trialId: `t${String(this.trialCounter).padStart(3, "0")}`,
      isPractice: params.isPractice,
      startedAt: now(),
      endedAt: null,
      exposureMs: params.exposureMs,
      stimulusHiddenAt: null,
      respondedAt: null,
      correct: null,
      responsePayload: {},
      qualityFlags: [],
    };
    this.currentTrial = trial;
    this.trials.push(trial);
    return trial;
  }

  /** Mark the current trial's stimulus as hidden */
  markStimulusHidden(): void {
    if (this.currentTrial) {
      this.currentTrial.stimulusHiddenAt = now();
    }
  }

  /** Record a response on the current trial */
  respond(correct: boolean, payload: Record<string, unknown> = {}): void {
    if (!this.currentTrial) return;
    this.currentTrial.respondedAt = now();
    this.currentTrial.correct = correct;
    this.currentTrial.responsePayload = payload;
  }

  /** End the current trial (if no response was given, marks as omission) */
  endTrial(): void {
    if (!this.currentTrial) return;
    this.currentTrial.endedAt = now();

    // If no response, it's an omission
    if (this.currentTrial.respondedAt === null) {
      this.currentTrial.correct = false;
    }

    this.currentTrial = null;
  }

  /** Add a quality flag to the current trial */
  flagTrial(code: string): void {
    if (this.currentTrial) {
      this.currentTrial.qualityFlags.push(code);
    }
  }

  /** Check if there's an active trial */
  get hasActiveTrial(): boolean {
    return this.currentTrial !== null;
  }

  /** Get all completed trials */
  get completedTrials(): TrialRecord[] {
    return this.trials.filter((t) => t.endedAt !== null);
  }

  /** Get all scored (non-practice) completed trials */
  get scoredTrials(): TrialRecord[] {
    return this.completedTrials.filter((t) => !t.isPractice);
  }

  /** Get total trial count (including practice) */
  get totalTrials(): number {
    return this.trials.length;
  }

  /** Get scored trial count */
  get scoredTrialCount(): number {
    return this.scoredTrials.length;
  }

  /** Get count of practice trials */
  get practiceTrialCount(): number {
    return this.trials.filter((t) => t.isPractice).length;
  }

  /** Compute reaction times for scored correct trials */
  get correctRts(): number[] {
    return this.scoredTrials
      .filter((t) => t.correct === true && t.respondedAt !== null && t.stimulusHiddenAt !== null)
      .map((t) => toMs(elapsed(t.stimulusHiddenAt!, t.respondedAt!)));
  }

  /** Compute accuracy across scored trials */
  get accuracy(): number {
    const scored = this.scoredTrials;
    if (scored.length === 0) return 0;
    const correct = scored.filter((t) => t.correct === true).length;
    return correct / scored.length;
  }

  /** Count omission errors (no response) */
  get omissionErrors(): number {
    return this.scoredTrials.filter((t) => t.respondedAt === null).length;
  }

  /** Count commission errors (wrong response) */
  get commissionErrors(): number {
    return this.scoredTrials.filter((t) => t.respondedAt !== null && t.correct === false).length;
  }

  /** Get all quality flags from all trials */
  get allQualityFlags(): string[] {
    return this.trials.flatMap((t) => t.qualityFlags);
  }

  /** Compute median of an array of numbers */
  static median(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  /** Compute mean of an array of numbers */
  static mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /** Compute standard deviation of an array of numbers */
  static stdDev(values: number[]): number {
    if (values.length < 2) return 0;
    const m = TrialTracker.mean(values);
    const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1);
    return Math.sqrt(variance);
  }
}
