import type { InputEvent } from "@cog/schemas";
import type { GameContext, GameSummary } from "@cog/game-core";
import { BaseGame, buildSummary, createRng } from "@cog/game-core";
import {
  getDifficultyConfig,
  validateConfig,
  type TrainNBackConfig,
} from "./difficulty.js";

export const GAME_KEY = "train_n_back" as const;
export const GAME_VERSION = "0.1.0" as const;

/** Phases for the renderer state machine */
export type TNBPhase =
  | "idle"
  | "practice"
  | "countdown"
  | "wagon" // a wagon is on screen, bell tap allowed
  | "feedback" // brief feedback after the bell tap / missed wagon
  | "paused"
  | "finished";

export interface TNBRenderState {
  phase: TNBPhase;
  /** Fruit carried by the current wagon (null between wagons) */
  currentFruit: string | null;
  /** Wagon number within the run (1-based) */
  wagonIndex: number;
  /** How far back the child must compare */
  nLevel: number;
  /** True while the child may still ring the bell for this wagon */
  awaitingResponse: boolean;
  feedbackKind: "hit" | "miss" | "false_alarm" | "correct_rejection" | "timeout" | null;
  trialNumber: number;
  totalTrials: number;
  isPractice: boolean;
  score: number;
  deadlineMs: number;
}

const FRUITS = ["🍎", "🍌", "🍇", "🍊", "🍓", "🍐", "🍒", "🍍"];

/**
 * Kereta N-Back — a child-friendly n-back task (working memory updating).
 *
 * Wagons pass one at a time, each carrying a fruit. The child rings the bell
 * when the current fruit matches the one from nLevel wagons ago. Every wagon
 * is one scored trial: hits, correct rejections, misses (omission) and false
 * alarms (commission).
 */
export class TrainNBackGame extends BaseGame {
  readonly key = GAME_KEY;
  readonly version = GAME_VERSION;

  private tnbPhase: TNBPhase = "idle";
  private gameMode: "practice" | "countdown" | "playing" | "finished" = "practice";
  private config: TrainNBackConfig = {
    nLevel: 1,
    wagonIntervalMs: 3000,
    fruitCount: 3,
    matchRate: 0.4,
  };
  private rng: () => number = () => 0;

  // Trial state
  private fruits: string[] = [];
  private wagonIndex = 0;
  private awaitingResponse = false;
  private feedbackKind: TNBRenderState["feedbackKind"] = null;
  private trialNumber = 0;
  private score = 0;

  // Tracking
  private practiceCount = 0;
  private scoredCount = 0;
  private maxTrials = 20;
  private isCurrentPracticeTrial = false;

  // Pause state
  private pausedPhase: TNBPhase = "idle";

  // ── Config ──────────────────────────────────────────────

  getConfig(difficulty: number): Record<string, unknown> {
    return getDifficultyConfig(difficulty) as unknown as Record<string, unknown>;
  }

  validateConfig(config: Record<string, unknown>): void {
    validateConfig(config as unknown as TrainNBackConfig);
  }

  // ── Lifecycle ───────────────────────────────────────────

  protected onStart(context: GameContext): void {
    this.config = getDifficultyConfig(context.difficulty) as TrainNBackConfig;
    this.rng = createRng(context.seed);
    this.maxTrials = context.maxTrials ?? 20;
    this.fruits = [];
    this.wagonIndex = 0;
    this.awaitingResponse = false;
    this.feedbackKind = null;
    this.trialNumber = 0;
    this.score = 0;
    this.tnbPhase = context.practiceTrials > 0 ? "practice" : "countdown";
    // practiceTrials === 0 → the shell countdown already ran; we are playing.
    this.gameMode = context.practiceTrials > 0 ? "practice" : "playing";

    this.nextWagon();
  }

  protected onInput(input: InputEvent): void {
    if (input.type !== "pointer_down" && input.type !== "touch") return;
    if (this.tnbPhase !== "wagon" || !this.awaitingResponse) return;

    this.awaitingResponse = false;
    this.evaluateResponse();
  }

  pause(): void {
    if (this.tnbPhase === "idle" || this.tnbPhase === "finished" || this.tnbPhase === "paused") return;
    this.pausedPhase = this.tnbPhase;
    this.tnbPhase = "paused";
    this.freezePausableTimers();
  }

  resume(): void {
    if (this.tnbPhase !== "paused") return;
    this.tnbPhase = this.pausedPhase;
    this.thawPausableTimers();
  }

  protected onPause(): void {}
  protected onResume(): void {}

  protected onFinish(): GameSummary {
    this.clearTimers();
    this.tnbPhase = "finished";

    return buildSummary(
      { key: this.key, version: this.version, config: this.config as unknown as Record<string, unknown> },
      this.trials,
    );
  }

  getPhase() {
    if (this.tnbPhase === "idle" || this.tnbPhase === "finished") return this.tnbPhase;
    if (this.tnbPhase === "paused") return "paused";
    return this.gameMode;
  }

