import type { InputEvent } from "@cog/schemas";
import type { GameContext, GameSummary } from "@cog/game-core";
import { BaseGame, buildSummary, createRng } from "@cog/game-core";
import {
  getDifficultyConfig,
  validateConfig,
  generateGrid,
  type CrystalPalaceConfig,
  type CrystalPalaceGrid,
} from "./difficulty.js";

export const GAME_KEY = "crystal_palace" as const;
export const GAME_VERSION = "0.1.0" as const;

/** Game phases for the state machine */
export type CPPhase =
  | "idle"
  | "practice"
  | "countdown"
  | "waiting" // searching the courtyard
  | "feedback"
  | "paused"
  | "finished";

/** State for the renderer */
export interface CPRenderState {
  phase: CPPhase;
  grid: CrystalPalaceGrid | null;
  tappedIndices: number[];
  feedbackCorrect: boolean | null;
  feedbackMessage: string;
  trialNumber: number;
  totalTrials: number;
  isPractice: boolean;
  score: number;
  deadlineMs: number;
}

/**
 * Crystal Palace (Istana Kristal) game implementation.
 *
 * Mechanic:
 * 1. The target crystal (colour + cut) is shown on the decree card.
 * 2. The child taps every courtyard crystal matching the target.
 * 3. Tapping a non-matching crystal ends the trial as a commission; letting
 *    the deadline pass leaves remaining matches as omissions.
 *
 * @see docs/06_GAME_DESIGN.md — Flagship 6: Crystal Palace
 */
export class CrystalPalaceGame extends BaseGame {
  readonly key = GAME_KEY;
  readonly version = GAME_VERSION;

  private cpPhase: CPPhase = "idle";
  private gameMode: "practice" | "countdown" | "playing" | "finished" = "practice";
  private config: CrystalPalaceConfig = {
    gridRows: 4,
    gridCols: 4,
    matchCount: 3,
    similarLevel: 1,
    deadlineMs: 18000,
  };
  private rng: () => number = () => 0;

  // Trial state
  private grid: CrystalPalaceGrid | null = null;
  private tappedIndices: number[] = [];
  private tappedMatches = 0;
  private feedbackCorrect: boolean | null = null;
  private feedbackMessage = "";
  private responseStartMs = 0;
  private currentTrialId = "";
  private isCurrentPracticeTrial = false;

  // Tracking
  private practiceCount = 0;
  private scoredCount = 0;
  private maxTrials = 12;
  private score = 0;

  // Pause state
  private pausedPhase: CPPhase = "idle";

  // Metrics
  private searchRts: number[] = [];

  // ── Config ──────────────────────────────────────────────

  getConfig(difficulty: number): Record<string, unknown> {
    return getDifficultyConfig(difficulty) as unknown as Record<string, unknown>;
  }

  validateConfig(config: Record<string, unknown>): void {
    validateConfig(config as unknown as CrystalPalaceConfig);
  }

  // ── Lifecycle ───────────────────────────────────────────

  protected onStart(context: GameContext): void {
    this.config = getDifficultyConfig(context.difficulty) as CrystalPalaceConfig;
    this.rng = createRng(context.seed);
    this.maxTrials = context.maxTrials ?? 12;
    this.cpPhase = context.practiceTrials > 0 ? "practice" : "countdown";
    this.gameMode = context.practiceTrials > 0 ? "practice" : "countdown";
    this.score = 0;
    this.searchRts = [];

    this.beginTrial();
  }

  protected onInput(input: InputEvent): void {
    if (input.type !== "pointer_down" && input.type !== "touch") return;
    if (this.cpPhase !== "waiting") return;

    const payload = (input as Record<string, unknown>).cellIndex;
    if (typeof payload !== "number") return;
    const cell = Math.floor(payload);
    if (!this.grid || cell < 0 || cell >= this.grid.cells.length) return;

    this.handleCellTap(cell);
  }

  pause(): void {
    if (this.cpPhase === "idle" || this.cpPhase === "finished" || this.cpPhase === "paused") return;
    this.pausedPhase = this.cpPhase;
    this.cpPhase = "paused";
    this.freezePausableTimers();
  }

