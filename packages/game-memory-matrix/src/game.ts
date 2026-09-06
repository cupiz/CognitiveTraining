import type { InputEvent } from "@cog/schemas";
import type { GameContext, GameSummary } from "@cog/game-core";
import { BaseGame, buildSummary, createRng, sample } from "@cog/game-core";
import { getDifficultyConfig, validateConfig, type MemoryMatrixConfig } from "./difficulty.js";

export const GAME_KEY = "memory_matrix" as const;
export const GAME_VERSION = "1.0.0" as const;

/** Game phases for the state machine */
type MMPhase =
  | "idle"
  | "practice"
  | "countdown"
  | "showing"      // Highlighting target cells
  | "waiting"      // Waiting for user to select cells
  | "feedback"     // Brief feedback after response
  | "paused"
  | "finished";

/** Cell position in the grid */
export interface Cell {
  row: number;
  col: number;
}

/** State for the renderer */
export interface MMRenderState {
  phase: MMPhase;
  gridRows: number;
  gridCols: number;
  highlightedCells: Cell[];
  selectedCells: Cell[];
  targetCells: Cell[];
  showTargets: boolean;
  showFeedback: boolean;
  feedbackCorrect: boolean;
  trialNumber: number;
  totalTrials: number;
  isPractice: boolean;
  score: number;
  timeLeft: number;
}

/**
 * Memory Matrix game implementation.
 *
 * Mechanic:
 * 1. Show a grid with N cells highlighted
 * 2. Hide highlights after exposure duration
 * 3. User taps cells they remember
 * 4. Check correctness
 * 5. Repeat for configured number of trials
 */
export class MemoryMatrixGame extends BaseGame {
  readonly key = GAME_KEY;
  readonly version = GAME_VERSION;

  private mmPhase: MMPhase = "idle";
  private gameMode: "practice" | "countdown" | "playing" | "finished" = "finished";
  private config: MemoryMatrixConfig = { gridRows: 3, gridCols: 3, targetCount: 2, exposureMs: 1500, responseDeadlineMs: 5000 };
  private rng: () => number = () => 0;

  // Trial state
  private targetCells: Cell[] = [];
  private selectedCells: Cell[] = [];
  private showTargets = false;
  private showFeedback = false;
  private feedbackCorrect = false;
  private trialTimer: ReturnType<typeof setTimeout> | null = null;
  private feedbackTimer: ReturnType<typeof setTimeout> | null = null;
  private deadlineTimer: ReturnType<typeof setTimeout> | null = null;

  // Pause state
  private pausedPhase: MMPhase = "idle";

  // Tracking
  private practiceCount = 0;
  private scoredCount = 0;
  private maxTrials = 20;
  private score = 0;
  private responseStartMs = 0;
  private isCurrentPracticeTrial = false;

  // ── Config ──────────────────────────────────────────────

  getConfig(difficulty: number): Record<string, unknown> {
    return getDifficultyConfig(difficulty) as unknown as Record<string, unknown>;
  }

  validateConfig(config: Record<string, unknown>): void {
    validateConfig(config as unknown as MemoryMatrixConfig);
  }

  // ── Lifecycle ───────────────────────────────────────────

  protected onStart(context: GameContext): void {
    this.config = getDifficultyConfig(context.difficulty) as MemoryMatrixConfig;
    this.rng = createRng(context.seed);
    this.maxTrials = context.maxTrials ?? 20;
    this.mmPhase = context.practiceTrials > 0 ? "practice" : "countdown";
    this.gameMode = context.practiceTrials > 0 ? "practice" : "countdown";

    this.beginTrial();
  }

  protected onInput(input: InputEvent): void {
    if (this.mmPhase === "showing" || this.mmPhase === "feedback") return;

    if (input.type === "pointer_down" || input.type === "touch") {
      this.handleCellTap(input);
    }
  }

  pause(): void {
    if (this.mmPhase === "idle" || this.mmPhase === "finished" || this.mmPhase === "paused") return;
    this.pausedPhase = this.mmPhase;
    this.mmPhase = "paused";
    this.freezePausableTimers();
  }

  resume(): void {
    if (this.mmPhase !== "paused") return;
    this.mmPhase = this.pausedPhase;
    this.thawPausableTimers();
  }

  protected onPause(): void {}
  protected onResume(): void {}

  protected onFinish(): GameSummary {
    this.clearTimers();
    this.mmPhase = "finished";

    return buildSummary(
      { key: this.key, version: this.version, config: this.config as unknown as Record<string, unknown> },
      this.trials,
    );
  }

  getPhase() {
    if (this.mmPhase === "idle") return "idle";
    if (this.mmPhase === "paused") return "paused";
    return this.gameMode;
  }

  // ── Render state ────────────────────────────────────────

  getRenderState(): Record<string, unknown> {
    return {
      phase: this.mmPhase,
      gridRows: this.config.gridRows,
      gridCols: this.config.gridCols,
      highlightedCells: this.targetCells,
      selectedCells: this.selectedCells,
      targetCells: this.targetCells,
      showTargets: this.showTargets,
      showFeedback: this.showFeedback,
      feedbackCorrect: this.feedbackCorrect,
      trialNumber: this.scoredCount + this.practiceCount,
      totalTrials: this.maxTrials,
      isPractice: this.gameMode === "practice",
      score: this.score,
      timeLeft: 0,
    } satisfies MMRenderState;
  }

  // ── Trial logic ─────────────────────────────────────────

