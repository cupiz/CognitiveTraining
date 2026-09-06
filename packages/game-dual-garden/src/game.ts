import type { InputEvent } from "@cog/schemas";
import type { GameContext, GameSummary } from "@cog/game-core";
import { BaseGame, buildSummary, createRng } from "@cog/game-core";
import {
  getDifficultyConfig,
  validateConfig,
  type DualGardenConfig,
} from "./difficulty.js";

export const GAME_KEY = "dual_garden" as const;
export const GAME_VERSION = "0.1.0" as const;

export type DGPhase =
  | "idle"
  | "practice"
  | "countdown"
  | "round" // a pair (animal + fruit) is on screen
  | "feedback"
  | "paused"
  | "finished";

export interface DGRenderState {
  phase: DGPhase;
  /** Animal crossing the top stream this round (null between rounds) */
  currentAnimal: string | null;
  /** Fruit falling in the bottom stream this round (null between rounds) */
  currentFruit: string | null;
  /** Target animal the child watches for (shown in the mission banner) */
  targetAnimal: string;
  /** Target fruit the child watches for (shown in the mission banner) */
  targetFruit: string;
  /** When false, only the fruit rule is active */
  requireBoth: boolean;
  awaitingResponse: boolean;
  feedbackKind: "hit" | "miss" | "false_alarm" | "correct_rejection" | null;
  trialNumber: number;
  totalTrials: number;
  isPractice: boolean;
  score: number;
  deadlineMs: number;
}

const ANIMALS = ["🐰", "🦊", "🐻", "🐸", "🦉", "🐗", "🦔", "🐔"];
const FRUITS = ["🍎", "🍐", "🍊", "🍋", "🍇", "🍉", "🫐", "🍑"];

/**
 * Kebun Dua Arus — a divided-attention garden.
 *
 * Two streams run at once: an animal crosses the top bridge, a fruit falls in
 * the bottom stream. The child taps the marker only when the streams match
 * their targets — both of them once requireBoth is active.
 */
export class DualGardenGame extends BaseGame {
  readonly key = GAME_KEY;
  readonly version = GAME_VERSION;

  private dgPhase: DGPhase = "idle";
  private gameMode: "practice" | "countdown" | "playing" | "finished" = "practice";
  private config: DualGardenConfig = {
    windowMs: 3000,
    requireBoth: false,
    animalPoolSize: 3,
    fruitPoolSize: 3,
  };
  private rng: () => number = () => 0;

  // Round state
  private currentAnimal = "";
  private currentFruit = "";
  private targetAnimal = "";
  private targetFruit = "";
  private awaitingResponse = false;
  private feedbackKind: DGRenderState["feedbackKind"] = null;
  private trialNumber = 0;
  private score = 0;
  private currentTrialId = "";

  // Tracking
  private practiceCount = 0;
  private scoredCount = 0;
  private maxTrials = 16;
  private isCurrentPracticeTrial = false;

  // Pause state
  private pausedPhase: DGPhase = "idle";

  // ── Config ──────────────────────────────────────────────

  getConfig(difficulty: number): Record<string, unknown> {
    return getDifficultyConfig(difficulty) as unknown as Record<string, unknown>;
  }

  validateConfig(config: Record<string, unknown>): void {
    validateConfig(config as unknown as DualGardenConfig);
  }

  // ── Lifecycle ───────────────────────────────────────────

  protected onStart(context: GameContext): void {
    this.config = getDifficultyConfig(context.difficulty) as DualGardenConfig;
    this.rng = createRng(context.seed);
    this.maxTrials = context.maxTrials ?? 16;
    this.awaitingResponse = false;
    this.feedbackKind = null;
    this.trialNumber = 0;
    this.score = 0;

    // Session targets, drawn deterministically from the seed.
    this.targetAnimal = ANIMALS[Math.floor(this.rng() * this.config.animalPoolSize)];
    this.targetFruit = FRUITS[Math.floor(this.rng() * this.config.fruitPoolSize)];

    this.tnbPhaseAlias(context);
    this.nextRound();
  }

  /** practiceTrials === 0 → the shell countdown already ran; we are playing. */
  private tnbPhaseAlias(context: GameContext): void {
    this.dgPhase = context.practiceTrials > 0 ? "practice" : "countdown";
    this.gameMode = context.practiceTrials > 0 ? "practice" : "playing";
  }

  protected onInput(input: InputEvent): void {
    if (input.type !== "pointer_down" && input.type !== "touch") return;
    if (this.dgPhase !== "round" || !this.awaitingResponse) return;

    this.awaitingResponse = false;
    this.evaluateResponse();
  }

  pause(): void {
    if (this.dgPhase === "idle" || this.dgPhase === "finished" || this.dgPhase === "paused") return;
    this.pausedPhase = this.dgPhase;
    this.dgPhase = "paused";
    this.freezePausableTimers();
  }

  resume(): void {
    if (this.dgPhase !== "paused") return;
    this.dgPhase = this.pausedPhase;
    this.thawPausableTimers();
  }

  protected onFinish(): GameSummary {
    this.clearTimers();
    this.dgPhase = "finished";

    return buildSummary(
      { key: this.key, version: this.version, config: this.config as unknown as Record<string, unknown> },
      this.trials,
    );
  }

