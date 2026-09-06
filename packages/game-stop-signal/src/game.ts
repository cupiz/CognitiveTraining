import type { InputEvent } from "@cog/schemas";
import type { GameContext, GameSummary } from "@cog/game-core";
import { BaseGame, buildSummary, createRng } from "@cog/game-core";
import {
  getDifficultyConfig,
  validateConfig,
  isStopTrial,
  adaptSsd,
  type StopSignalConfig,
} from "./difficulty.js";

export const GAME_KEY = "stop_signal" as const;
export const GAME_VERSION = "1.0.0" as const;

/** Game phases for the state machine */
type SSPhase =
  | "idle"
  | "practice"
  | "countdown"
  | "fixation"      // Showing fixation cross
  | "go"            // Go stimulus shown, waiting for response
  | "stop"          // Stop signal shown, should NOT respond
  | "feedback"      // Brief feedback after response
  | "intermission"  // Brief pause between trials
  | "paused"
  | "finished";

/** State for the renderer */
export interface SSRenderState {
  phase: SSPhase;
  /** Direction of go stimulus: "left" or "right" */
  goDirection: "left" | "right" | null;
  /** Whether this is a stop trial */
  isStopTrial: boolean;
  /** Whether stop signal is showing */
  showStopSignal: boolean;
  /** Whether user responded */
  responded: boolean;
  /** Whether response was correct */
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
  goTrials: number;
  stopTrials: number;
  correctGos: number;
  failedStops: number;
  successfulStops: number;
  /** Current SSD (ms) */
  currentSsdMs: number;
}

/**
 * Stop Signal game implementation.
 *
 * Mechanic:
 * 1. Go signal appears (arrow pointing left/right)
 * 2. User must respond quickly by tapping the correct side
 * 3. Occasionally, a stop signal (red X) appears after a delay
 * 4. If stop signal appears, user must NOT respond
 * 5. SSD adapts: shorter if user stops successfully, longer if they fail
 *
 * Metrics:
 * - go RT (reaction time on go trials)
 * - go accuracy (correct direction on go trials)
 * - failed stops (responded when should have inhibited)
 * - successful stops (inhibited when stop signal appeared)
 * - stop-signal delay (SSD)
 */
export class StopSignalGame extends BaseGame {
  readonly key = GAME_KEY;
  readonly version = GAME_VERSION;

  private ssPhase: SSPhase = "idle";
  private gameMode: "practice" | "countdown" | "playing" | "finished" = "practice";
  private config: StopSignalConfig = {
    stopTrialProportion: 0.3,
    initialStopSignalDelayMs: 400,
    ssdStepMs: 40,
    minSsdMs: 120,
    maxSsdMs: 800,
    goStimulusDurationMs: 1700,
    goDeadlineMs: 2500,
  };
  private rng: () => number = () => 0;

  // Trial state
  private currentIsStopTrial = false;
  private goDirection: "left" | "right" = "left";
  private showStopSignal = false;
  private responded = false;
  private responseCorrect: boolean | null = null;
  private feedbackMessage = "";

  // Adaptive SSD
  private currentSsd = 400;

  // Timers
  private fixationTimer: ReturnType<typeof setTimeout> | null = null;
  private stopSignalTimer: ReturnType<typeof setTimeout> | null = null;
  private deadlineTimer: ReturnType<typeof setTimeout> | null = null;
  private feedbackTimer: ReturnType<typeof setTimeout> | null = null;
  private intermissionTimer: ReturnType<typeof setTimeout> | null = null;

  // Pause state
  private pausedPhase: SSPhase = "idle";

  // Tracking
  private practiceCount = 0;
  private scoredCount = 0;
  private maxTrials = 30;
  private score = 0;
  private responseStartMs = 0;
  private isCurrentPracticeTrial = false;

  // Metrics for summary
  private goTrials = 0;
  private stopTrials = 0;
  private correctGos = 0;
  private incorrectGos = 0;
  private successfulStops = 0;
  private failedStops = 0;
  private goRts: number[] = [];

  // ── Config ──────────────────────────────────────────────

  getConfig(difficulty: number): Record<string, unknown> {
    return getDifficultyConfig(difficulty) as unknown as Record<string, unknown>;
  }

  validateConfig(config: Record<string, unknown>): void {
    validateConfig(config as unknown as StopSignalConfig);
  }

  // ── Lifecycle ───────────────────────────────────────────

