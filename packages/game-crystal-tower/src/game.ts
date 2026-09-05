import type { InputEvent } from "@cog/schemas";
import type { GameContext, GameSummary } from "@cog/game-core";
import { BaseGame, createRng } from "@cog/game-core";
import {
  getDifficultyConfig,
  validateConfig,
  type CrystalTowerConfig,
} from "./difficulty.js";

export const GAME_KEY = "crystal_tower" as const;
export const GAME_VERSION = "0.1.0" as const;

export type CTPhase =
  | "idle"
  | "practice"
  | "countdown"
  | "solving" // puzzle active, no peg selected
  | "selected" // source peg chosen, waiting for destination
  | "feedback"
  | "paused"
  | "finished";

export interface CTRenderState {
  phase: CTPhase;
  /** Pegs 0..2, each an array of crystal sizes (largest first) */
  pegs: number[][];
  /** Index of the currently selected source peg (-1 = none) */
  selectedPeg: number;
  /** Legal moves used in the current round */
  moves: number;
  /** Maximum legal moves for the current round */
  moveLimit: number;
  /** Number of crystals in the puzzle */
  disks: number;
  awaitingResponse: boolean;
  feedbackKind: "solved" | "too_many_moves" | "timeout" | "invalid_move" | null;
  feedbackMessage: string;
  trialNumber: number;
  totalTrials: number;
  isPractice: boolean;
  score: number;
  deadlineMs: number;
}

/**
 * Menara Kristal — a kid-friendly Tower of Hanoi (planning).
 *
 * Three towers, N crystals. Tap a tower to lift its top crystal, tap another
 * tower to drop it. Bigger crystals can never rest on smaller ones. Move all
 * crystals to the rightmost tower before the move limit or the clock runs out.
 *
 * Each puzzle is one trial; the tracker scores the round as delivered (solved)
 * or failed (move limit / timeout). The planner maps this to planning.
 */
export class CrystalTowerGame extends BaseGame {
  readonly key = GAME_KEY;
  readonly version = GAME_VERSION;

  private ctPhase: CTPhase = "idle";
  private gameMode: "practice" | "countdown" | "playing" | "finished" = "practice";
  private config: CrystalTowerConfig = { disks: 3, moveLimit: 12, deadlineMs: 60_000 };
  private rng: () => number = () => 0;

  // Round state
  private pegs: number[][] = [[], [], []];
  private selectedPeg = -1;
  private moves = 0;
  private awaitingResponse = true;
  private feedbackKind: CTRenderState["feedbackKind"] = null;
  private feedbackMessage = "";
  private trialNumber = 0;
  private score = 0;
  private currentTrialId = "";

  // Tracking
  private practiceCount = 0;
  private scoredCount = 0;
  private maxTrials = 6;
  private isCurrentPracticeTrial = false;

  // Pause state
  private pausedPhase: CTPhase = "idle";

  // ── Config ──────────────────────────────────────────────

  getConfig(difficulty: number): Record<string, unknown> {
    return getDifficultyConfig(difficulty) as unknown as Record<string, unknown>;
  }

  validateConfig(config: Record<string, unknown>): void {
    validateConfig(config as unknown as CrystalTowerConfig);
  }

  // ── Lifecycle ───────────────────────────────────────────

  protected onStart(context: GameContext): void {
    this.config = getDifficultyConfig(context.difficulty) as CrystalTowerConfig;
    this.rng = createRng(context.seed);
    this.maxTrials = context.maxTrials ?? 6;
    this.selectedPeg = -1;
    this.moves = 0;
    this.awaitingResponse = true;
    this.feedbackKind = null;
    this.feedbackMessage = "";
    this.trialNumber = 0;
    this.score = 0;

    this.ctPhase = context.practiceTrials > 0 ? "practice" : "countdown";
    this.gameMode = context.practiceTrials > 0 ? "practice" : "playing";

    this.nextPuzzle();
  }

  protected onInput(input: InputEvent): void {
    if (input.type !== "pointer_down" && input.type !== "touch") return;
    if (this.ctPhase !== "solving" && this.ctPhase !== "selected") return;

    const payload = (input as Record<string, unknown>).cellIndex;
    if (typeof payload !== "number") return;
    const peg = Math.floor(payload);
    if (peg < 0 || peg > 2) return;

    this.handlePegTap(peg);
  }

  pause(): void {
    if (this.ctPhase === "idle" || this.ctPhase === "finished" || this.ctPhase === "paused") return;
    this.pausedPhase = this.ctPhase;
    this.ctPhase = "paused";
    this.freezePausableTimers();
  }

  resume(): void {
    if (this.ctPhase !== "paused") return;
    this.ctPhase = this.pausedPhase;
    this.thawPausableTimers();
  }

  protected onFinish(): GameSummary {
    this.clearTimers();
    this.ctPhase = "finished";

    return {
      gameKey: this.key,
      gameVersion: this.version,
      config: this.config as unknown as Record<string, unknown>,
      totalTrials: this.trials.totalTrials,
      validTrials: this.trials.scoredTrialCount,
      accuracy: this.trials.accuracy,
      omissionErrors: this.trials.omissionErrors,
      commissionErrors: this.trials.commissionErrors,
      qualityFlags: this.trials.allQualityFlags,
    };
  }

  getPhase() {
    if (this.ctPhase === "idle" || this.ctPhase === "finished") return this.ctPhase;
    if (this.ctPhase === "paused") return "paused";
    return this.gameMode;
  }

  // ── Render state ────────────────────────────────────────

