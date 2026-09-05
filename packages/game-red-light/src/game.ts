import type { InputEvent } from "@cog/schemas";
import type { GameContext, GameSummary } from "@cog/game-core";
import { BaseGame, createRng } from "@cog/game-core";
import {
  getDifficultyConfig,
  validateConfig,
  isStopTrial,
  adaptSsd,
  STOP_WINDOW_MS,
  type RedLightConfig,
} from "./difficulty.js";

export const GAME_KEY = "red_light" as const;
export const GAME_VERSION = "0.1.0" as const;

/** Game phases for the state machine */
export type RLPhase =
  | "idle"
  | "practice"
  | "countdown"
  | "ready"        // "Siap..." — tapping here is a false start (excluded trial)
  | "go"           // green lamp, runner sprints, tap to run
  | "stop"         // red lamp, runner must freeze for the stop window
  | "feedback"     // brief feedback after response
  | "intermission" // brief pause between trials
  | "paused"
  | "finished";

/** State for the renderer */
export interface RLRenderState {
  phase: RLPhase;
  /** Whether this is a stop trial */
  isStopTrial: boolean;
  /** Whether the red lamp is showing */
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
  /** Go deadline for the current trial (ms) — renderer syncs the sprint */
  goDeadlineMs: number;
  /** Stop window duration (ms) */
  stopWindowMs: number;
  /** Current trial's "Siap..." countdown duration (ms) */
  readyMs: number;
}

/**
 * Red Light (Lampu Merah!) game implementation.
 *
 * Mechanic:
 * 1. "Siap..." countdown — tapping here is a false start: kind warning +
 *    TOO_FAST_RESPONSE quality flag, trial excluded, never punished.
 * 2. Green lamp → tap as fast as possible (go trials).
 * 3. Stop trials: the lamp flips red after a variable SSD; withhold any tap
 *    for the stop window (1000ms).
 * 4. SSD staircase: successful stop → shorter SSD (harder); failed stop →
 *    longer SSD (easier). Clamped to [minSsdMs, maxSsdMs].
 *
 * @see docs/06_GAME_DESIGN.md — Flagship 2: Red Light
 */
export class RedLightGame extends BaseGame {
  readonly key = GAME_KEY;
  readonly version = GAME_VERSION;

  private rlPhase: RLPhase = "idle";
  private gameMode: "practice" | "countdown" | "playing" | "finished" = "practice";
  private config: RedLightConfig = {
    stopTrialProportion: 0.3,
    initialStopSignalDelayMs: 430,
    ssdStepMs: 40,
    minSsdMs: 120,
    maxSsdMs: 900,
    goStimulusDurationMs: 1700,
    goDeadlineMs: 2500,
  };
  private rng: () => number = () => 0;

  // Trial state
  private currentIsStopTrial = false;
  private showStopSignal = false;
  private responded = false;
  private responseCorrect: boolean | null = null;
  private feedbackMessage = "";
  private goCueAt = 0;
  private readyMs = 800;
  private currentTrialId = "";

  // Adaptive SSD
  private currentSsd = 430;

  // Pause state
  private pausedPhase: RLPhase = "idle";

  // Tracking
  private practiceCount = 0;
  private scoredCount = 0;
  private maxTrials = 28;
  private score = 0;
  private isCurrentPracticeTrial = false;

  // Metrics for summary
  private goTrials = 0;
  private stopTrials = 0;
  private correctGos = 0;
  private failedStops = 0;
  private successfulStops = 0;
  private goRts: number[] = [];

  // ── Config ──────────────────────────────────────────────

  getConfig(difficulty: number): Record<string, unknown> {
    return getDifficultyConfig(difficulty) as unknown as Record<string, unknown>;
  }

  validateConfig(config: Record<string, unknown>): void {
    validateConfig(config as unknown as RedLightConfig);
  }

  // ── Lifecycle ───────────────────────────────────────────

  protected onStart(context: GameContext): void {
    this.config = getDifficultyConfig(context.difficulty) as RedLightConfig;
    this.rng = createRng(context.seed);
    this.maxTrials = context.maxTrials ?? 28;
    this.currentSsd = this.config.initialStopSignalDelayMs;

    this.goTrials = 0;
    this.stopTrials = 0;
    this.correctGos = 0;
    this.failedStops = 0;
    this.successfulStops = 0;
    this.goRts = [];
    this.score = 0;
    this.rlPhase = context.practiceTrials > 0 ? "practice" : "countdown";
    this.gameMode = context.practiceTrials > 0 ? "practice" : "countdown";

    this.beginTrial();
  }