  getPhase() {
    if (this.dgPhase === "idle" || this.dgPhase === "finished") return this.dgPhase;
    if (this.dgPhase === "paused") return "paused";
    return this.gameMode;
  }

  // ── Render state ────────────────────────────────────────

  getRenderState(): Record<string, unknown> {
    return {
      phase: this.dgPhase,
      currentAnimal: this.dgPhase === "round" ? this.currentAnimal : null,
      currentFruit: this.dgPhase === "round" ? this.currentFruit : null,
      targetAnimal: this.targetAnimal,
      targetFruit: this.targetFruit,
      requireBoth: this.config.requireBoth,
      awaitingResponse: this.awaitingResponse,
      feedbackKind: this.feedbackKind,
      trialNumber: this.trialNumber,
      totalTrials: this.maxTrials,
      isPractice: this.gameMode === "practice",
      score: this.score,
      deadlineMs: this.config.windowMs,
    } satisfies DGRenderState;
  }

  // ── Round logic ─────────────────────────────────────────

  private nextRound(): void {
    this.feedbackKind = null;
    this.trialNumber = this.practiceCount + this.scoredCount + 1;

    const animalPool = ANIMALS.slice(0, this.config.animalPoolSize);
    const fruitPool = FRUITS.slice(0, this.config.fruitPoolSize);

    // Draw the pair: bias toward a round where both rules match ~35% of the
    // time, otherwise at most one stream matches.
    const roll = this.rng();
    const bothMatch = roll < 0.35;
    const animalMatches = bothMatch || (!this.config.requireBoth && this.rng() < 0.35);
    const fruitMatches = bothMatch || !animalMatches;

    this.currentAnimal = animalMatches
      ? this.targetAnimal
      : animalPool.filter((a) => a !== this.targetAnimal)[Math.floor(this.rng() * (animalPool.length - 1))];
    this.currentFruit = fruitMatches
      ? this.targetFruit
      : fruitPool.filter((f) => f !== this.targetFruit)[Math.floor(this.rng() * (fruitPool.length - 1))];

    const isPractice = this.gameMode === "practice";
    this.isCurrentPracticeTrial = isPractice;
    const trial = this.trials.startTrial({ isPractice, exposureMs: this.config.windowMs });
    this.currentTrialId = trial.trialId;

    this.emitTrialStarted(trial.trialId, {
      roundIndex: this.trialNumber,
      requireBoth: this.config.requireBoth,
      seed: Math.round(this.rng() * 100000),
    });
    this.emit("stimulus_shown", { trialId: trial.trialId });

    this.dgPhase = "round";
    this.awaitingResponse = true;

    this.armTimer("deadline", this.config.windowMs, () => this.closeRound());
  }

  private evaluateResponse(): void {
    this.clearTimers();

    const animalMatches = this.currentAnimal === this.targetAnimal;
    const fruitMatches = this.currentFruit === this.targetFruit;
    const shouldMark = this.config.requireBoth ? animalMatches && fruitMatches : fruitMatches;

    this.trials.respond(shouldMark, { rangMarker: true });
    this.emitResponse(this.currentTrialId, { correct: shouldMark, rangMarker: true });

    if (shouldMark) {
      this.feedbackKind = "hit";
      this.score++;
    } else {
      this.feedbackKind = "false_alarm";
    }

    this.dgPhase = "feedback";
    this.armTimer("feedback", 600, () => this.endRound());
  }

  /** Response window closed without a marker tap. */
  private closeRound(): void {
    if (!this.awaitingResponse) return;
    this.awaitingResponse = false;
    this.clearTimers();

    const animalMatches = this.currentAnimal === this.targetAnimal;
    const fruitMatches = this.currentFruit === this.targetFruit;
    const shouldMark = this.config.requireBoth ? animalMatches && fruitMatches : fruitMatches;

    // No marker tap: correct rejection when the round wasn't a target.
    this.trials.respond(!shouldMark, { rangMarker: false });
    this.emitResponse(this.currentTrialId, { correct: !shouldMark, rangMarker: false });

    if (shouldMark) {
      this.feedbackKind = "miss";
    } else {
      this.feedbackKind = "correct_rejection";
    }

    this.dgPhase = "feedback";
    this.armTimer("feedback", 600, () => this.endRound());
  }

  private endRound(): void {
    this.clearTimers();
    this.trials.endTrial();

    if (this.isCurrentPracticeTrial) {
      this.practiceCount++;
      this.isCurrentPracticeTrial = false;
      if (this.practiceCount >= (this.context.practiceTrials ?? 0)) {
        this.gameMode = "countdown";
        this.armTimer("countdownTransition", 1500, () => {
          this.gameMode = "playing";
          this.nextRound();
        });
        return;
      }
    } else {
      this.scoredCount++;
      if (this.scoredCount >= this.maxTrials) {
        this.gameMode = "finished";
        this.dgPhase = "finished";
        return;
      }
    }

    this.armTimer("intermission", 400, () => this.nextRound());
  }

  private clearTimers(): void {
    this.clearAllPausableTimers();
  }
}
