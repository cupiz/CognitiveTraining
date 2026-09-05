import type { InputEvent } from "@cog/schemas";
import type { GameContext, GameSummary } from "@cog/game-core";
import { BaseGame, createRng } from "@cog/game-core";
import { getDifficultyConfig, validateConfig, generateTrial, type QuickMatchConfig } from "./difficulty.js";

export const GAME_KEY = "quick_match" as const;
export const GAME_VERSION = "1.0.0" as const;

/** Game phases for the state machine */
type QMPhase =
  | "idle"
  | "practice"
  | "countdown"
  | "preview"       // Showing the target stimulus
  | "matching"      // Options displayed, waiting for user selection
  | "feedback"      // Brief feedback after response
  | "paused"
  | "finished";

/** State for the renderer */
export interface QMRenderState {
  phase: QMPhase;
  /** The target stimulus to match */
  targetStimulus: string | null;
  /** Array of option stimuli */
  options: string[];
  /** Index of the correct option (-1 if not set) */
  targetIndex: number;
  /** Index of the user's selected option (-1 if none) */
  selectedIndex: number;
  /** Whether the user responded correctly */
  responseCorrect: boolean | null;
  /** Feedback message */
  feedbackMessage: string;
  /** Trial number */
  trialNumber: number;
  /** Total trials */
  totalTrials: number;
  /** Whether in practice mode */
  isPractice: boolean;
  /** Current score */
  score: number;
  /** Running stats */
  correctCount: number;
  incorrectCount: number;
  timeoutCount: number;
}

/**
 * Quick Match game implementation.
 *
 * Mechanic:
 * 1. A target stimulus appears briefly (preview)
 * 2. Multiple options appear, user must select the matching one
 * 3. Difficulty scales: fewer options, shorter preview, more distractors
 *
 * Metrics:
 * - correct RT (reaction time for correct matches)
 * - incorrect RT
 * - accuracy
 * - throughput (correct responses per second)
 */
export class QuickMatchGame extends BaseGame {
  readonly key = GAME_KEY;
  readonly version = GAME_VERSION;

  private qmPhase: QMPhase = "idle";
  private gameMode: "practice" | "countdown" | "playing" | "finished" = "practice";
  private config: QuickMatchConfig = { optionsCount: 3, presentationTimeMs: 2000, distractorCount: 1, responseDeadlineMs: 4500 };
  private rng: () => number = () => 0;

  // Trial state
  private targetStimulus: string | null = null;
  private options: string[] = [];
  private targetIndex = -1;
  private selectedIndex = -1;
  private responded = false;
  private responseCorrect: boolean | null = null;
  private feedbackMessage = "";

  // Timers
  private previewTimer: ReturnType<typeof setTimeout> | null = null;
  private deadlineTimer: ReturnType<typeof setTimeout> | null = null;
  private feedbackTimer: ReturnType<typeof setTimeout> | null = null;
  private intermissionTimer: ReturnType<typeof setTimeout> | null = null;

  // Pause state
  private pausedPhase: QMPhase = "idle";

  // Tracking
  private practiceCount = 0;
  private scoredCount = 0;
  private maxTrials = 20;
  private score = 0;
  private responseStartMs = 0;
  private isCurrentPracticeTrial = false;

  // Metrics for summary
  private correctRts: number[] = [];
  private allRts: number[] = [];
  private correctCount = 0;
  private incorrectCount = 0;
  private timeoutCount = 0;

  // ── Config ──────────────────────────────────────────────

  getConfig(difficulty: number): Record<string, unknown> {
    return getDifficultyConfig(difficulty) as unknown as Record<string, unknown>;
  }

  validateConfig(config: Record<string, unknown>): void {
    validateConfig(config as unknown as QuickMatchConfig);
  }

  // ── Lifecycle ───────────────────────────────────────────

  protected onStart(context: GameContext): void {
    this.config = getDifficultyConfig(context.difficulty) as QuickMatchConfig;
    this.rng = createRng(context.seed);
    this.maxTrials = context.maxTrials ?? 20;
    this.correctRts = [];
    this.allRts = [];
    this.correctCount = 0;
    this.incorrectCount = 0;
    this.timeoutCount = 0;
    this.score = 0;
    this.qmPhase = context.practiceTrials > 0 ? "practice" : "countdown";
    this.gameMode = context.practiceTrials > 0 ? "practice" : "countdown";

    this.beginTrial();
  }

  protected onInput(input: InputEvent): void {
    if (this.qmPhase !== "matching") return;
    if (this.responded) return;

    if (input.type === "pointer_down" || input.type === "touch") {
      // The renderer injects cellIndex via GameShell's onCellTap
      const idx = (input as Record<string, unknown>).cellIndex ?? (input as Record<string, unknown>).optionIndex;
      if (typeof idx === "number" && idx >= 0 && idx < this.options.length) {
        this.handleSelection(idx);
      }
    }
  }

  pause(): void {
    if (this.qmPhase === "idle" || this.qmPhase === "finished" || this.qmPhase === "paused") return;
    this.pausedPhase = this.qmPhase;
    this.qmPhase = "paused";
    this.freezePausableTimers();
  }

  resume(): void {
    if (this.qmPhase !== "paused") return;
    this.qmPhase = this.pausedPhase;
    this.thawPausableTimers();
  }

  protected onPause(): void {}
  protected onResume(): void {}

