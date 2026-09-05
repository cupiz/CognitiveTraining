import type { InputEvent } from "@cog/schemas";
import type { GameContext } from "./context.js";
import type { BuiltEvent } from "./event-builder.js";
import type { GamePhase } from "./context.js";

/**
 * Contract every game family must implement.
 *
 * Games are pure logic — they:
 * - receive input events
 * - produce telemetry events
 * - track internal state
 * - return a summary when finished
 *
 * Games do NOT:
 * - render (the shell renders based on game state)
 * - send network requests (the shell handles telemetry via EventBuffer)
 * - calculate domain-level scores (scoring service does that)
 *
 * @see docs/06_GAME_DESIGN.md — Common game contract
 */
export interface CognitiveGame {
  /** Game family key (e.g. "memory_matrix") */
  readonly key: string;
  /** Semantic version (e.g. "1.0.0") */
  readonly version: string;

  /**
   * Get game-specific configuration for a difficulty level.
   * Maps the abstract 1–10 difficulty to concrete parameters.
   */
  getConfig(difficulty: number): Record<string, unknown>;

  /**
   * Validate a game configuration. Throws if invalid.
   */
  validateConfig(config: Record<string, unknown>): void;

  /**
   * Initialize and start the game.
   * Called once at the beginning of a game run.
   */
  start(context: GameContext): void;

  /**
   * Handle a raw input event from the shell.
   * The game decides what to do with it based on current phase.
   */
  handleInput(input: InputEvent): void;

  /**
   * Called when the game should pause (e.g. tab hidden, dialog open).
   */
  pause(): void;

  /**
   * Called when the game should resume after a pause.
   */
  resume(): void;

  /**
   * Called when the game should end (time up, all trials done, or user quit).
   * The game should emit session_ended and return the summary.
   */
  finish(): GameSummary;

  /**
   * Get the current phase of the game.
   */
  getPhase(): GamePhase;

  /**
   * Get all events emitted since the last call to drainEvents().
   * The runner uses this to feed events into the EventBuilder/Buffer.
   */
  drainEvents(): BuiltEvent[];

  /**
   * Get game-specific state for rendering.
   * The shell uses this to render the current frame.
   */
  getRenderState(): Record<string, unknown>;

  /**
   * Time left in the current response window, for the shell's trial progress
   * bar. Null while no response is being waited on (preview, feedback, …).
   */
  getTrialClock(): TrialClock | null;
}

/** Remaining time of the active response window. */
export interface TrialClock {
  /** Full length of the window, for scaling the progress bar. */
  totalMs: number;
  /** Milliseconds still on the clock. */
  remainingMs: number;
}

/**
 * Summary returned when a game finishes.
 * Used by scoring service to compute task metrics.
 */
export interface GameSummary {
  gameKey: string;
  gameVersion: string;
  config: Record<string, unknown>;
  totalTrials: number;
  validTrials: number;
  accuracy?: number;
  medianRtMs?: number;
  meanRtMs?: number;
  rtVariability?: number;
  omissionErrors: number;
  commissionErrors: number;
  qualityFlags: string[];
}
