import type { InputEvent } from "@cog/schemas";
import type { GameContext, GameSummary } from "@cog/game-core";
import { BaseGame, createRng } from "@cog/game-core";
import {
  getDifficultyConfig,
  validateConfig,
  generateBelt,
  SERVE_ZONE_LEFT,
  SERVE_ZONE_RIGHT,
  type SushiExpressConfig,
  type SushiPlate,
} from "./difficulty.js";

export const GAME_KEY = "sushi_express" as const;
export const GAME_VERSION = "0.1.0" as const;

/** Game phases for the state machine */
export type SXPhase =
  | "idle"
  | "practice"
  | "countdown"
  | "waiting" // belt running, plates to serve
  | "feedback"
  | "paused"
  | "finished";

/** State for the renderer */
export interface SXRenderState {
  phase: SXPhase;
  targetSushi: number;
  plates: SushiPlate[];
  servedPlateIds: number[];
  /** Last serve for an instant visual flash (plateId + whether it matched) */
  lastServe: { plateId: number; correct: boolean } | null;
  feedbackCorrect: boolean | null;
  /** Pause-adjusted ms since the belt started — drives plate positions */
  beltElapsedMs: number;
  trialNumber: number;
  totalTrials: number;
  isPractice: boolean;
  score: number;
  beltMs: number;
  spawnIntervalMs: number;
}

/**
 * Sushi Express game implementation.
 *
 * Mechanic:
 * 1. A customer order (one sushi type) is pinned to the order card.
 * 2. Plates ride a conveyor belt; each plate is tappable while inside the
 *    serve zone (engine and renderer share the same timing math, both
 *    pause-adjusted).
 * 3. Serving a target plate is a hit; serving a distractor is a commission;
 *    targets that pass unserved are omissions.
 *
 * @see docs/06_GAME_DESIGN.md — Flagship 5: Sushi Express
 */
export class SushiExpressGame extends BaseGame {
  readonly key = GAME_KEY;
  readonly version = GAME_VERSION;

  private sxPhase: SXPhase = "idle";
  private gameMode: "practice" | "countdown" | "playing" | "finished" = "practice";
  private config: SushiExpressConfig = {
    platesPerTrial: 7,
    sushiTypes: 3,
    targetProbability: 0.4,
    beltMs: 3300,
    spawnIntervalMs: 1300,
  };
  private rng: () => number = () => 0;

  // Trial state
  private targetSushi = 0;
  private plates: SushiPlate[] = [];
  private servedPlateIds: number[] = [];
  private lastServe: { plateId: number; correct: boolean } | null = null;
  private feedbackCorrect: boolean | null = null;
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

  // Metrics
  private servedTargets = 0;
  private totalTargets = 0;
  private distractorServes = 0;
  private serveRts: number[] = [];

  // Pause state
  private pausedPhase: SXPhase = "idle";

  // ── Config ──────────────────────────────────────────────

  getConfig(difficulty: number): Record<string, unknown> {
    return getDifficultyConfig(difficulty) as unknown as Record<string, unknown>;
  }

  validateConfig(config: Record<string, unknown>): void {
    validateConfig(config as unknown as SushiExpressConfig);
  }

  // ── Lifecycle ───────────────────────────────────────────

  protected onStart(context: GameContext): void {
    this.config = getDifficultyConfig(context.difficulty) as SushiExpressConfig;
    this.rng = createRng(context.seed);
    this.maxTrials = context.maxTrials ?? 12;
    this.sxPhase = context.practiceTrials > 0 ? "practice" : "countdown";
    this.gameMode = context.practiceTrials > 0 ? "practice" : "countdown";
    this.score = 0;
    this.clockSkew = 0;
    this.serveRts = [];

    this.beginTrial();
  }

  protected onInput(input: InputEvent): void {
    if (input.type !== "pointer_down" && input.type !== "touch") return;
    if (this.sxPhase !== "waiting") return;

    this.handleServe();
  }

  pause(): void {
    if (this.sxPhase === "idle" || this.sxPhase === "finished" || this.sxPhase === "paused") return;
    this.pauseAtMs = performance.now();
    this.pausedPhase = this.sxPhase;
    this.sxPhase = "paused";
    this.freezePausableTimers();
  }

  resume(): void {
    if (this.sxPhase !== "paused") return;
    this.clockSkew += performance.now() - this.pauseAtMs;
    this.sxPhase = this.pausedPhase;
    this.thawPausableTimers();
  }

  protected onPause(): void {}
  protected onResume(): void {}

  protected onFinish(): GameSummary {
    this.clearTimers();
    this.sxPhase = "finished";

    const rts = this.serveRts;
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
    if (this.sxPhase === "idle") return "idle";
    if (this.sxPhase === "paused") return "paused";
    return this.gameMode;
  }

  // ── Render state ────────────────────────────────────────

