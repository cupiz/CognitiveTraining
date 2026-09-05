import type { InputEvent } from "@cog/schemas";
import type { GameContext, GameSummary } from "@cog/game-core";
import { BaseGame, createRng } from "@cog/game-core";
import {
  getDifficultyConfig,
  validateConfig,
  type WideViewConfig,
} from "./difficulty.js";

export const GAME_KEY = "wide_view" as const;
export const GAME_VERSION = "0.1.0" as const;

export type WVPhase =
  | "idle"
  | "practice"
  | "countdown"
  | "fixation" // central mini-task runs; the peripheral target flashes once
  | "probe" // tap where the target flashed
  | "feedback"
  | "paused"
  | "finished";

export interface WVRenderState {
  phase: WVPhase;
  /** Symbol currently shown in the central mini-task (null between symbols) */
  centralSymbol: string | null;
  /** True when the current central symbol is the go target */
  centralIsTarget: boolean;
  /** Slot index (0–7) currently flashing, or -1 */
  flashPosition: number;
  /** True while the peripheral target is on screen */
  flashActive: boolean;
  /** Child's probed slot during the probe phase (-1 = none yet) */
  probedSlot: number;
  /** Revealed correct slot during feedback (-1 otherwise) */
  correctSlot: number;
  /** Whether the peripheral tap (central go) was correct, when centralTask */
  centralHit: boolean | null;
  feedbackKind: "correct" | "wrong" | "miss" | null;
  trialNumber: number;
  totalTrials: number;
  isPractice: boolean;
  score: number;
  deadlineMs: number;
}

const SYMBOLS = ["▲", "●", "■", "◆", "★"];
const PROBE_SLOTS = 8;

/**
 * Binocular — a kid-friendly Useful Field of View task (visual scanning).
 *
 * While a small symbol stream runs in the centre, a bird flashes once at a
 * random slot around the ring. Then the child taps the slot where it flashed.
 * The central mini-task is a go/no-go: tap only when the target symbol shows.
 */
export class WideViewGame extends BaseGame {
  readonly key = GAME_KEY;
  readonly version = GAME_VERSION;

  private wvPhase: WVPhase = "idle";
  private gameMode: "practice" | "countdown" | "playing" | "finished" = "practice";
  private config: WideViewConfig = {
    flashMs: 400,
    centralMs: 2400,
    centralIntervalMs: 800,
    centralTask: false,
  };
  private rng: () => number = () => 0;

  // Trial state
  private centralSymbol: string | null = null;
  private centralIsTarget = false;
  private centralHit: boolean | null = null;
  private centralResponded = false;
  private flashPosition = -1;
  private flashActive = false;
  private flashSlot = -1;
  private probedSlot = -1;
  private correctSlot = -1;
  private feedbackKind: WVRenderState["feedbackKind"] = null;
  private trialNumber = 0;
  private score = 0;
  private currentTrialId = "";

  // Tracking
  private practiceCount = 0;
  private scoredCount = 0;
  private maxTrials = 12;
  private isCurrentPracticeTrial = false;

  // Pause state
  private pausedPhase: WVPhase = "idle";

  // ── Config ──────────────────────────────────────────────

  getConfig(difficulty: number): Record<string, unknown> {
    return getDifficultyConfig(difficulty) as unknown as Record<string, unknown>;
  }

  validateConfig(config: Record<string, unknown>): void {
    validateConfig(config as unknown as WideViewConfig);
  }

  // ── Lifecycle ───────────────────────────────────────────

  protected onStart(context: GameContext): void {
    this.config = getDifficultyConfig(context.difficulty) as WideViewConfig;
    this.rng = createRng(context.seed);
    this.maxTrials = context.maxTrials ?? 12;
    this.centralSymbol = null;
    this.centralIsTarget = false;
    this.centralHit = null;
    this.centralResponded = false;
    this.flashPosition = -1;
    this.flashActive = false;
    this.probedSlot = -1;
    this.correctSlot = -1;
    this.feedbackKind = null;
    this.trialNumber = 0;
    this.score = 0;

    this.wvPhase = context.practiceTrials > 0 ? "practice" : "countdown";
    this.gameMode = context.practiceTrials > 0 ? "practice" : "playing";

    this.nextTrial();
  }

  protected onInput(input: InputEvent): void {
    if (input.type !== "pointer_down" && input.type !== "touch") return;
    const payload = (input as Record<string, unknown>).cellIndex;

    if (this.wvPhase === "fixation" && this.config.centralTask) {
      if (this.centralResponded) return;
      this.centralResponded = true;
      this.centralHit = this.centralIsTarget;
      if (this.centralIsTarget) {
        // Correct go — acknowledged silently; no state change needed.
        this.emit("custom", { kind: "central_go_correct", trialId: this.currentTrialId });
      } else {
        this.emit("custom", { kind: "central_go_wrong", trialId: this.currentTrialId });
      }
      return;
    }

    if (this.wvPhase === "probe") {
      const slot = typeof payload === "number" ? Math.floor(payload) : -1;
      if (slot < 0 || slot >= PROBE_SLOTS) return;
      this.probedSlot = slot;
      this.finishTrial();
    }
  }

  pause(): void {
    if (this.wvPhase === "idle" || this.wvPhase === "finished" || this.wvPhase === "paused") return;
    this.pausedPhase = this.wvPhase;
    this.wvPhase = "paused";
    this.freezePausableTimers();
  }