  protected onInput(input: InputEvent): void {
    if (input.type !== "pointer_down" && input.type !== "touch") return;

    // False start — tapping during "Siap..." excludes the trial (kindly).
    if (this.rlPhase === "ready") {
      this.handleEarlyTap();
      return;
    }

    if (this.rlPhase !== "go" && this.rlPhase !== "stop") return;
    if (this.responded) return;

    this.handleRun();
  }

  pause(): void {
    if (this.rlPhase === "idle" || this.rlPhase === "finished" || this.rlPhase === "paused") return;
    this.pausedPhase = this.rlPhase;
    this.rlPhase = "paused";
    this.freezePausableTimers();
  }

  resume(): void {
    if (this.rlPhase !== "paused") return;
    this.rlPhase = this.pausedPhase;
    this.thawPausableTimers();
  }

  protected onPause(): void {}
  protected onResume(): void {}

  protected onFinish(): GameSummary {
    this.clearTimers();
    this.rlPhase = "finished";

    const medianRt = this.goRts.length > 0 ? median(this.goRts) : undefined;
    const meanRt =
      this.goRts.length > 0 ? this.goRts.reduce((a, b) => a + b, 0) / this.goRts.length : undefined;
    const rtVar = this.goRts.length > 1 ? stdDev(this.goRts) : undefined;

    const goAccuracy = this.goTrials > 0 ? this.correctGos / this.goTrials : 0;

    return {
      gameKey: this.key,
      gameVersion: this.version,
      config: this.config as unknown as Record<string, unknown>,
      totalTrials: this.trials.totalTrials,
      validTrials: this.trials.scoredTrialCount,
      accuracy: goAccuracy,
      medianRtMs: medianRt,
      meanRtMs: meanRt,
      rtVariability: rtVar,
      omissionErrors: this.trials.omissionErrors,
      commissionErrors: this.trials.commissionErrors,
      qualityFlags: this.trials.allQualityFlags,
    };
  }

  getPhase() {
    if (this.rlPhase === "idle") return "idle";
    if (this.rlPhase === "paused") return "paused";
    return this.gameMode;
  }

  // ── Render state ────────────────────────────────────────

  getRenderState(): Record<string, unknown> {
    return {
      phase: this.rlPhase,
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
      goDeadlineMs: this.config.goDeadlineMs,
      stopWindowMs: STOP_WINDOW_MS,
      readyMs: this.readyMs,
    } satisfies RLRenderState;
  }

  // ── Trial logic ─────────────────────────────────────────

  private beginTrial(): void {
    // Trial kind: go or stop (revealed in response.correctOption).
    this.currentIsStopTrial = isStopTrial(this.config, this.rng);
    this.showStopSignal = false;
    this.responded = false;
    this.responseCorrect = null;
    this.feedbackMessage = "";

    // "Siap..." duration varies a little so the go cue never becomes robotic.
    this.readyMs = 700 + Math.floor(this.rng() * 500);

    this.rlPhase = "ready";
    this.armTimer("ready", this.readyMs, () => {
      this.startGoCue();
    });
  }

  private startGoCue(): void {
    this.rlPhase = "go";
    this.goCueAt = performance.now();

    const isPractice = this.gameMode === "practice";
    this.isCurrentPracticeTrial = isPractice;
    const trial = this.trials.startTrial({
      isPractice,
      exposureMs: this.config.goStimulusDurationMs,
    });
    this.currentTrialId = trial.trialId;

    // trial_started — trial kind is revealed later in response.correctOption.
    this.emitTrialStarted(trial.trialId, {
      seed: Math.round(this.rng() * 100000),
    });

    if (this.currentIsStopTrial) {
      // The lamp will flip red after the current SSD.
      this.armTimer("stopSignal", this.currentSsd, () => {
        this.showStopSignal = true;
        this.rlPhase = "stop";
        this.clearAllPausableTimers(); // cancel the go deadline — only a hold counts now

        // stimulus_shown marks the red onset (same pattern as the stop-signal family).
        this.emit("stimulus_shown", {
          trialId: this.currentTrialId,
          stopSignalDelayMs: this.currentSsd,
          isStopSignal: true,
        });

        // Withhold for the stop window → successful stop.
        this.armTimer("stopWindow", STOP_WINDOW_MS, () => {
          this.handleTimeout();
        });
      });
    }

    // Response deadline (go trials). Canceled when the red lamp appears.
    this.armTimer("deadline", this.config.goDeadlineMs, () => {
      this.handleTimeout();
    });
  }