  // ── Render state ────────────────────────────────────────

  getRenderState(): Record<string, unknown> {
    return {
      phase: this.tnbPhase,
      currentFruit: this.fruits.length > 0 ? this.fruits[this.fruits.length - 1] : null,
      wagonIndex: this.wagonIndex,
      nLevel: this.config.nLevel,
      awaitingResponse: this.awaitingResponse,
      feedbackKind: this.feedbackKind,
      trialNumber: this.trialNumber,
      totalTrials: this.maxTrials,
      isPractice: this.gameMode === "practice",
      score: this.score,
      deadlineMs: this.config.wagonIntervalMs,
    } satisfies TNBRenderState;
  }

  // ── Trial logic ─────────────────────────────────────────
  // One wagon = one trial in the tracker. "Feedback" here is the brief pause
  // after the response window closes before the next wagon arrives.

  private nextWagon(): void {
    this.feedbackKind = null;

    if (this.isCurrentPracticeTrial) {
      this.trialNumber = this.practiceCount + 1;
    } else {
      this.trialNumber = this.practiceCount + this.scoredCount + 1;
    }

    // Wagon 1..nLevel can never be a match — seed the history with filler.
    while (this.fruits.length < this.config.nLevel) {
      this.fruits.push(FRUITS[Math.floor(this.rng() * this.config.fruitCount)]);
    }

    // Decide whether this wagon is a match, then pick the fruit accordingly.
    const historyFruit = this.fruits[this.fruits.length - this.config.nLevel];
    const isMatch = this.rng() < this.config.matchRate;
    let fruit: string;
    if (isMatch) {
      fruit = historyFruit;
    } else {
      const pool = FRUITS.slice(0, this.config.fruitCount).filter((f) => f !== historyFruit);
      fruit = pool[Math.floor(this.rng() * pool.length)];
    }
    this.fruits.push(fruit);
    this.wagonIndex += 1;

    const isPractice = this.gameMode === "practice";
    this.isCurrentPracticeTrial = isPractice;
    const trial = this.trials.startTrial({ isPractice, exposureMs: this.config.wagonIntervalMs });
    this.currentTrialId = trial.trialId;

    this.emitTrialStarted(trial.trialId, {
      wagonIndex: this.wagonIndex,
      nLevel: this.config.nLevel,
      seed: Math.round(this.rng() * 100000),
    });
    this.emit("stimulus_shown", { trialId: trial.trialId });

    this.tnbPhase = "wagon";
    this.awaitingResponse = true;

    this.armTimer("deadline", this.config.wagonIntervalMs, () => {
      this.closeWagon();
    });
  }

  private evaluateResponse(): void {
    const currentFruit = this.fruits[this.fruits.length - 1];
    const nBackFruit = this.fruits[this.fruits.length - 1 - this.config.nLevel];
    const isMatch = currentFruit === nBackFruit;

    this.clearTimers();
    this.trials.respond(isMatch, { reactionTimeMs: null, rangBell: true });
    this.emitResponse(this.currentTrialId, { correct: isMatch, rangBell: true });

    if (isMatch) {
      this.feedbackKind = "hit";
      this.score++;
    } else {
      this.feedbackKind = "false_alarm";
    }

    this.tnbPhase = "feedback";
    this.armTimer("feedback", 600, () => this.endWagon());
  }

  /** Response window closed without a bell tap. */
  private closeWagon(): void {
    if (!this.awaitingResponse) return;
    this.awaitingResponse = false;

    const currentFruit = this.fruits[this.fruits.length - 1];
    const nBackFruit = this.fruits[this.fruits.length - 1 - this.config.nLevel];
    const isMatch = currentFruit === nBackFruit;

    // Ring expected but not rung → omission-style miss. Silence on a
    // non-match wagon is the correct move.
    this.trials.respond(!isMatch, { rangBell: false });
    this.emitResponse(this.currentTrialId, { correct: !isMatch, rangBell: false });

    if (isMatch) {
      this.feedbackKind = "miss";
    } else {
      this.feedbackKind = "correct_rejection";
    }

    this.clearTimers();
    this.tnbPhase = "feedback";
    this.armTimer("feedback", 600, () => this.endWagon());
  }

  private endWagon(): void {
    this.clearTimers();
    this.trials.endTrial();

    if (this.isCurrentPracticeTrial) {
      this.practiceCount++;
      this.isCurrentPracticeTrial = false;
      if (this.practiceCount >= (this.context.practiceTrials ?? 0)) {
        this.gameMode = "countdown";
        this.armTimer("countdownTransition", 1500, () => {
          this.gameMode = "playing";
          this.nextWagon();
        });
        return;
      }
    } else {
      this.scoredCount++;
      if (this.scoredCount >= this.maxTrials) {
        this.gameMode = "finished";
        this.tnbPhase = "finished";
        return;
      }
    }

    this.armTimer("intermission", 400, () => this.nextWagon());
  }

  private currentTrialId = "";
  private clearTimers(): void {
    this.clearAllPausableTimers();
  }
}
