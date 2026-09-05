import type { InputEvent } from "@cog/schemas";
import type { GameContext, GameSummary } from "@cog/game-core";
import { BaseGame, createRng } from "@cog/game-core";
import { getDifficultyConfig, validateConfig, generateSequence, type TargetWatchConfig } from "./difficulty.js";

export const GAME_KEY = "target_watch" as const;
export const GAME_VERSION = "1.0.0" as const;

/** Game phases for the state machine */
type TWPhase =
  | "idle"
  | "practice"
  | "countdown"
  | "showing"      // Showing a stimulus symbol
  | "waiting"      // Waiting for user response (tap or inhibit)
  | "intermission" // Brief pause between stimuli
  | "feedback"     // Brief feedback after trial
  | "paused"
  | "finished";

/** State for the renderer */
export interface TWRenderState {
  phase: TWPhase;
  /** Current stimulus being shown (null if between stimuli) */
  currentStimulus: string | null;
  /** Index of current stimulus in the sequence */
  stimulusIndex: number;
  /** Total stimuli in this trial */
  totalStimuli: number;
  /** Whether the current stimulus is the target */
  isTarget: boolean;
  /** Whether user has responded to current stimulus */
  responded: boolean;
  /** Whether user response was correct (hit or correct inhibition) */
  responseCorrect: boolean | null;
  /** Feedback message */
  feedbackMessage: string;
  /** Trial number */
  trialNumber: number;
  /** Total trials */
  totalTrials: number;
  /** Whether in practice mode */
  isPractice: boolean;
  /** Current score (hits) */
  score: number;
  /** Time remaining for current stimulus response (ms) */
  timeRemainingMs: number;
  /** Running stats */
  hits: number;
  misses: number;
  falseAlarms: number;
  /** Target symbol */
  targetSymbol: string;
}

/**
 * Target Watch game implementation.
 *
 * Mechanic:
 * 1. Symbols appear sequentially, one at a time
 * 2. User must tap only when they see the target symbol
 * 3. Non-targets require inhibition (don't tap)
 * 4. Score = correct responses (hits + correct inhibitions)
 *
 * Metrics:
 * - hits (tapped on target)
 * - misses (no tap on target)
 * - false alarms (tapped on non-target)
 * - median RT for hits
 * - RT variability
 * - lapse count (very slow correct responses)
 */
export class TargetWatchGame extends BaseGame {
  readonly key = GAME_KEY;
  readonly version = GAME_VERSION;

  private twPhase: TWPhase = "idle";
  private gameMode: "practice" | "countdown" | "playing" | "finished" = "practice";
  private config: TargetWatchConfig = { symbolsPerTrial: 10, targetSymbol: "★", distractorSymbols: ["○", "□"], interStimulusMs: 2000, responseDeadlineMs: 2500, targetProportion: 0.3 };
  private rng: () => number = () => 0;

  // Trial state
  private sequence: string[] = [];
  private stimulusIndex = 0;
  private responded = false;
  private responseCorrect: boolean | null = null;
  private feedbackMessage = "";

  // Timers
  private stimulusTimer: ReturnType<typeof setTimeout> | null = null;
  private deadlineTimer: ReturnType<typeof setTimeout> | null = null;
  private feedbackTimer: ReturnType<typeof setTimeout> | null = null;
  private intermissionTimer: ReturnType<typeof setTimeout> | null = null;

  // Pause state
  private pausedPhase: TWPhase = "idle";

  // Tracking
  private practiceCount = 0;
  private scoredCount = 0;
  private maxTrials = 10;
  private score = 0;
  private responseStartMs = 0;
  private isCurrentPracticeTrial = false;

  // Metrics for summary
  private hits = 0;
  private misses = 0;
  private falseAlarms = 0;
  private hitRts: number[] = [];
  private allCorrectRts: number[] = [];

  // ── Config ──────────────────────────────────────────────

  getConfig(difficulty: number): Record<string, unknown> {
    return getDifficultyConfig(difficulty) as unknown as Record<string, unknown>;
  }

  validateConfig(config: Record<string, unknown>): void {
    validateConfig(config as unknown as TargetWatchConfig);
  }

  // ── Lifecycle ───────────────────────────────────────────

  protected onStart(context: GameContext): void {
    this.config = getDifficultyConfig(context.difficulty) as TargetWatchConfig;
    this.rng = createRng(context.seed);
    this.maxTrials = context.maxTrials ?? 10;
    this.hits = 0;
    this.misses = 0;
    this.falseAlarms = 0;
    this.hitRts = [];
    this.allCorrectRts = [];
    this.score = 0;
    this.twPhase = context.practiceTrials > 0 ? "practice" : "countdown";
    this.gameMode = context.practiceTrials > 0 ? "practice" : "countdown";

    this.beginTrial();
  }