  private beginTrial(): void {
    const allCells: Cell[] = [];
    for (let r = 0; r < this.config.gridRows; r++) {
      for (let c = 0; c < this.config.gridCols; c++) {
        allCells.push({ row: r, col: c });
      }
    }

    // Select random target cells
    this.targetCells = sample(allCells, this.config.targetCount, this.rng);
    this.selectedCells = [];
    this.showTargets = true;
    this.showFeedback = false;

    const isPractice = this.gameMode === "practice";
    this.isCurrentPracticeTrial = isPractice;
    const trial = this.trials.startTrial({
      isPractice,
      exposureMs: this.config.exposureMs,
    });

    // Emit trial_started
    this.emitTrialStarted(trial.trialId, {
      gridRows: this.config.gridRows,
      gridCols: this.config.gridCols,
      targetCount: this.config.targetCount,
      exposureMs: this.config.exposureMs,
      seed: Math.round(this.rng() * 100000),
    });

    this.mmPhase = "showing";

    // After exposure, hide targets and start response window
    this.armTimer("exposure", this.config.exposureMs, () => {
      this.showTargets = false;
      this.trials.markStimulusHidden();
      this.mmPhase = "waiting";
      this.responseStartMs = performance.now();

      // Emit stimulus_hidden
      this.emit("stimulus_hidden", { trialId: trial.trialId });

      // Start response deadline
      this.armTimer("deadline", this.config.responseDeadlineMs, () => {
        this.handleTimeout();
      });
    });
  }

  private handleCellTap(input: InputEvent): void {
    if (this.mmPhase !== "waiting") return;

    // Determine which cell was tapped
    // The renderer should pass cell info via the input payload
    // For now, we use a simplified approach: the renderer adds cell info to the event
    const cell = extractCellFromInput(input, this.config.gridRows, this.config.gridCols);
    if (!cell) return;

    // Check if already selected
    const alreadySelected = this.selectedCells.some(
      (c) => c.row === cell.row && c.col === cell.col,
    );
    if (alreadySelected) {
      // Deselect
      this.selectedCells = this.selectedCells.filter(
        (c) => c.row !== cell.row || c.col !== cell.col,
      );
    } else {
      this.selectedCells.push(cell);
    }

    // Check if user has selected enough cells (optional: auto-submit when targetCount reached)
    if (this.selectedCells.length >= this.config.targetCount) {
      this.submitResponse();
    }
  }

  private submitResponse(): void {
    if (this.mmPhase !== "waiting") return;

    this.clearTimers();
    this.mmPhase = "feedback";

    // Calculate correctness
    const selectedSet = new Set(this.selectedCells.map((c) => `${c.row},${c.col}`));

    let correctCount = 0;
    for (const t of this.targetCells) {
      if (selectedSet.has(`${t.row},${t.col}`)) correctCount++;
    }

    const isCorrect = correctCount === this.targetCells.length &&
      this.selectedCells.length === this.targetCells.length;

    const responseMs = Math.round(performance.now() - this.responseStartMs);

    // Record response
    this.trials.respond(isCorrect, {
      selectedCells: this.selectedCells,
      correctCells: this.targetCells,
      reactionTimeMs: responseMs,
      correctCount,
    });

    // Emit response
    const trial = this.trials.completedTrials[this.trials.completedTrials.length - 1];
    if (trial) {
      this.emitResponse(trial.trialId, {
        selectedCells: this.selectedCells.map((c) => c.row * this.config.gridCols + c.col),
        correctCells: this.targetCells.map((c) => c.row * this.config.gridCols + c.col),
        reactionTimeMs: responseMs,
        correct: isCorrect,
      });
    }

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
    if (this.mmPhase !== "waiting") return;

    this.clearTimers();
    this.mmPhase = "feedback";

    // No response = omission
    this.trials.respond(false, { selectedCells: [], timeout: true });

    const trial = this.trials.completedTrials[this.trials.completedTrials.length - 1];
    if (trial) {
      this.emitResponse(trial.trialId, {
        selectedCells: [],
        correctCells: this.targetCells.map((c) => c.row * this.config.gridCols + c.col),
        timeout: true,
        correct: false,
      });
    }

    this.feedbackCorrect = false;
    this.showFeedback = true;

    this.armTimer("feedback", 800, () => {
      this.trials.endTrial();
      this.nextTrial();
    });
  }

  private nextTrial(): void {
    this.showFeedback = false;
    this.selectedCells = [];

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
        this.mmPhase = "finished";
        return;
      }
    }

    this.armTimer("intermission", 500, () => {
      this.beginTrial();
    });
  }

  private clearTimers(): void {
    this.clearAllPausableTimers();
    if (this.trialTimer) clearTimeout(this.trialTimer);
    if (this.feedbackTimer) clearTimeout(this.feedbackTimer);
    if (this.deadlineTimer) clearTimeout(this.deadlineTimer);
    this.trialTimer = null;
    this.feedbackTimer = null;
    this.deadlineTimer = null;
  }
}

// ── Helpers ──────────────────────────────────────────────

/**
 * Extract cell position from an input event.
 * The renderer should pass the cell index as part of the event payload.
 * Falls back to a simplified coordinate-based mapping.
 */
function extractCellFromInput(
  input: InputEvent,
  gridRows: number,
  gridCols: number,
): Cell | null {
  // The renderer should inject a custom property with the cell index
  const payload = (input as Record<string, unknown>).cellIndex;
  if (typeof payload === "number") {
    const row = Math.floor(payload / gridCols);
    const col = payload % gridCols;
    if (row >= 0 && row < gridRows && col >= 0 && col < gridCols) {
      return { row, col };
    }
  }
  return null;
}
