import type { InputEvent } from "@cog/schemas";
import type { GameContext, GameSummary } from "@cog/game-core";
import { BaseGame, createRng } from "@cog/game-core";
import {
  getDifficultyConfig,
  validateConfig,
  generateSequence,
  type LighthouseKeeperConfig,
} from "./difficulty.js";

export const GAME_KEY = "lighthouse_keeper" as const;
export const GAME_VERSION = "0.1.0" as const;

/** Game phases for the state machine */
export type LKPhase =
  | "idle"
  | "practice"
  | "countdown"
  | "showing" // beam flashes the sequence
  | "waiting" // keeper repeats on the lantern panes
  | "feedback"
  | "paused"
  | "finished";

/** State for the renderer */
export interface LKRenderState {
  phase: LKPhase;
  sequence: number[];
  tappedIndices: number[];
  showSequence: boolean;
  feedbackCorrect: boolean | null;
  feedbackMessage: string;
  /** Pause-adjusted ms since the sequence started — drives the beam sweep */
  sequenceElapsedMs: number;
  trialNumber: number;
  totalTrials: number;
  isPractice: boolean;
  score: number;
  flashMs: number;
  patienceMs: number;
}

/**
 * Lighthouse Keeper (Penjaga Mercusuar) game implementation.
 *
 * Mechanic:
 * 1. The lighthouse beam sweeps the four coloured panes; a sequence of
 *    pane colours flashes (stimulus_shown → stimulus_hidden).
 * 2. The keeper repeats the exact sequence by tapping the panes.
 * 3. Auto-submits once the sequence length is rebuilt; patience timeout
 *    counts as an omission.
 *
 * @see docs/06_GAME_DESIGN.md — Flagship 4: Lighthouse Keeper
 */
export class LighthouseKeeperGame extends BaseGame {
  readonly key = GAME_KEY;
  readonly version = GAME_VERSION;

  private lkPhase: LKPhase = "idle";
  private gameMode: "practice" | "countdown" | "playing" | "finished" = "practice";
  private config: LighthouseKeeperConfig = {
    seqLength: 3,
    flashMs: 900,
    patienceMs: 14000,
  };
  private rng: () => number = () => 0;

  // Trial state
  private sequence: number[] = [];
  private tappedIndices: number[] = [];
  private showSequence = false;
  private feedbackCorrect: boolean | null = null;
  private feedbackMessage = "";
  private sequenceStartMs = 0;
  private responseStartMs = 0;
  private clockSkew = 0;
  private pauseAtMs = 0;
  private currentTrialId = "";
  private isCurrentPracticeTrial = false;

  // Tracking
  private practiceCount = 0;
  private scoredCount = 0;
  private maxTrials = 12;
  private score = 0;

  // Pause state
  private pausedPhase: LKPhase = "idle";

  // ── Config ──────────────────────────────────────────────

  getConfig(difficulty: number): Record<string, unknown> {
    return getDifficultyConfig(difficulty) as unknown as Record<string, unknown>;
  }

  validateConfig(config: Record<string, unknown>): void {
    validateConfig(config as unknown as LighthouseKeeperConfig);
  }

  // ── Lifecycle ───────────────────────────────────────────

  protected onStart(context: GameContext): void {
    this.config = getDifficultyConfig(context.difficulty) as LighthouseKeeperConfig;
    this.rng = createRng(context.seed);
    this.maxTrials = context.maxTrials ?? 12;
    this.lkPhase = context.practiceTrials > 0 ? "practice" : "countdown";
    this.gameMode = context.practiceTrials > 0 ? "practice" : "countdown";
    this.score = 0;
    this.clockSkew = 0;

    this.beginTrial();
  }

  protected onInput(input: InputEvent): void {
    if (input.type !== "pointer_down" && input.type !== "touch") return;
    if (this.lkPhase !== "waiting") return;

    const payload = (input as Record<string, unknown>).cellIndex;
    if (typeof payload !== "number") return;
    const pane = Math.floor(payload);
    if (pane < 0 || pane > 3) return;

    this.handlePaneTap(pane);
  }

  pause(): void {
    if (this.lkPhase === "idle" || this.lkPhase === "finished" || this.lkPhase === "paused") return;
    this.pauseAtMs = performance.now();
    this.pausedPhase = this.lkPhase;
    this.lkPhase = "paused";
    this.freezePausableTimers();
  }

  resume(): void {
    if (this.lkPhase !== "paused") return;
    this.clockSkew += performance.now() - this.pauseAtMs;
    this.lkPhase = this.pausedPhase;
    this.thawPausableTimers();
  }

  protected onPause(): void {}
  protected onResume(): void {}

