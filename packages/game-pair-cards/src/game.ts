import type { InputEvent } from "@cog/schemas";
import type { GameContext, GameSummary } from "@cog/game-core";
import { BaseGame, createRng } from "@cog/game-core";
import {
  getDifficultyConfig,
  validateConfig,
  type PairCardsConfig,
} from "./difficulty.js";

export const GAME_KEY = "pair_cards" as const;
export const GAME_VERSION = "0.1.0" as const;

export type PCPhase =
  | "idle"
  | "practice"
  | "countdown"
  | "preview" // all cards face-up for memorizing
  | "play" // flipping pairs
  | "flipback" // mismatched pair showing, about to close
  | "paused"
  | "finished";

export interface PCCard {
  pairId: number;
  flipped: boolean;
  matched: boolean;
}

export interface PCRenderState {
  phase: PCPhase;
  cards: PCCard[];
  /** Index of the first flipped card (-1 = none) */
  firstPick: number;
  matchedPairs: number;
  pairCount: number;
  attempts: number;
  mismatches: number;
  /** Mismatched flips allowed before the round ends */
  mismatchBudget: number;
  feedbackKind: "match" | "miss" | null;
  awaitingResponse: boolean;
  trialNumber: number;
  totalTrials: number;
  isPractice: boolean;
  score: number;
}

const FACES = ["🐙", "🦀", "🐠", "⭐", "🐚", "🐬", "🦞", "🐳", "🦑", "🐡"];

/**
 * Kartu Kembar — concentration on a treasure island.
 *
 * Flip two cards per attempt: a matched pair stays open, a mismatch flips
 * back after a beat. Find every pair before the mismatch budget runs out.
 * Each two-card attempt is one scored trial.
 */
export class PairCardsGame extends BaseGame {
  readonly key = GAME_KEY;
  readonly version = GAME_VERSION;

  private pcPhase: PCPhase = "idle";
  private gameMode: "practice" | "countdown" | "playing" | "finished" = "practice";
  private config: PairCardsConfig = {
    pairCount: 4,
    previewMs: 2500,
    mismatchFlipBackMs: 1100,
  };
  private rng: () => number = () => 0;

  // Board state
  private cards: PCCard[] = [];
  private firstPick = -1;
  private matchedPairs = 0;
  private attempts = 0;
  private mismatches = 0;
  private feedbackKind: PCRenderState["feedbackKind"] = null;
  private trialNumber = 0;
  private score = 0;
  private currentTrialId = "";
  private awaitingResponse = true;
  private maxRounds = 1;

  private clearTimers(): void {
    this.clearAllPausableTimers();
  }

  // Pause state
  private pausedPhase: PCPhase = "idle";

  // ── Config ──────────────────────────────────────────────

  getConfig(difficulty: number): Record<string, unknown> {
    return getDifficultyConfig(difficulty) as unknown as Record<string, unknown>;
  }

  validateConfig(config: Record<string, unknown>): void {
    validateConfig(config as unknown as PairCardsConfig);
  }

  // ── Lifecycle ───────────────────────────────────────────

  protected onStart(context: GameContext): void {
    this.config = getDifficultyConfig(context.difficulty) as PairCardsConfig;
    this.rng = createRng(context.seed);
    this.firstPick = -1;
    this.matchedPairs = 0;
    this.attempts = 0;
    this.mismatches = 0;
    this.feedbackKind = null;
    this.trialNumber = 0;
    this.score = 0;

    this.pcPhase = context.practiceTrials > 0 ? "practice" : "countdown";
    this.gameMode = context.practiceTrials > 0 ? "practice" : "playing";

    this.buildBoard();
    // The countdown already ran in the shell — start the preview immediately.
    this.armTimer("boot", 10, () => this.startPreviewChain());
  }

  protected onInput(input: InputEvent): void {
    if (input.type !== "pointer_down" && input.type !== "touch") return;
    if (this.pcPhase !== "play") return;

    const payload = (input as Record<string, unknown>).cellIndex;
    const idx = typeof payload === "number" ? Math.floor(payload) : -1;
    if (idx < 0 || idx >= this.cards.length) return;
    if (this.cards[idx].matched || this.cards[idx].flipped) return;

    this.handleCardTap(idx);
  }

  pause(): void {
    if (this.pcPhase === "idle" || this.pcPhase === "finished" || this.pcPhase === "paused") return;
    this.pausedPhase = this.pcPhase;
    this.pcPhase = "paused";
    this.freezePausableTimers();
  }