  protected onStart(context: GameContext): void {
    this.config = getDifficultyConfig(context.difficulty) as StopSignalConfig;
    this.rng = createRng(context.seed);
    this.maxTrials = context.maxTrials ?? 30;
    this.currentSsd = this.config.initialStopSignalDelayMs;

    this.goTrials = 0;
    this.stopTrials = 0;
    this.correctGos = 0;
    this.incorrectGos = 0;
    this.successfulStops = 0;
    this.failedStops = 0;
    this.goRts = [];
    this.score = 0;
    this.ssPhase = context.practiceTrials > 0 ? "practice" : "countdown";
    this.gameMode = context.practiceTrials > 0 ? "practice" : "countdown";

    this.beginTrial();
  }

  protected onInput(input: InputEvent): void {
    if (this.ssPhase !== "go" && this.ssPhase !== "stop") return;
    if (this.responded) return;

    if (input.type === "pointer_down" || input.type === "touch") {
      // Determine direction from input coordinates
      const direction = this.inferDirection(input);
      this.handleResponse(direction);
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

    return buildSummary(
      { key: this.key, version: this.version, config: this.config as unknown as Record<string, unknown> },
      this.trials,
      { rts: this.goRts },
    );
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
      goDirection: this.goDirection,
      isStopTrial: this.currentIsStopTrial,
      showStopSignal: this.showStopSignal,
      responded: this.responded,
      responseCorrect: this.responseCorrect,
      feedbackMessage: this.feedbackMessage,
      trialNumber: this.scoredCount + this.practiceCount,
      totalTrials: this.maxTrials,
      isPractice: this.gameMode === "practice",
      score: this.score,
      goTrials: this.goTrials,
      stopTrials: this.stopTrials,
      correctGos: this.correctGos,
      failedStops: this.failedStops,
      successfulStops: this.successfulStops,
      currentSsdMs: this.currentSsd,
    } satisfies SSRenderState;
  }

  // ── Trial logic ─────────────────────────────────────────

  private beginTrial(): void {
    // Determine trial type
    this.currentIsStopTrial = isStopTrial(this.config, this.rng);

    // Random direction for go signal
    this.goDirection = this.rng() < 0.5 ? "left" : "right";
    this.showStopSignal = false;
    this.responded = false;
    this.responseCorrect = null;
    this.feedbackMessage = "";

    const isPractice = this.gameMode === "practice";
    this.isCurrentPracticeTrial = isPractice;
    const trialRecord = this.trials.startTrial({
      isPractice,
      exposureMs: this.config.goStimulusDurationMs,
    });

    // Emit trial_started
    this.emitTrialStarted(trialRecord.trialId, {
      isStopTrial: this.currentIsStopTrial,
      goDirection: this.goDirection,
      stopSignalDelayMs: this.config.initialStopSignalDelayMs,
      seed: Math.round(this.rng() * 100000),
    });

    // Fixation phase (500ms)
    this.ssPhase = "fixation";
    this.armTimer("fixation", 500, () => {
      // Go phase begins
      this.ssPhase = "go";
      this.responseStartMs = performance.now();

      if (this.currentIsStopTrial) {
        // Schedule stop signal
        this.armTimer("stopSignal", this.currentSsd, () => {
          this.showStopSignal = true;
          this.ssPhase = "stop";

          const trial = this.trials.completedTrials[this.trials.completedTrials.length - 1];
          if (trial) {
            // "stimulus_shown" (schema-enum) — the stop onset; isStopSignal marks it.
            this.emit("stimulus_shown", {
              trialId: trial.trialId,
              stopSignalDelayMs: this.currentSsd,
              isStopSignal: true,
            });
          }
        });
      }

      // Response deadline
      this.armTimer("deadline", this.config.goDeadlineMs, () => {
        this.handleTimeout();
      });
    });
  }

  private inferDirection(input: InputEvent): "left" | "right" {
    // GameShell injects cellIndex: 0 = left, 1 = right
    const cellIdx = (input as Record<string, unknown>).cellIndex;
    if (typeof cellIdx === "number") {
      return cellIdx === 0 ? "left" : "right";
    }
    // Fallback: use x coordinate
    const x = (input as Record<string, unknown>).x;
    if (typeof x === "number") {
      return x < 500 ? "left" : "right";
    }
    return "right";
  }