  protected onFinish(): GameSummary {
    this.clearTimers();
    this.qmPhase = "finished";

    const medianRt = this.correctRts.length > 0 ? median(this.correctRts) : undefined;
    const meanRt = this.correctRts.length > 0 ? this.correctRts.reduce((a, b) => a + b, 0) / this.correctRts.length : undefined;
    const rtVar = this.correctRts.length > 1 ? stdDev(this.correctRts) : undefined;

    const totalScored = this.correctCount + this.incorrectCount + this.timeoutCount;
    const accuracy = totalScored > 0 ? this.correctCount / totalScored : 0;

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
      omissionErrors: this.timeoutCount,
      commissionErrors: this.incorrectCount,
      qualityFlags: this.trials.allQualityFlags,
    };
  }

  getPhase() {
    if (this.qmPhase === "idle") return "idle";
    if (this.qmPhase === "paused") return "paused";
    return this.gameMode;
  }

  // ── Render state ────────────────────────────────────────

  getRenderState(): Record<string, unknown> {
    return {
      phase: this.qmPhase,
      targetStimulus: this.targetStimulus,
      options: this.options,
      targetIndex: this.targetIndex,
      selectedIndex: this.selectedIndex,
      responseCorrect: this.responseCorrect,
      feedbackMessage: this.feedbackMessage,
      trialNumber: this.scoredCount + this.practiceCount,
      totalTrials: this.maxTrials,
      isPractice: this.gameMode === "practice",
      score: this.score,
      correctCount: this.correctCount,
      incorrectCount: this.incorrectCount,
      timeoutCount: this.timeoutCount,
    } satisfies QMRenderState;
  }

  // ── Trial logic ─────────────────────────────────────────

  private beginTrial(): void {
    const trial = generateTrial(this.config, this.rng);
    this.targetStimulus = trial.target;
    this.options = trial.options;
    this.targetIndex = trial.targetIndex;
    this.selectedIndex = -1;
    this.responded = false;
    this.responseCorrect = null;
    this.feedbackMessage = "";

    const isPractice = this.gameMode === "practice";
    this.isCurrentPracticeTrial = isPractice;
    const trialRecord = this.trials.startTrial({
      isPractice,
      exposureMs: this.config.presentationTimeMs,
    });

    // Emit trial_started
    this.emitTrialStarted(trialRecord.trialId, {
      optionsCount: this.config.optionsCount,
      presentationTimeMs: this.config.presentationTimeMs,
      distractorCount: this.config.distractorCount,
      targetStimulus: trial.target,
      seed: Math.round(this.rng() * 100000),
    });

    // Preview phase: show target briefly
    this.qmPhase = "preview";
    this.armTimer("preview", this.config.presentationTimeMs, () => {
      // Transition to matching phase
      this.qmPhase = "matching";
      this.responseStartMs = performance.now();

      // Emit stimulus_shown (options are now visible)
      this.emit("stimulus_shown", { trialId: trialRecord.trialId });

      // Start response deadline
      this.armTimer("deadline", this.config.responseDeadlineMs, () => {
        this.handleTimeout();
      });
    });
  }

  private handleSelection(optionIndex: number): void {
    if (this.qmPhase !== "matching" || this.responded) return;

    this.responded = true;
    this.clearTimers();

    this.selectedIndex = optionIndex;
    const isCorrect = optionIndex === this.targetIndex;
    const rt = Math.round(performance.now() - this.responseStartMs);

    if (isCorrect) {
      this.responseCorrect = true;
      this.feedbackMessage = "✓ Correct!";
      this.score++;
      this.correctCount++;
      this.correctRts.push(rt);
      this.allRts.push(rt);

      const trial = this.trials.completedTrials[this.trials.completedTrials.length - 1];
      if (trial) {
        this.emitResponse(trial.trialId, {
          targetStimulus: this.targetStimulus,
          selectedIndex: optionIndex,
          correctIndex: this.targetIndex,
          correct: true,
          reactionTimeMs: rt,
        });
      }
    } else {
      this.responseCorrect = false;
      this.feedbackMessage = "✗ Wrong!";
      this.incorrectCount++;
      this.allRts.push(rt);

      const trial = this.trials.completedTrials[this.trials.completedTrials.length - 1];
      if (trial) {
        this.emitResponse(trial.trialId, {
          targetStimulus: this.targetStimulus,
          selectedIndex: optionIndex,
          correctIndex: this.targetIndex,
          correct: false,
          reactionTimeMs: rt,
        });
      }
    }

    this.qmPhase = "feedback";
    this.armTimer("feedback", 600, () => {
      this.trials.endTrial();
      this.nextTrial();
    });
  }

  private handleTimeout(): void {
    if (this.qmPhase !== "matching" || this.responded) return;

    this.responded = true;
    this.clearTimers();

    this.timeoutCount++;
    this.responseCorrect = false;
    this.feedbackMessage = "⏰ Too slow!";

    const trial = this.trials.completedTrials[this.trials.completedTrials.length - 1];
    if (trial) {
      this.emitResponse(trial.trialId, {
        targetStimulus: this.targetStimulus,
        selectedIndex: -1,
        correctIndex: this.targetIndex,
        correct: false,
        timeout: true,
      });
    }

    this.qmPhase = "feedback";
    this.armTimer("feedback", 600, () => {
      this.trials.endTrial();
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
        this.qmPhase = "finished";
        return;
      }
    }

    this.armTimer("intermission", 400, () => {
      this.beginTrial();
    });
  }

  private clearTimers(): void {
    this.clearAllPausableTimers();
    if (this.previewTimer) clearTimeout(this.previewTimer);
    if (this.deadlineTimer) clearTimeout(this.deadlineTimer);
    if (this.feedbackTimer) clearTimeout(this.feedbackTimer);
    if (this.intermissionTimer) clearTimeout(this.intermissionTimer);
    this.previewTimer = null;
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
