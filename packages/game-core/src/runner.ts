import type { InputEvent } from "@cog/schemas";
import type { CognitiveGame, GameSummary, TrialClock } from "./game.js";
import type { GameContext, GamePhase } from "./context.js";
import { EventBuilder } from "./event-builder.js";
import { LocalEventBuffer, type EventBufferOptions } from "./event-buffer.js";
import { now, elapsed, toMs } from "./timing.js";

/**
 * Orchestrates a single game run:
 * 1. Initializes the game with context
 * 2. Routes input events
 * 3. Collects telemetry events from the game
 * 4. Buffers and sends events via the EventBuffer
 * 5. Handles pause/resume
 * 6. Collects the game summary on finish
 *
 * The game shell creates a GameRunner per game run.
 */
export class GameRunner {
  private game: CognitiveGame;
  private context: GameContext;
  private eventBuilder: EventBuilder;
  private eventBuffer: LocalEventBuffer;
  private isRunning = false;
  private isPaused = false;
  private inputModality: "touch" | "pointer" | "keyboard" | null = null;

  constructor(game: CognitiveGame, context: GameContext, bufferOptions?: EventBufferOptions) {
    this.game = game;
    this.context = context;
    this.eventBuilder = new EventBuilder();
    this.eventBuffer = new LocalEventBuffer(context.sendTelemetry, context.gameRunId, bufferOptions);
  }

  /**
   * Start the game. Call this once.
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    // Initialize the game
    this.game.start(this.context);
  }

  /**
   * Route an input event to the game.
   * Detects input modality from the first event.
   */
  handleInput(input: InputEvent): void {
    if (!this.isRunning || this.isPaused) return;

    // Detect modality once
    if (this.inputModality === null) {
      this.inputModality = detectModality(input);
    }

    // Let the game process the input
    this.game.handleInput(input);

    // Drain any events the game emitted
    this.drainGameEvents();
  }

  /**
   * Pause the game (e.g. tab hidden).
   */
  pause(): void {
    if (!this.isRunning || this.isPaused) return;
    this.isPaused = true;
    this.game.pause();

    // Emit pause event
    const event = this.eventBuilder.sessionPaused();
    this.eventBuffer.push(event);
  }

  /**
   * Resume the game after a pause.
   */
  resume(): void {
    if (!this.isRunning || !this.isPaused) return;
    this.isPaused = false;
    this.game.resume();

    // Emit resume event
    const event = this.eventBuilder.sessionResumed();
    this.eventBuffer.push(event);
  }

  /**
   * Finish the game, flush telemetry, and return the summary.
   */
  async finish(): Promise<GameSummary> {
    if (!this.isRunning) {
      return this.emptySummary();
    }

    this.isRunning = false;

    // Let the game emit any final events (session_ended etc.)
    const gameSummary = this.game.finish();
    this.drainGameEvents();

    // Flush remaining telemetry
    await this.eventBuffer.dispose();

    return {
      ...gameSummary,
      gameKey: this.context.gameKey,
      gameVersion: this.context.gameVersion,
    };
  }

  /**
   * Force-flush telemetry without ending the game.
   */
  async flushTelemetry(): Promise<void> {
    await this.eventBuffer.flush();
  }

  /** Get current game phase */
  getPhase(): GamePhase {
    return this.game.getPhase();
  }

  /** Get current render state for the shell */
  getRenderState(): Record<string, unknown> {
    return this.game.getRenderState();
  }

  /** Time left in the current response window (null outside one) */
  getTrialClock(): TrialClock | null {
    return this.game.getTrialClock();
  }

  /** Get input modality detected during this run */
  getInputModality(): "touch" | "pointer" | "keyboard" | null {
    return this.inputModality;
  }

  /** Get elapsed time since game start (ms) */
  getElapsedMs(): number {
    return toMs(elapsed(this.context.startedAt, now()));
  }

  // ── Internal ──────────────────────────────────────────

  private drainGameEvents(): void {
    const events = this.game.drainEvents();
    for (const event of events) {
      this.eventBuffer.push(event);
    }
  }

  private emptySummary(): GameSummary {
    return {
      gameKey: this.context.gameKey,
      gameVersion: this.context.gameVersion,
      config: this.context.extra,
      totalTrials: 0,
      validTrials: 0,
      omissionErrors: 0,
      commissionErrors: 0,
      qualityFlags: [],
    };
  }
}

function detectModality(input: InputEvent): "touch" | "pointer" | "keyboard" {
  if (input.type === "touch") return "touch";
  if (input.type === "key_down") return "keyboard";
  return "pointer";
}