  private handleResponse(direction: "left" | "right"): void {
    if (this.responded) return;

    this.responded = true;
    this.clearTimers();

    const rt = Math.round(performance.now() - this.responseStartMs);
    const isGoTrial = !this.currentIsStopTrial;
    const isStopSignalShowing = this.showStopSignal;

    if (isGoTrial) {
      // Go trial — response expected
      const isCorrect = direction === this.goDirection;
      this.goTrials++;

      if (isCorrect) {
        this.correctGos++;
        this.goRts.push(rt);
        this.responseCorrect = true;
        this.feedbackMessage = "✓ Correct!";
        this.score++;
      } else {
        this.incorrectGos++;
        this.responseCorrect = false;
        this.feedbackMessage = "✗ Wrong direction!";
      }

      this.trials.respond(isCorrect, {
        selectedOption: direction,
        correctOption: this.goDirection,
        reactionTimeMs: rt,
      });

      const trial = this.trials.completedTrials[this.trials.completedTrials.length - 1];
      if (trial) {
        this.emitResponse(trial.trialId, {
          goDirection: this.goDirection,
          responseDirection: direction,
          correct: isCorrect,
          reactionTimeMs: rt,
          outcome: isCorrect ? "correct_go" : "incorrect_go",
        });
      }
    } else {
      // Stop trial — should NOT respond
      if (isStopSignalShowing) {
        // User responded during stop signal — failed stop
        this.failedStops++;
        this.responseCorrect = false;
        this.feedbackMessage = "✗ Should have stopped!";

        const trial = this.trials.completedTrials[this.trials.completedTrials.length - 1];
        if (trial) {
          this.emitResponse(trial.trialId, {
            goDirection: this.goDirection,
            responseDirection: direction,
            correct: false,
            reactionTimeMs: rt,
            outcome: "failed_stop",
            stopSignalDelayMs: this.currentSsd,
          });
        }
      } else {
        // User responded before stop signal — it's a go response
        this.failedStops++;
        this.responseCorrect = false;
        this.feedbackMessage = "✗ Should have stopped!";

        const trial = this.trials.completedTrials[this.trials.completedTrials.length - 1];
        if (trial) {
          this.emitResponse(trial.trialId, {
            goDirection: this.goDirection,
            responseDirection: direction,
            correct: false,
            reactionTimeMs: rt,
            outcome: "failed_stop",
            stopSignalDelayMs: this.currentSsd,
          });
        }
      }

      this.trials.respond(false, {
        selectedOption: direction,
        correctOption: "hold",
        reactionTimeMs: rt,
      });

      // Adapt SSD (user failed → make it easier)
      this.currentSsd = adaptSsd(this.config, this.currentSsd, false);
    }

    this.stopTrials++;
    this.ssPhase = "feedback";
    this.armTimer("feedback", 600, () => {
      this.trials.endTrial();
      this.nextTrial();
    });
  }

  private handleTimeout(): void {
    if (this.responded) return;

    this.responded = true;
    this.clearTimers();

    const isGoTrial = !this.currentIsStopTrial;

    if (isGoTrial) {
      // Go trial — timeout is an omission
      this.goTrials++;
      this.incorrectGos++;
      this.responseCorrect = false;
      this.feedbackMessage = "⏰ Too slow!";

      const trial = this.trials.completedTrials[this.trials.completedTrials.length - 1];
      if (trial) {
        this.emitResponse(trial.trialId, {
          goDirection: this.goDirection,
          responseDirection: null,
          correct: false,
          reactionTimeMs: this.config.goDeadlineMs,
          outcome: "go_timeout",
        });
      }
    } else {
      // Stop trial — no response is correct!
      this.stopTrials++;
      this.successfulStops++;
      this.responseCorrect = true;
      this.feedbackMessage = "✓ Good inhibition!";

      this.trials.respond(true, {
        selectedOption: "hold",
        correctOption: "hold",
      });

      // Adapt SSD (user succeeded → make it harder)
      this.currentSsd = adaptSsd(this.config, this.currentSsd, true);

      const trial = this.trials.completedTrials[this.trials.completedTrials.length - 1];
      if (trial) {
        this.emitResponse(trial.trialId, {
          goDirection: this.goDirection,
          responseDirection: null,
          correct: true,
          outcome: "successful_stop",
          stopSignalDelayMs: this.currentSsd,
        });
      }
    }

    this.ssPhase = "feedback";
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
        this.ssPhase = "finished";
        return;
      }
    }

    this.armTimer("intermission", 400, () => {
      this.beginTrial();
    });
  }

  private clearTimers(): void {
    this.clearAllPausableTimers();
    if (this.fixationTimer) clearTimeout(this.fixationTimer);
    if (this.stopSignalTimer) clearTimeout(this.stopSignalTimer);
    if (this.deadlineTimer) clearTimeout(this.deadlineTimer);
    if (this.feedbackTimer) clearTimeout(this.feedbackTimer);
    if (this.intermissionTimer) clearTimeout(this.intermissionTimer);
    this.fixationTimer = null;
    this.stopSignalTimer = null;
    this.deadlineTimer = null;
    this.feedbackTimer = null;
    this.intermissionTimer = null;
  }
}