  private handleRun(): void {
    if (this.responded) return;

    this.responded = true;
    this.clearTimers();

    const rt = Math.round(performance.now() - this.goCueAt);
    const isStopTrial = this.currentIsStopTrial;

    if (!isStopTrial) {
      // Go trial — tapping is correct (they ran on green).
      this.goTrials++;
      this.correctGos++;
      this.goRts.push(rt);
      this.score++;
      this.responseCorrect = true;
      this.feedbackMessage = "Mantap! Lari kencang!";

      this.trials.respond(true, {
        selectedOption: "run",
        correctOption: "run",
        reactionTimeMs: rt,
      });
      this.emitResponse(this.currentTrialId, {
        correct: true,
        reactionTimeMs: rt,
        responded: true,
        selectedOption: "run",
        correctOption: "run",
        stopped: false,
      });
    } else {
      // Stop trial — tapping means they ran when they should have frozen.
      this.stopTrials++;
      this.failedStops++;
      this.responseCorrect = false;
      this.feedbackMessage = "Tahan dulu ya — lampunya merah!";

      // Failed stop → make it easier next time.
      this.currentSsd = adaptSsd(this.config, this.currentSsd, false);

      this.trials.respond(false, {
        selectedOption: "run",
        correctOption: "hold",
        reactionTimeMs: rt,
      });
      this.emitResponse(this.currentTrialId, {
        correct: false,
        reactionTimeMs: rt,
        responded: true,
        selectedOption: "run",
        correctOption: "hold",
        stopped: false,
        stopSignalDelayMs: this.currentSsd,
      });
    }

    this.rlPhase = "feedback";
    this.armTimer("feedback", 800, () => {
      this.trials.endTrial();
      this.nextTrial();
    });
  }

  private handleTimeout(): void {
    if (this.responded) return;

    this.responded = true;
    this.clearTimers();

    if (!this.currentIsStopTrial) {
      // Go trial — no tap before the deadline is an omission.
      this.goTrials++;
      this.responseCorrect = false;
      this.feedbackMessage = "Telat — lampu hijaunya sudah padam!";

      // Deliberately no trials.respond(): the tracker records an omission.
      this.emit("timeout", { trialId: this.currentTrialId });
    } else {
      // Stop trial — held through the stop window: successful stop.
      this.stopTrials++;
      this.successfulStops++;
      this.score++;
      this.responseCorrect = true;
      this.feedbackMessage = "Pinter! Diam pas lampu merah!";

      // Successful stop → make it harder next time.
      this.currentSsd = adaptSsd(this.config, this.currentSsd, true);

      this.trials.respond(true, {
        selectedOption: "hold",
        correctOption: "hold",
      });
      this.emitResponse(this.currentTrialId, {
        correct: true,
        responded: false,
        selectedOption: "hold",
        correctOption: "hold",
        stopped: true,
        stopSignalDelayMs: this.currentSsd,
      });
    }

    this.rlPhase = "feedback";
    this.armTimer("feedback", 800, () => {
      this.trials.endTrial();
      this.nextTrial();
    });
  }

  private handleEarlyTap(): void {
    // False start — excluded trial, gentle warning, never punished.
    this.clearTimers();
    this.emitQualityFlag("TOO_FAST_RESPONSE", {
      reason: "tap_during_countdown",
      gameKey: this.key,
    });
    this.feedbackMessage = "Tahan dulu ya — tunggu lampu hijau!";
    this.responseCorrect = null;
    this.rlPhase = "feedback";
    this.armTimer("feedback", 900, () => {
      this.beginTrial();
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
        this.rlPhase = "finished";
        return;
      }
    }

    this.armTimer("intermission", 400, () => {
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