  resume(): void {
    if (this.wvPhase !== "paused") return;
    this.wvPhase = this.pausedPhase;
    this.thawPausableTimers();
  }

  protected onFinish(): GameSummary {
    this.clearTimers();
    this.wvPhase = "finished";

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
    if (this.wvPhase === "idle" || this.wvPhase === "finished") return this.wvPhase;
    if (this.wvPhase === "paused") return "paused";
    return this.gameMode;
  }

  // ── Render state ────────────────────────────────────────

  getRenderState(): Record<string, unknown> {
    return {
      phase: this.wvPhase,
      centralSymbol: this.wvPhase === "fixation" ? this.centralSymbol : null,
      centralIsTarget: this.centralIsTarget,
      flashPosition: this.flashActive ? this.flashPosition : -1,
      flashActive: this.flashActive,
      probedSlot: this.probedSlot,
      correctSlot: this.wvPhase === "feedback" ? this.correctSlot : -1,
      centralHit: this.centralHit,
      feedbackKind: this.feedbackKind,
      trialNumber: this.trialNumber,
      totalTrials: this.maxTrials,
      isPractice: this.gameMode === "practice",
      score: this.score,
      deadlineMs: this.config.centralMs,
    } satisfies WVRenderState;
  }

  // ── Trial logic ─────────────────────────────────────────

  private nextTrial(): void {
    this.feedbackKind = null;
    this.probedSlot = -1;
    this.correctSlot = -1;
    this.centralHit = null;
    this.centralResponded = false;
    this.trialNumber = this.practiceCount + this.scoredCount + 1;

    this.flashSlot = Math.floor(this.rng() * PROBE_SLOTS);

    const isPractice = this.gameMode === "practice";
    this.isCurrentPracticeTrial = isPractice;
    const trial = this.trials.startTrial({ isPractice, exposureMs: this.config.centralMs });
    this.currentTrialId = trial.trialId;

    this.emitTrialStarted(trial.trialId, {
      flashSlot: this.flashSlot,
      flashMs: this.config.flashMs,
      seed: Math.round(this.rng() * 100000),
    });

    this.wvPhase = "fixation";
    this.startCentralStream();

    // Peripheral flash: appear once, then vanish.
    const flashAt = this.config.flashMs + Math.floor(this.rng() * (this.config.centralMs - this.config.flashMs - 200));
    this.armTimer("flash", Math.max(200, flashAt), () => {
      this.flashPosition = this.flashSlot;
      this.flashActive = true;
      this.armTimer("flashOff", this.config.flashMs, () => {
        this.flashActive = false;
        this.flashPosition = -1;
      });
    });

    // Fixation ends → probe phase.
    this.armTimer("deadline", this.config.centralMs, () => this.startProbe());
  }

  private startCentralStream(): void {
    this.showCentralSymbol();
  }

  private showCentralSymbol(): void {
    const isTarget = this.rng() < 0.35;
    this.centralIsTarget = isTarget;
    if (isTarget) {
      this.centralSymbol = SYMBOLS[0];
    } else {
      const pool = SYMBOLS.slice(1);
      this.centralSymbol = pool[Math.floor(this.rng() * pool.length)];
    }
    this.armTimer("centralTick", this.config.centralIntervalMs, () => this.showCentralSymbol());
  }

  private startProbe(): void {
    this.clearTimers();
    this.centralSymbol = null;
    this.flashActive = false;
    this.flashPosition = -1;
    this.correctSlot = this.flashSlot;
    this.wvPhase = "probe";

    this.armTimer("probe", this.config.centralMs, () => {
      // No probe answer in time — scored as a miss.
      this.probedSlot = -1;
      this.finishTrial();
    });
  }


  private finishTrial(): void {
    this.clearTimers();

    const probeCorrect = this.probedSlot === this.correctSlot;
    const centralOk = !this.config.centralTask || this.centralHit === true || !this.centralIsTarget;
    const correct = probeCorrect && centralOk;

    this.trials.respond(correct, {
      probedSlot: this.probedSlot,
      correctSlot: this.correctSlot,
      centralHit: this.centralHit,
    });
    this.emitResponse(this.currentTrialId, { correct, probedSlot: this.probedSlot, correctSlot: this.correctSlot });

    if (correct) {
      this.feedbackKind = "correct";
      this.score++;
    } else if (this.probedSlot === -1) {
      this.feedbackKind = "miss";
    } else {
      this.feedbackKind = "wrong";
    }

    this.wvPhase = "feedback";
    this.armTimer("feedback", 1200, () => this.endTrial());
  }

  private endTrial(): void {
    this.clearTimers();

    if (this.isCurrentPracticeTrial) {
      this.practiceCount++;
      this.isCurrentPracticeTrial = false;
      if (this.practiceCount >= (this.context.practiceTrials ?? 0)) {
        this.gameMode = "countdown";
        this.armTimer("countdownTransition", 1500, () => {
          this.gameMode = "playing";
          this.nextTrial();
        });
        return;
      }
    } else {
      this.scoredCount++;
      if (this.scoredCount >= this.maxTrials) {
        this.gameMode = "finished";
        this.wvPhase = "finished";
        return;
      }
    }

    this.armTimer("intermission", 400, () => this.nextTrial());
  }

  private clearTimers(): void {
    this.clearAllPausableTimers();
  }
}