  resume(): void {
    if (this.pcPhase !== "paused") return;
    this.pcPhase = this.pausedPhase;
    this.thawPausableTimers();
  }

  protected onFinish(): GameSummary {
    this.clearTimers();
    this.pcPhase = "finished";

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
    if (this.pcPhase === "idle" || this.pcPhase === "finished") return this.pcPhase;
    if (this.pcPhase === "paused") return "paused";
    return this.gameMode;
  }

  // ── Render state ────────────────────────────────────────

  getRenderState(): Record<string, unknown> {
    return {
      phase: this.pcPhase,
      cards: this.cards.map((card) => ({ ...card })),
      firstPick: this.firstPick,
      matchedPairs: this.matchedPairs,
      pairCount: this.config.pairCount,
      attempts: this.attempts,
      mismatches: this.mismatches,
      mismatchBudget: this.mismatchBudget(),
      feedbackKind: this.feedbackKind,
      awaitingResponse: this.awaitingResponse,
      trialNumber: this.trialNumber,
      totalTrials: this.maxRounds,
      isPractice: this.gameMode === "practice",
      score: this.score,
    } satisfies PCRenderState;
  }

  // ── Board logic ─────────────────────────────────────────

  /** Mismatched flips allowed before the round ends. */
  private mismatchBudget(): number {
    return this.config.pairCount * 2 + 3;
  }

  private buildBoard(): void {
    const faces = FACES.slice(0, this.config.pairCount);
    const deck: { pairId: number; faceIndex: number }[] = [];
    faces.forEach((_, pairId) => {
      deck.push({ pairId, faceIndex: 0 }, { pairId, faceIndex: 1 });
    });

    // Fisher–Yates shuffle with the seeded rng — deterministic layout.
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    this.cards = deck.map((card) => ({ pairId: card.pairId, flipped: false, matched: false }));
  }

  private handleCardTap(idx: number): void {
    this.cards[idx].flipped = true;

    if (this.firstPick === -1) {
      this.firstPick = idx;
      const trial = this.trials.startTrial({ isPractice: this.gameMode === "practice", exposureMs: 0 });
      this.currentTrialId = trial.trialId;
      this.emitTrialStarted(trial.trialId, { firstCard: idx });
      return;
    }

    // Second card flipped — resolve the attempt.
    this.attempts++;
    this.trialNumber = this.attempts;
    const first = this.cards[this.firstPick];
    const second = this.cards[idx];
    const isMatch = first.pairId === second.pairId;

    this.trials.respond(isMatch, { firstCard: this.firstPick, secondCard: idx });
    this.emitResponse(this.currentTrialId, { correct: isMatch, firstCard: this.firstPick, secondCard: idx });

    if (isMatch) {
      first.matched = true;
      second.matched = true;
      first.flipped = true;
      second.flipped = true;
      this.matchedPairs++;
      this.score++;
      this.feedbackKind = "match";
      this.firstPick = -1;
      this.emit("stimulus_shown", { matched: true });

      if (this.matchedPairs >= this.config.pairCount) {
        this.gameMode = "finished";
        this.pcPhase = "finished";
      }
      return;
    }

    // Mismatch: budget consumed, flip back after a beat.
    this.mismatches++;
    this.feedbackKind = "miss";
    this.firstPick = -1;
    this.emit("stimulus_hidden", { mismatch: true });

    if (this.mismatches >= this.mismatchBudget()) {
      this.gameMode = "finished";
      this.pcPhase = "finished";
      return;
    }

    this.pcPhase = "flipback";
    this.armTimer("flipback", this.config.mismatchFlipBackMs, () => {
      first.flipped = false;
      second.flipped = false;
      this.feedbackKind = null;
      this.pcPhase = "play";
    });
  }

  // ── Preview phase (runs via timers from start) ──────────

  /** Called by start's preview timer chain — defined for the shell contract. */
  private beginPlayAfterPreview(): void {
    this.pcPhase = "play";
  }

  private startPreviewChain(): void {
    if (this.config.previewMs > 0) {
      this.pcPhase = "preview";
      this.cards.forEach((card) => (card.flipped = true));
      this.armTimer("preview", this.config.previewMs, () => {
        this.cards.forEach((card) => (card.flipped = card.matched));
        this.beginPlayAfterPreview();
      });
    } else {
      this.beginPlayAfterPreview();
    }
  }
}
