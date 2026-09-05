import type { InputEvent } from "@cog/schemas";
import type { GameContext, GameSummary } from "@cog/game-core";
import { BaseGame, createRng } from "@cog/game-core";
import {
  getDifficultyConfig,
  validateConfig,
  generateMenu,
  generateOrder,
  type Ingredient,
  type SpiceStallConfig,
} from "./difficulty.js";

export const GAME_KEY = "spice_stall" as const;
export const GAME_VERSION = "0.1.0" as const;

/** Game phases for the state machine */
type SSPhase =
  | "idle"
  | "practice"
  | "countdown"
  | "showing" // Order visible on the counter
  | "waiting" // Curtain down, tapping ingredients in order
  | "feedback" // Brief feedback after response
  | "paused"
  | "finished";

/** State for the renderer */
export interface SSRenderState {
  phase: SSPhase;
  menu: Ingredient[];
  order: number[];
  tappedIndices: number[];
  showOrder: boolean;
  showFeedback: boolean;
  feedbackCorrect: boolean;
  trialNumber: number;
  totalTrials: number;
  isPractice: boolean;
  score: number;
  timeLeft: number;
  patienceMs: number;
}

/**
 * Spice Stall game implementation.
 *
 * Mechanic:
 * 1. A customer order (sequence of menu indices) is shown for exposureMs
 * 2. The curtain drops; the player rebuilds the exact order by tapping
 * 3. Auto-submits when tap count reaches orderLength
 * 4. Patience timeout counts as an omission
 */
export class SpiceStallGame extends BaseGame {
  readonly key = GAME_KEY;
  readonly version = GAME_VERSION;

  private ssPhase: SSPhase = "idle";
  private gameMode: "practice" | "countdown" | "playing" | "finished" = "finished";
  private config: SpiceStallConfig = {
    orderLength: 2,
    menuSize: 4,
    exposureMs: 2500,
    patienceMs: 12000,
    similarPairs: 0,
  };
  private rng: () => number = () => 0;

  // Trial state
  private menu: Ingredient[] = [];
  private order: number[] = [];
  private tappedIndices: number[] = [];
  private currentTrialId = "";
  private showOrder = false;
  private showFeedback = false;
  private feedbackCorrect = false;
  private responseStartMs = 0;
  private isCurrentPracticeTrial = false;

  // Tracking
  private practiceCount = 0;
  private scoredCount = 0;
  private maxTrials = 12;
  private score = 0;

  // Pause state
  private pausedPhase: SSPhase = "idle";

  // ── Config ──────────────────────────────────────────────

  getConfig(difficulty: number): Record<string, unknown> {
    return getDifficultyConfig(difficulty) as unknown as Record<string, unknown>;
  }

  validateConfig(config: Record<string, unknown>): void {
    validateConfig(config as unknown as SpiceStallConfig);
  }

  // ── Lifecycle ───────────────────────────────────────────

  protected onStart(context: GameContext): void {
    this.config = getDifficultyConfig(context.difficulty) as SpiceStallConfig;
    this.rng = createRng(context.seed);
    this.maxTrials = context.maxTrials ?? 12;
    this.ssPhase = context.practiceTrials > 0 ? "practice" : "countdown";
    this.gameMode = context.practiceTrials > 0 ? "practice" : "countdown";

    this.beginTrial();
  }

  protected onInput(input: InputEvent): void {
    if (this.ssPhase === "showing" || this.ssPhase === "feedback") return;

    if (input.type === "pointer_down" || input.type === "touch") {
      this.handleIngredientTap(input);
    }
  }

  pause(): void {
    if (this.ssPhase === "idle" || this.ssPhase === "finished" || this.ssPhase === "paused") return;
    this.pausedPhase = this.ssPhase;
    this.ssPhase = "paused";
    this.freezePausableTimers();
  }

  resume(): void {
    if (this.ssPhase !== "paused") return;
    this.ssPhase = this.pausedPhase;
    this.thawPausableTimers();
  }

  protected onPause(): void {}
  protected onResume(): void {}

  protected onFinish(): GameSummary {
    this.clearTimers();
    this.ssPhase = "finished";

    const rts = this.trials.correctRts;
    const sorted = [...rts].sort((a, b) => a - b);
    const median =
      sorted.length === 0
        ? undefined
        : sorted.length % 2 === 1
          ? sorted[(sorted.length - 1) / 2]
          : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;

    return {
      gameKey: this.key,
      gameVersion: this.version,
      config: this.config as unknown as Record<string, unknown>,
      totalTrials: this.trials.totalTrials,
      validTrials: this.trials.scoredTrialCount,
      accuracy: this.trials.accuracy,
      medianRtMs: median,
      meanRtMs: rts.length > 0 ? rts.reduce((a, b) => a + b, 0) / rts.length : undefined,
      rtVariability: rts.length > 1 ? stdDev(rts) : undefined,
      omissionErrors: this.trials.omissionErrors,
      commissionErrors: this.trials.commissionErrors,
      qualityFlags: this.trials.allQualityFlags,
    };
  }