  protected onInput(input: InputEvent): void {
    if (this.twPhase !== "waiting") return;
    if (this.responded) return; // No double-submit

    if (input.type === "pointer_down" || input.type === "touch") {
      this.handleTap();
    }
  }

  pause(): void {
    if (this.twPhase === "idle" || this.twPhase === "finished" || this.twPhase === "paused") return;
    this.pausedPhase = this.twPhase;
    this.twPhase = "paused";
    this.freezePausableTimers();
  }

  resume(): void {
    if (this.twPhase !== "paused") return;
    this.twPhase = this.pausedPhase;
    this.thawPausableTimers();
  }

  protected onPause(): void {}
  protected onResume(): void {}

  protected onFinish(): GameSummary {
    this.clearTimers();
    this.twPhase = "finished";

    const medianRt = this.hitRts.length > 0 ? median(this.hitRts) : undefined;
    const meanRt = this.hitRts.length > 0 ? this.hitRts.reduce((a, b) => a + b, 0) / this.hitRts.length : undefined;
    const rtVar = this.hitRts.length > 1 ? stdDev(this.hitRts) : undefined;

    const totalScored = this.hits + this.misses + this.falseAlarms;
    const accuracy = totalScored > 0 ? (this.hits + (totalScored - this.hits - this.falseAlarms)) / totalScored : 0;

    return {
      gameKey: this.key,
      gameVersion: this.version,
      config: this.config as unknown as Record<string, unknown>,
      totalTrials: this.trials.totalTrials,
      validTrials: this.trials.scoredTrialCount,
      accuracy,
      medianRtMs: medianRt,
      meanRtMs: meanRt,
      rtVariability: rtVar,
      omissionErrors: this.misses,
      commissionErrors: this.falseAlarms,
      qualityFlags: this.trials.allQualityFlags,
    };
  }

  getPhase() {
    if (this.twPhase === "idle") return "idle";
    if (this.twPhase === "paused") return "paused";
    return this.gameMode;
  }

  // ── Render state ────────────────────────────────────────

  getRenderState(): Record<string, unknown> {
    const currentStimulus = this.stimulusIndex < this.sequence.length
      ? this.sequence[this.stimulusIndex]
      : null;

    return {
      phase: this.twPhase,
      currentStimulus,
      stimulusIndex: this.stimulusIndex,
      totalStimuli: this.config.symbolsPerTrial,
      isTarget: currentStimulus === this.config.targetSymbol,
      responded: this.responded,
      responseCorrect: this.responseCorrect,
      feedbackMessage: this.feedbackMessage,
      trialNumber: this.scoredCount + this.practiceCount,
      totalTrials: this.maxTrials,
      isPractice: this.gameMode === "practice",
      score: this.score,
      timeRemainingMs: 0,
      hits: this.hits,
      misses: this.misses,
      falseAlarms: this.falseAlarms,
      targetSymbol: this.config.targetSymbol,
    } satisfies TWRenderState;
  }

  // ── Trial logic ─────────────────────────────────────────

  private beginTrial(): void {
    this.sequence = generateSequence(this.config, this.rng);
    this.stimulusIndex = 0;
    this.responded = false;
    this.responseCorrect = null;
    this.feedbackMessage = "";

    const isPractice = this.gameMode === "practice";
    this.isCurrentPracticeTrial = isPractice;
    const trial = this.trials.startTrial({
      isPractice,
      exposureMs: this.config.interStimulusMs,
    });

    // Emit trial_started
    this.emitTrialStarted(trial.trialId, {
      symbolsPerTrial: this.config.symbolsPerTrial,
      targetSymbol: this.config.targetSymbol,
      interStimulusMs: this.config.interStimulusMs,
      targetProportion: this.config.targetProportion,
      seed: Math.round(this.rng() * 100000),
    });

    this.twPhase = "showing";
    this.showNextStimulus();
  }

  private showNextStimulus(): void {
    if (this.stimulusIndex >= this.sequence.length) {
      this.endTrial();
      return;
    }

    this.responded = false;
    this.responseCorrect = null;
    this.twPhase = "showing";

    // Brief display period (500ms) before accepting input
    this.armTimer("showing", 500, () => {
      this.twPhase = "waiting";
      this.responseStartMs = performance.now();

      // Start response deadline
      this.armTimer("deadline", this.config.responseDeadlineMs, () => {
        this.handleTimeout();
      });
    });
  }