  resume(): void {
    if (this.cpPhase !== "paused") return;
    this.cpPhase = this.pausedPhase;
    this.thawPausableTimers();
  }

  protected onPause(): void {}
  protected onResume(): void {}

  protected onFinish(): GameSummary {
    this.clearTimers();
    this.cpPhase = "finished";

    return buildSummary(
      { key: this.key, version: this.version, config: this.config as unknown as Record<string, unknown> },
      this.trials,
      { rts: this.searchRts },
    );
  }

  getPhase() {
    if (this.cpPhase === "idle") return "idle";
    if (this.cpPhase === "paused") return "paused";
    return this.gameMode;
  }

  // ── Render state ────────────────────────────────────────

  getRenderState(): Record<string, unknown> {
    return {
      phase: this.cpPhase,
      grid: this.grid,
      tappedIndices: this.tappedIndices,
      feedbackCorrect: this.feedbackCorrect,
      feedbackMessage: this.feedbackMessage,
      trialNumber: this.scoredCount + this.practiceCount,
      totalTrials: this.maxTrials,
      isPractice: this.gameMode === "practice",
      score: this.score,
      deadlineMs: this.config.deadlineMs,
    } satisfies CPRenderState;
  }

  // ── Trial logic ─────────────────────────────────────────

  private beginTrial(): void {
    const grid = generateGrid(this.config, this.rng);
    this.grid = grid;
    this.tappedIndices = [];
    this.tappedMatches = 0;
    this.feedbackCorrect = null;
    this.feedbackMessage = "";

    const isPractice = this.gameMode === "practice";
    this.isCurrentPracticeTrial = isPractice;
    const trial = this.trials.startTrial({
      isPractice,
      exposureMs: this.config.deadlineMs,
    });
    this.currentTrialId = trial.trialId;

    this.emitTrialStarted(trial.trialId, {
      seed: Math.round(this.rng() * 100000),
      targetCount: this.config.matchCount,
      exposureMs: this.config.deadlineMs,
      targetColor: grid.targetColor,
      targetShape: grid.targetShape,
    });

    this.cpPhase = "waiting";
    this.responseStartMs = performance.now();
    this.emit("stimulus_shown", { trialId: trial.trialId });

    this.armTimer("deadline", this.config.deadlineMs, () => {
      this.handleTimeout();
    });
  }

  private handleCellTap(cell: number): void {
    if (this.tappedIndices.includes(cell)) return;

    const crystal = this.grid!.cells[cell];
    if (!crystal.isMatch) {
      // Wrong crystal → commission.
      this.finishTrial(false, "Bukan itu — perhatikan warna dan potongannya ya!");
      return;
    }

    this.tappedIndices.push(cell);
    this.tappedMatches++;

    // All matches found → correct.
    if (this.tappedMatches >= this.config.matchCount) {
      this.finishTrial(true, "Istana bersinar! Semua kristal ditemukan!");
    }
  }

  private finishTrial(correct: boolean, message: string): void {
    if (this.cpPhase !== "waiting") return;
    this.clearTimers();
    this.cpPhase = "feedback";
    this.feedbackCorrect = correct;
    this.feedbackMessage = message;

    const rt = Math.round(performance.now() - this.responseStartMs);
    const targetIds = this.grid!.cells.filter((c) => c.isMatch).map((c) => c.id);

    this.trials.respond(correct, {
      selectedCells: [...this.tappedIndices],
      correctCells: targetIds,
      reactionTimeMs: rt,
    });
    this.emitResponse(this.currentTrialId, {
      selectedCells: [...this.tappedIndices],
      correctCells: targetIds,
      reactionTimeMs: rt,
      correct,
    });

    if (correct) {
      this.score++;
      this.searchRts.push(rt);
    }

    this.armTimer("feedback", 900, () => {
      this.trials.endTrial();
      this.nextTrial();
    });
  }

  private handleTimeout(): void {
    if (this.cpPhase !== "waiting") return;

    this.clearTimers();
    this.cpPhase = "feedback";
    this.feedbackCorrect = false;
    this.feedbackMessage = "Waktu habis — sebagian kristal belum ditemukan. Coba lagi ya!";

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
        this.cpPhase = "finished";
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