  getRenderState(): Record<string, unknown> {
    return {
      phase: this.sxPhase,
      targetSushi: this.targetSushi,
      plates: this.plates,
      servedPlateIds: this.servedPlateIds,
      lastServe: this.lastServe,
      feedbackCorrect: this.feedbackCorrect,
      beltElapsedMs:
        this.sxPhase === "waiting"
          ? Math.max(0, performance.now() - this.responseStartMs - this.clockSkew)
          : 0,
      trialNumber: this.scoredCount + this.practiceCount,
      totalTrials: this.maxTrials,
      isPractice: this.gameMode === "practice",
      score: this.score,
      beltMs: this.config.beltMs,
      spawnIntervalMs: this.config.spawnIntervalMs,
    } satisfies SXRenderState;
  }

  // ── Trial logic ─────────────────────────────────────────

  private beginTrial(): void {
    const belt = generateBelt(this.config, this.rng);
    this.targetSushi = belt.targetSushi;
    this.plates = belt.plates;
    this.servedPlateIds = [];
    this.lastServe = null;
    this.feedbackCorrect = null;
    this.servedTargets = 0;
    this.totalTargets = this.plates.filter((p) => p.isTarget).length;
    this.distractorServes = 0;

    const isPractice = this.gameMode === "practice";
    this.isCurrentPracticeTrial = isPractice;
    const trial = this.trials.startTrial({
      isPractice,
      exposureMs: this.beltEndMs(),
    });
    this.currentTrialId = trial.trialId;

    this.emitTrialStarted(trial.trialId, {
      targetCount: this.totalTargets,
      exposureMs: this.beltEndMs(),
      seed: Math.round(this.rng() * 100000),
      targetSushi: this.targetSushi,
    });

    this.sxPhase = "waiting";
    this.responseStartMs = performance.now();
    this.emit("stimulus_shown", { trialId: trial.trialId });

    this.armTimer("beltEnd", this.beltEndMs(), () => {
      this.finishRun();
    });
  }

  private handleServe(): void {
    const elapsed = Math.max(0, performance.now() - this.responseStartMs - this.clockSkew);

    // Which plate is inside the serve zone right now?
    let served: SushiPlate | null = null;
    for (const plate of this.plates) {
      if (this.servedPlateIds.includes(plate.id)) continue;
      const tIn = plate.id * this.config.spawnIntervalMs + SERVE_ZONE_LEFT * this.config.beltMs;
      const tOut = plate.id * this.config.spawnIntervalMs + SERVE_ZONE_RIGHT * this.config.beltMs;
      if (elapsed >= tIn && elapsed < tOut) {
        served = plate;
        break;
      }
    }
    if (!served) return; // tap outside any plate window — ignored

    this.servedPlateIds.push(served.id);
    const rt = Math.round(elapsed - (served.id * this.config.spawnIntervalMs + SERVE_ZONE_LEFT * this.config.beltMs));
    this.lastServe = { plateId: served.id, correct: served.isTarget };

    if (served.isTarget) {
      this.servedTargets++;
      this.serveRts.push(Math.max(0, rt));
    } else {
      this.distractorServes++;
    }
  }

  private finishRun(): void {
    if (this.sxPhase !== "waiting") return;
    this.clearTimers();
    this.sxPhase = "feedback";

    const missedTargets = this.totalTargets - this.servedTargets;
    const servedIds = [...this.servedPlateIds];
    const targetIds = this.plates.filter((p) => p.isTarget).map((p) => p.id);
    const meanRt =
      this.serveRts.length > 0
        ? Math.round(this.serveRts.reduce((a, b) => a + b, 0) / this.serveRts.length)
        : undefined;

    if (missedTargets > 0) {
      // Targets slid past unserved → omission.
      this.feedbackCorrect = false;
      this.emit("timeout", { trialId: this.currentTrialId });
    } else if (this.distractorServes > 0) {
      // Every target served, but a wrong plate was served → commission.
      this.feedbackCorrect = false;
      this.trials.respond(false, {
        selectedCells: servedIds,
        correctCells: targetIds,
        reactionTimeMs: meanRt,
      });
      this.emitResponse(this.currentTrialId, {
        selectedCells: servedIds,
        correctCells: targetIds,
        reactionTimeMs: meanRt,
        correct: false,
      });
    } else {
      // Perfect run.
      this.feedbackCorrect = true;
      this.score++;
      this.trials.respond(true, {
        selectedCells: servedIds,
        correctCells: targetIds,
        reactionTimeMs: meanRt,
      });
      this.emitResponse(this.currentTrialId, {
        selectedCells: servedIds,
        correctCells: targetIds,
        reactionTimeMs: meanRt,
        correct: true,
      });
    }

    this.armTimer("feedback", 1000, () => {
      this.trials.endTrial();
      this.nextTrial();
    });
  }

  private beltEndMs(): number {
    return (
      (this.config.platesPerTrial - 1) * this.config.spawnIntervalMs +
      SERVE_ZONE_RIGHT * this.config.beltMs +
      150
    );
  }

  private nextTrial(): void {
    this.lastServe = null;
    this.feedbackCorrect = null;

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
        this.sxPhase = "finished";
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

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}