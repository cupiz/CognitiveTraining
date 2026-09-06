import type { InputEvent } from "@cog/schemas";
import type { GameContext, GameSummary } from "@cog/game-core";
import { BaseGame, createRng } from "@cog/game-core";
import {
  getDifficultyConfig,
  validateConfig,
  type TapCritterConfig,
} from "./difficulty.js";

export const GAME_KEY = "tap_critter" as const;
export const GAME_VERSION = "0.1.0" as const;

export type TCPhase =
  | "idle"
  | "practice"
  | "countdown"
  | "pop" // a critter or decoy is out of its hole
  | "between" // brief gap before the next pop
  | "paused"
  | "finished";

export type PopKind = "critter" | "decoy";

export interface TCRenderState {
  phase: TCPhase;
  /** Hole index currently occupied (-1 = none) */
  currentHole: number;
  /** What popped out ("critter" = tap it, "decoy" = avoid it) */
  currentKind: PopKind | null;
  /** Which hole the child just tapped (-1 = none) */
  lastTapped: number;
  feedbackKind: "caught" | "wrong" | "missed" | "avoided" | null;
  holeCount: number;
  trialNumber: number;
  totalTrials: number;
  isPractice: boolean;
  score: number;
  deadlineMs: number;
}

/**
 * Tangkap Tikus — a reaction game with a twist.
 *
 * Critters pop out of garden holes for a heartbeat: tap them fast! From
 * level 4 on, prickly decoys pop out too — tapping those stings, so the
 * same fast reflex now needs a split-second decision.
 */
export class TapCritterGame extends BaseGame {
  readonly key = GAME_KEY;
  readonly version = GAME_VERSION;

  private tcPhase: TCPhase = "idle";
  private gameMode: "practice" | "countdown" | "playing" | "finished" = "practice";
  private config: TapCritterConfig = {
    popMs: 1500,
    holeCount: 3,
    decoyRate: 0,
    gapMs: 700,
  };
  private rng: () => number = () => 0;

  // Pop state
  private currentHole = -1;
  private currentKind: PopKind | null = null;
  private lastTapped = -1;
  private feedbackKind: TCRenderState["feedbackKind"] = null;
  private trialNumber = 0;
  private score = 0;
  private currentTrialId = "";
  private popStartedAt = 0;
  private catchRts: number[] = [];

  // Tracking
  private practiceCount = 0;
  private scoredCount = 0;
  private maxTrials = 20;
  private isCurrentPracticeTrial = false;

  // Pause state
  private pausedPhase: TCPhase = "idle";

  // ── Config ──────────────────────────────────────────────

  getConfig(difficulty: number): Record<string, unknown> {
    return getDifficultyConfig(difficulty) as unknown as Record<string, unknown>;
  }

  validateConfig(config: Record<string, unknown>): void {
    validateConfig(config as unknown as TapCritterConfig);
  }

  // ── Lifecycle ───────────────────────────────────────────

  protected onStart(context: GameContext): void {
    this.config = getDifficultyConfig(context.difficulty) as TapCritterConfig;
    this.rng = createRng(context.seed);
    this.maxTrials = context.maxTrials ?? 20;
    this.currentHole = -1;
    this.currentKind = null;
    this.lastTapped = -1;
    this.feedbackKind = null;
    this.trialNumber = 0;
    this.score = 0;
    this.catchRts = [];

    this.tcPhase = context.practiceTrials > 0 ? "practice" : "countdown";
    this.gameMode = context.practiceTrials > 0 ? "practice" : "playing";

    this.nextPop();
  }

  protected onInput(input: InputEvent): void {
    if (input.type !== "pointer_down" && input.type !== "touch") return;
    if (this.tcPhase !== "pop") return;

    const payload = (input as Record<string, unknown>).cellIndex;
    const hole = typeof payload === "number" ? Math.floor(payload) : -1;
    if (hole < 0 || hole >= this.config.holeCount) return;
    if (hole !== this.currentHole) return; // tapping an empty hole does nothing

    this.lastTapped = hole;
    this.evaluateTap();
  }

  pause(): void {
    if (this.tcPhase === "idle" || this.tcPhase === "finished" || this.tcPhase === "paused") return;
    this.pausedPhase = this.tcPhase;
    this.tcPhase = "paused";
    this.freezePausableTimers();
  }

  resume(): void {
    if (this.tcPhase !== "paused") return;
    this.tcPhase = this.pausedPhase;
    this.thawPausableTimers();
  }