  getPhase() {
    if (this.ssPhase === "idle") return "idle";
    if (this.ssPhase === "paused") return "paused";
    return this.gameMode;
  }

  // ── Render state ────────────────────────────────────────

  getRenderState(): Record<string, unknown> {
    return {
      phase: this.ssPhase,
      menu: this.menu,
      order: this.order,
      tappedIndices: this.tappedIndices,
      showOrder: this.showOrder,
      showFeedback: this.showFeedback,
      feedbackCorrect: this.feedbackCorrect,
      trialNumber: this.scoredCount + this.practiceCount,
      totalTrials: this.maxTrials,
      isPractice: this.gameMode === "practice",
      score: this.score,
      timeLeft: 0,
      patienceMs: this.config.patienceMs,
    } satisfies SSRenderState;
  }

  // ── Trial logic ─────────────────────────────────────────

  private beginTrial(): void {
    this.menu = generateMenu(this.config, this.rng);
    this.order = generateOrder(this.config, this.rng);
    this.tappedIndices = [];
    this.showOrder = true;
    this.showFeedback = false;

    const isPractice = this.gameMode === "practice";
    this.isCurrentPracticeTrial = isPractice;
    const trial = this.trials.startTrial({
      isPractice,
      exposureMs: this.config.exposureMs,
    });
    this.currentTrialId = trial.trialId;

    // Emit trial_started
    this.emitTrialStarted(trial.trialId, {
      targetCount: this.order.length,
      exposureMs: this.config.exposureMs,
      seed: Math.round(this.rng() * 100000),
    });

    this.ssPhase = "showing";

    // After exposure, drop the curtain and open the response window.
    this.armTimer("exposure", this.config.exposureMs, () => {
      this.showOrder = false;
      this.trials.markStimulusHidden();
      this.ssPhase = "waiting";
      this.responseStartMs = performance.now();

      // Emit stimulus_hidden
      this.emit("stimulus_hidden", { trialId: trial.trialId });

      // Start the patience deadline.
      this.armTimer("deadline", this.config.patienceMs, () => {
        this.handleTimeout();
      });
    });
  }

  private handleIngredientTap(input: InputEvent): void {
    if (this.ssPhase !== "waiting") return;

    const payload = (input as Record<string, unknown>).cellIndex;
    if (typeof payload !== "number") return;
    const idx = Math.floor(payload);
    if (idx < 0 || idx >= this.menu.length) return;

    this.tappedIndices.push(idx);

    // Auto-submit once the order is fully rebuilt.
    if (this.tappedIndices.length >= this.order.length) {
      this.submitResponse();
    }
  }

  private submitResponse(): void {
    if (this.ssPhase !== "waiting") return;

    this.clearTimers();
    this.ssPhase = "feedback";

    const isCorrect =
      this.tappedIndices.length === this.order.length &&
      this.tappedIndices.every((tap, i) => tap === this.order[i]);

    const responseMs = Math.round(performance.now() - this.responseStartMs);

    // Record response
    this.trials.respond(isCorrect, {
      selectedCells: [...this.tappedIndices],
      correctCells: [...this.order],
      reactionTimeMs: responseMs,
    });

    // Emit response
    this.emitResponse(this.currentTrialId, {
      selectedCells: [...this.tappedIndices],
      correctCells: [...this.order],
      reactionTimeMs: responseMs,
      correct: isCorrect,
    });

    this.feedbackCorrect = isCorrect;
    this.showFeedback = true;
    if (isCorrect) this.score++;

    // End trial after brief feedback
    this.armTimer("feedback", 800, () => {
      this.trials.endTrial();
      this.nextTrial();
    });
  }

  private handleTimeout(): void {
    if (this.ssPhase !== "waiting") return;

    this.clearTimers();
    this.ssPhase = "feedback";

    // Patience exhausted with no complete order: omission. Deliberately no
    // trials.respond() call, so the tracker keeps respondedAt === null and
    // records an omission error (consistent with server-side scoring, which
    // counts `timeout` events as omissions).
    this.emit("timeout", { trialId: this.currentTrialId });

    this.feedbackCorrect = false;
    this.showFeedback = true;

    this.armTimer("feedback", 800, () => {
      this.trials.endTrial();
      this.nextTrial();
    });
  }

  private nextTrial(): void {
    this.showFeedback = false;
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
        this.ssPhase = "finished";
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

// ── Helpers ───────────────────────────────────────────────

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}