  getRenderState(): Record<string, unknown> {
    return {
      phase: this.ctPhase,
      pegs: this.pegs.map((peg) => [...peg]),
      selectedPeg: this.selectedPeg,
      moves: this.moves,
      moveLimit: this.config.moveLimit,
      disks: this.config.disks,
      awaitingResponse: this.awaitingResponse,
      feedbackKind: this.feedbackKind,
      feedbackMessage: this.feedbackMessage,
      trialNumber: this.trialNumber,
      totalTrials: this.maxTrials,
      isPractice: this.gameMode === "practice",
      score: this.score,
      deadlineMs: this.config.deadlineMs,
    } satisfies CTRenderState;
  }

  // ── Puzzle logic ────────────────────────────────────────

  private nextPuzzle(): void {
    this.feedbackKind = null;
    this.feedbackMessage = "";
    this.moves = 0;
    this.selectedPeg = -1;
    this.awaitingResponse = true;
    this.trialNumber = this.practiceCount + this.scoredCount + 1;

    // Start with all crystals stacked on peg 0, largest at the bottom.
    this.pegs = [[], [], []];
    for (let size = this.config.disks; size >= 1; size--) {
      this.pegs[0].push(size);
    }

    const isPractice = this.gameMode === "practice";
    this.isCurrentPracticeTrial = isPractice;
    const trial = this.trials.startTrial({ isPractice, exposureMs: this.config.deadlineMs });
    this.currentTrialId = trial.trialId;

    this.emitTrialStarted(trial.trialId, {
      disks: this.config.disks,
      moveLimit: this.config.moveLimit,
      seed: Math.round(this.rng() * 100000),
    });
    this.emit("stimulus_shown", { trialId: trial.trialId });

    this.ctPhase = "solving";

    // The time bar reads the "deadline" timer — one clock for the whole puzzle.
    this.armTimer("deadline", this.config.deadlineMs, () => this.handleTimeout());
  }

  private handlePegTap(peg: number): void {
    if (this.ctPhase === "solving") {
      if (this.pegs[peg].length === 0) return; // nothing to lift
      this.selectedPeg = peg;
      this.ctPhase = "selected";
      return;
    }

    // ctPhase === "selected"
    if (peg === this.selectedPeg) {
      this.selectedPeg = -1;
      this.ctPhase = "solving";
      return;
    }

    const source = this.pegs[this.selectedPeg];
    const crystal = source[source.length - 1];
    const destination = this.pegs[peg];
    const top = destination[destination.length - 1];

    if (top !== undefined && crystal > top) {
      // Illegal: a bigger crystal cannot rest on a smaller one.
      this.feedbackKind = "invalid_move";
      this.feedbackMessage = "Kristal besar tidak boleh di atas yang kecil";
      this.selectedPeg = -1;
      this.ctPhase = "solving";
      return;
    }

    source.pop();
    destination.push(crystal);
    this.moves += 1;
    this.selectedPeg = -1;
    this.ctPhase = "solving";

    if (this.isSolved()) {
      this.finishAsSolved();
      return;
    }

    if (this.moves >= this.config.moveLimit) {
      this.finishAsFailed("too_many_moves", "Langkahnya habis — coba rencanakan lagi ya!");
    }
  }

  private isSolved(): boolean {
    const target = this.pegs[2];
    if (target.length !== this.config.disks) return false;
    for (let i = 0; i < target.length; i++) {
      if (target[i] !== this.config.disks - i) return false;
    }
    return true;
  }

  private finishAsSolved(): void {
    this.clearTimers();
    this.ctPhase = "feedback";
    this.feedbackKind = "solved";
    this.feedbackMessage = "Menara selesai! 🎉";
    this.awaitingResponse = false;
    this.score++;

    this.trials.respond(true, {
      moves: this.moves,
      moveLimit: this.config.moveLimit,
    });
    this.emitResponse(this.currentTrialId, { correct: true, moves: this.moves });

    this.armTimer("feedback", 1400, () => this.endPuzzle());
  }

  private finishAsFailed(kind: "too_many_moves" | "timeout", message: string): void {
    this.clearTimers();
    this.ctPhase = "feedback";
    this.feedbackKind = kind;
    this.feedbackMessage = message;
    this.awaitingResponse = false;

    this.trials.respond(false, {
      moves: this.moves,
      moveLimit: this.config.moveLimit,
    });
    this.emitResponse(this.currentTrialId, { correct: false, moves: this.moves, reason: kind });

    this.armTimer("feedback", 1400, () => this.endPuzzle());
  }

  private handleTimeout(): void {
    if (this.ctPhase !== "solving" && this.ctPhase !== "selected") return;
    this.finishAsFailed("timeout", "Waktu habis — coba lagi ya!");
  }

  private endPuzzle(): void {
    this.clearTimers();

    if (this.isCurrentPracticeTrial) {
      this.practiceCount++;
      this.isCurrentPracticeTrial = false;
      if (this.practiceCount >= (this.context.practiceTrials ?? 0)) {
        this.gameMode = "countdown";
        this.armTimer("countdownTransition", 1500, () => {
          this.gameMode = "playing";
          this.nextPuzzle();
        });
        return;
      }
    } else {
      this.scoredCount++;
      if (this.scoredCount >= this.maxTrials) {
        this.gameMode = "finished";
        this.ctPhase = "finished";
        return;
      }
    }

    this.armTimer("intermission", 500, () => this.nextPuzzle());
  }

  private clearTimers(): void {
    this.clearAllPausableTimers();
  }
}