  protected onFinish(): GameSummary {
    this.clearTimers();
    this.lkPhase = "finished";

    return {
      gameKey: this.key,
      gameVersion: this.version,
      config: this.config as unknown as Record<string, unknown>,
      totalTrials: this.trials.totalTrials,
      validTrials: this.trials.scoredTrialCount,
      accuracy: this.trials.accuracy,
      medianRtMs: this.trials.correctRts.length > 0 ? median(this.trials.correctRts) : undefined,
      meanRtMs:
        this.trials.correctRts.length > 0
          ? this.trials.correctRts.reduce((a, b) => a + b, 0) / this.trials.correctRts.length
          : undefined,
      rtVariability: this.trials.correctRts.length > 1 ? stdDev(this.trials.correctRts) : undefined,
      omissionErrors: this.trials.omissionErrors,
      commissionErrors: this.trials.commissionErrors,
      qualityFlags: this.trials.allQualityFlags,
    };
  }

  getPhase() {
    if (this.lkPhase === "idle") return "idle";
    if (this.lkPhase === "paused") return "paused";
    return this.gameMode;
  }

  // ── Render state ────────────────────────────────────────

  getRenderState(): Record<string, unknown> {
    return {
      phase: this.lkPhase,
      sequence: this.sequence,
      tappedIndices: this.tappedIndices,
      showSequence: this.showSequence,
      feedbackCorrect: this.feedbackCorrect,
      feedbackMessage: this.feedbackMessage,
      sequenceElapsedMs:
        this.lkPhase === "showing"
          ? Math.max(0, performance.now() - this.sequenceStartMs - this.clockSkew)
          : 0,
      trialNumber: this.scoredCount + this.practiceCount,
      totalTrials: this.maxTrials,
      isPractice: this.gameMode === "practice",
      score: this.score,
      flashMs: this.config.flashMs,
      patienceMs: this.config.patienceMs,
    } satisfies LKRenderState;
  }

  // ── Trial logic ─────────────────────────────────────────

  private beginTrial(): void {
    this.sequence = generateSequence(this.config, this.rng);
    this.tappedIndices = [];
    this.showSequence = true;
    this.feedbackCorrect = null;
    this.feedbackMessage = "";

    const isPractice = this.gameMode === "practice";
    this.isCurrentPracticeTrial = isPractice;
    const exposureMs = this.config.seqLength * this.config.flashMs;
    const trial = this.trials.startTrial({ isPractice, exposureMs });
    this.currentTrialId = trial.trialId;

    this.emitTrialStarted(trial.trialId, {
      targetCount: this.sequence.length,
      exposureMs,
      seed: Math.round(this.rng() * 100000),
    });

    this.lkPhase = "showing";
    this.sequenceStartMs = performance.now();
    this.emit("stimulus_shown", { trialId: trial.trialId });

    // After the full sequence has flashed, open the repeat window.
    this.armTimer("exposure", exposureMs, () => {
      this.showSequence = false;
      this.trials.markStimulusHidden();
      this.lkPhase = "waiting";
      this.responseStartMs = performance.now();
      this.emit("stimulus_hidden", { trialId: trial.trialId });

      this.armTimer("deadline", this.config.patienceMs, () => {
        this.handleTimeout();
      });
    });
  }

  private handlePaneTap(pane: number): void {
    this.tappedIndices.push(pane);

    if (pane !== this.sequence[this.tappedIndices.length - 1]) {
      // Wrong pane → commission, kind feedback.
      this.finishTrial(false, "Ups, pancaran itu beda — coba ingat lagi ya!");
      return;
    }

    // Correct so far — auto-submit once the full sequence is rebuilt.
    if (this.tappedIndices.length >= this.sequence.length) {
      this.finishTrial(true, "Pancaran pas! Kapal aman berlayar!");
    }
  }

  private finishTrial(correct: boolean, message: string): void {
    if (this.lkPhase !== "waiting") return;
    this.clearTimers();
    this.lkPhase = "feedback";
    this.feedbackCorrect = correct;
    this.feedbackMessage = message;

    const rt = Math.round(performance.now() - this.responseStartMs);

    this.trials.respond(correct, {
      selectedCells: [...this.tappedIndices],
      correctCells: [...this.sequence],
      reactionTimeMs: rt,
    });
    this.emitResponse(this.currentTrialId, {
      selectedCells: [...this.tappedIndices],
      correctCells: [...this.sequence],
      reactionTimeMs: rt,
      correct,
    });

    if (correct) this.score++;

    this.armTimer("feedback", 900, () => {
      this.trials.endTrial();
      this.nextTrial();
    });
  }

  private handleTimeout(): void {
    if (this.lkPhase !== "waiting") return;

    this.clearTimers();
    this.lkPhase = "feedback";
    this.feedbackCorrect = false;
    this.feedbackMessage = "Kapalnya sudah jauh — pancaran belum diulang. Coba lagi ya!";

    // Deliberately no trials.respond(): the tracker records an omission.
    this.emit("timeout", { trialId: this.currentTrialId });

    this.armTimer("feedback", 900, () => {
      this.trials.endTrial();
      this.nextTrial();
    });
  }

  private nextTrial(): void {
    this.feedbackCorrect = null;
    this.feedbackMessage = "";
    this.tappedIndices = [];

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
        this.lkPhase = "finished";
        return;
      }
    }

    this.armTimer("intermission", 500, () => {
      this.beginTrial();
    });
  }

  private clearTimers(): void {
    this.clearAllPausableTimers();
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