  protected onFinish(): GameSummary {
    this.clearTimers();
    this.tcPhase = "finished";

    return {
      gameKey: this.key,
      gameVersion: this.version,
      config: this.config as unknown as Record<string, unknown>,
      totalTrials: this.trials.totalTrials,
      validTrials: this.trials.scoredTrialCount,
      accuracy: this.trials.accuracy,
      medianRtMs:
        this.catchRts.length > 0
          ? this.catchRts.slice().sort((a, b) => a - b)[Math.floor((this.catchRts.length - 1) / 2)]
          : undefined,
      meanRtMs: this.catchRts.length > 0 ? this.catchRts.reduce((s, r) => s + r, 0) / this.catchRts.length : undefined,
      omissionErrors: this.trials.omissionErrors,
      commissionErrors: this.trials.commissionErrors,
      qualityFlags: this.trials.allQualityFlags,
    };
  }

  getPhase() {
    if (this.tcPhase === "idle" || this.tcPhase === "finished") return this.tcPhase;
    if (this.tcPhase === "paused") return "paused";
    return this.gameMode;
  }

  // ── Render state ────────────────────────────────────────

  getRenderState(): Record<string, unknown> {
    return {
      phase: this.tcPhase,
      currentHole: this.currentHole,
      currentKind: this.currentKind,
      lastTapped: this.lastTapped,
      feedbackKind: this.feedbackKind,
      holeCount: this.config.holeCount,
      trialNumber: this.trialNumber,
      totalTrials: this.maxTrials,
      isPractice: this.gameMode === "practice",
      score: this.score,
      deadlineMs: this.config.popMs,
    } satisfies TCRenderState;
  }

  // ── Pop logic ───────────────────────────────────────────

  private nextPop(): void {
    this.feedbackKind = null;
    this.lastTapped = -1;
    this.trialNumber = this.practiceCount + this.scoredCount + 1;

    this.currentHole = Math.floor(this.rng() * this.config.holeCount);
    this.currentKind = this.rng() < this.config.decoyRate ? "decoy" : "critter";

    const isPractice = this.gameMode === "practice";
    this.isCurrentPracticeTrial = isPractice;
    const trial = this.trials.startTrial({ isPractice, exposureMs: this.config.popMs });
    this.currentTrialId = trial.trialId;

    this.emitTrialStarted(trial.trialId, {
      hole: this.currentHole,
      kind: this.currentKind,
      seed: Math.round(this.rng() * 100000),
    });
    this.emit("stimulus_shown", { trialId: trial.trialId });

    this.tcPhase = "pop";

    this.popStartedAt = performance.now();
    this.armTimer("deadline", this.config.popMs, () => this.closePop());
  }

  private evaluateTap(): void {
    this.clearTimers();

    const rt = Math.round(performance.now() - this.popStartedAt);
    const tappedCritter = this.currentKind === "critter";
    this.trials.respond(tappedCritter, { tappedHole: this.lastTapped, reactionTimeMs: rt });
    this.emitResponse(this.currentTrialId, { correct: tappedCritter, tappedHole: this.lastTapped, reactionTimeMs: rt });

    if (tappedCritter) {
      this.feedbackKind = "caught";
      this.score++;
      this.catchRts.push(rt);
    } else {
      this.feedbackKind = "wrong";
    }

    this.tcPhase = "between";
    this.armTimer("between", 500, () => this.endPop());
  }

  /** Pop window closed without a tap on the occupied hole. */
  private closePop(): void {
    if (this.tcPhase !== "pop") return;
    this.clearTimers();

    const shouldHaveTapped = this.currentKind === "critter";

    if (shouldHaveTapped) {
      // Missed a critter — record an omission (no trials.respond), like other games.
      this.feedbackKind = "missed";
      this.emit("timeout", { trialId: this.currentTrialId });
    } else {
      // Correctly let the decoy pass — a correct rejection still scores.
      this.feedbackKind = "avoided";
      this.score++;
      this.trials.respond(true, { tappedHole: null, avoided: true });
      this.emitResponse(this.currentTrialId, { correct: true, responded: false, avoided: true });
    }

    this.tcPhase = "between";
    this.armTimer("between", 420, () => this.endPop());
  }

  private endPop(): void {
    this.clearTimers();
    this.trials.endTrial();
    this.currentHole = -1;
    this.currentKind = null;
    this.lastTapped = -1;

    if (this.isCurrentPracticeTrial) {
      this.practiceCount++;
      this.isCurrentPracticeTrial = false;
      if (this.practiceCount >= (this.context.practiceTrials ?? 0)) {
        this.gameMode = "countdown";
        this.armTimer("countdownTransition", 1500, () => {
          this.gameMode = "playing";
          this.nextPop();
        });
        return;
      }
    } else {
      this.scoredCount++;
      if (this.scoredCount >= this.maxTrials) {
        this.gameMode = "finished";
        this.tcPhase = "finished";
        return;
      }
    }

    this.armTimer("intermission", this.config.gapMs, () => this.nextPop());
  }

  private clearTimers(): void {
    this.clearAllPausableTimers();
  }
}