  private handleTap(): void {
    if (this.twPhase !== "waiting" || this.responded) return;

    this.responded = true;
    this.clearTimers();

    const isTarget = this.sequence[this.stimulusIndex] === this.config.targetSymbol;
    const rt = Math.round(performance.now() - this.responseStartMs);

    if (isTarget) {
      // Hit — correct tap on target
      this.responseCorrect = true;
      this.feedbackMessage = "✓ Hit!";
      this.score++;
      this.hits++;
      this.hitRts.push(rt);
      this.allCorrectRts.push(rt);

      // Emit response event
      const trial = this.trials.completedTrials[this.trials.completedTrials.length - 1];
      if (trial) {
        this.emitResponse(trial.trialId, {
          stimulusIndex: this.stimulusIndex,
          stimulus: this.sequence[this.stimulusIndex],
          response: "tap",
          correct: true,
          reactionTimeMs: rt,
          outcome: "hit",
        });
      }
    } else {
      // False alarm — tapped on non-target
      this.responseCorrect = false;
      this.feedbackMessage = "✗ False alarm!";
      this.falseAlarms++;

      const trial = this.trials.completedTrials[this.trials.completedTrials.length - 1];
      if (trial) {
        this.emitResponse(trial.trialId, {
          stimulusIndex: this.stimulusIndex,
          stimulus: this.sequence[this.stimulusIndex],
          response: "tap",
          correct: false,
          reactionTimeMs: rt,
          outcome: "false_alarm",
        });
      }
    }

    // Move to next stimulus after brief feedback
    this.armTimer("feedback", 400, () => {
      this.stimulusIndex++;
      this.showNextStimulus();
    });
  }

  private handleTimeout(): void {
    if (this.twPhase !== "waiting" || this.responded) return;

    this.responded = true;
    this.clearTimers();

    const isTarget = this.sequence[this.stimulusIndex] === this.config.targetSymbol;

    if (isTarget) {
      // Miss — no tap on target
      this.responseCorrect = false;
      this.feedbackMessage = "✗ Miss!";
      this.misses++;

      const trial = this.trials.completedTrials[this.trials.completedTrials.length - 1];
      if (trial) {
        this.emitResponse(trial.trialId, {
          stimulusIndex: this.stimulusIndex,
          stimulus: this.sequence[this.stimulusIndex],
          response: "none",
          correct: false,
          timeout: true,
          outcome: "miss",
        });
      }
    } else {
      // Correct rejection — no tap on non-target
      this.responseCorrect = true;
      this.feedbackMessage = "✓ Good!";
      this.allCorrectRts.push(this.config.responseDeadlineMs);

      const trial = this.trials.completedTrials[this.trials.completedTrials.length - 1];
      if (trial) {
        this.emitResponse(trial.trialId, {
          stimulusIndex: this.stimulusIndex,
          stimulus: this.sequence[this.stimulusIndex],
          response: "none",
          correct: true,
          timeout: true,
          outcome: "correct_rejection",
        });
      }
    }

    // Move to next stimulus after brief feedback
    this.armTimer("feedback", 400, () => {
      this.stimulusIndex++;
      this.showNextStimulus();
    });
  }

  private endTrial(): void {
    this.twPhase = "feedback";
    this.feedbackMessage = `Trial complete! Score: ${this.score}`;

    this.trials.endTrial();

    // Brief intermission before next trial
    this.armTimer("intermission", 1000, () => {
      this.nextTrial();
    });
  }

  private nextTrial(): void {
    if (this.isCurrentPracticeTrial) {
      this.practiceCount++;
      this.isCurrentPracticeTrial = false;
      if (this.practiceCount >= (this.context.practiceTrials ?? 0)) {
        this.gameMode = "countdown";
        this.armTimer("countdownTransition", 1500, () => {
          this.gameMode = "playing";
          this.beginTrial();
        });
        return;
      }
    } else {
      this.scoredCount++;
      if (this.scoredCount >= this.maxTrials) {
        this.gameMode = "finished";
        this.twPhase = "finished";
        return;
      }
    }

    this.armTimer("intermission", 500, () => {
      this.beginTrial();
    });
  }

  private clearTimers(): void {
    this.clearAllPausableTimers();
    if (this.stimulusTimer) clearTimeout(this.stimulusTimer);
    if (this.deadlineTimer) clearTimeout(this.deadlineTimer);
    if (this.feedbackTimer) clearTimeout(this.feedbackTimer);
    if (this.intermissionTimer) clearTimeout(this.intermissionTimer);
    this.stimulusTimer = null;
    this.deadlineTimer = null;
    this.feedbackTimer = null;
    this.intermissionTimer = null;
  }


}

// ── Helpers ──────────────────────────────────────────────

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}
