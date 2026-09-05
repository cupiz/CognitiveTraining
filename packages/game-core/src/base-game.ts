import type { InputEvent } from "@cog/schemas";
import type { CognitiveGame, GameSummary, TrialClock } from "./game.js";
import type { GameContext, GamePhase } from "./context.js";
import { EventBuilder, type BuiltEvent } from "./event-builder.js";
import { TrialTracker } from "./trial-tracker.js";

/** A frozen/thawed game timer registered through armTimer(). */
interface PausableTimer {
  /** Original window length — survives freeze/thaw for progress display. */
  totalMs: number;
  /** Current tick length (shrinks across freeze/thaw cycles). */
  delayMs: number;
  startedAt: number;
  remainingMs: number;
  callback: () => void;
}

/**
 * Abstract base class for game implementations.
 * Handles common boilerplate:
 * - Event building and draining
 * - Trial tracking
 * - Phase management
 * - Practice vs scored trial separation
 *
 * Concrete games extend this and implement:
 * - `onStart()` — initialize game-specific state
 * - `onInput()` — handle game-specific input logic
 * - `onPause()` / `onResume()`
 * - `onFinish()` — produce a game-specific summary
 * - `getConfig()` / `validateConfig()`
 * - `getRenderState()` — return state for the renderer
 */
export abstract class BaseGame implements CognitiveGame {
  abstract readonly key: string;
  abstract readonly version: string;

  protected context!: GameContext;
  protected events = new EventBuilder();
  protected trials = new TrialTracker();
  protected phase: GamePhase = "idle";

  // ── Pausable timers ────────────────────────────────────
  // Timers registered through armTimer() survive pause(): instead of clearing
  // them (which wedged games — resume() had nothing left to re-arm), pause
  // freezes them with their remaining time and resume() re-arms them.

  private pausableTimerHandles = new Map<string, ReturnType<typeof setTimeout>>();
  private pausableTimers = new Map<string, PausableTimer>();

  /** Schedule a game timer that can be frozen/thawed around pause. */
  protected armTimer(key: string, delayMs: number, callback: () => void): void {
    // A thawed-but-unfired timer leaves only a live handle behind; re-arming
    // the same key must clear it or both timeouts end up firing.
    const previous = this.pausableTimerHandles.get(key);
    if (previous) clearTimeout(previous);
    const handle = setTimeout(() => {
      this.pausableTimers.delete(key);
      this.pausableTimerHandles.delete(key);
      callback();
    }, delayMs);
    this.pausableTimerHandles.set(key, handle);
    this.pausableTimers.set(key, {
      totalMs: delayMs,
      delayMs,
      startedAt: performance.now(),
      remainingMs: delayMs,
      callback,
    });
  }

  /** Cancel every pausable timer (finish, timeout, hard cancel). */
  protected clearAllPausableTimers(): void {
    for (const handle of this.pausableTimerHandles.values()) clearTimeout(handle);
    this.pausableTimerHandles.clear();
    this.pausableTimers.clear();
  }

  /** Pause: stop the clock, remembering how much time was left per timer. */
  protected freezePausableTimers(): void {
    const now = performance.now();
    for (const [key, entry] of this.pausableTimers) {
      const handle = this.pausableTimerHandles.get(key);
      if (handle) clearTimeout(handle);
      this.pausableTimerHandles.delete(key);
      entry.remainingMs = Math.max(0, entry.delayMs - (now - entry.startedAt));
    }
  }

  /** Resume: re-arm every frozen timer with its remaining time. */
  protected thawPausableTimers(): void {
    const pending = [...this.pausableTimers.entries()];
    this.pausableTimers.clear();
    for (const [key, entry] of pending) {
      const handle = setTimeout(() => {
        this.pausableTimers.delete(key);
        this.pausableTimerHandles.delete(key);
        entry.callback();
      }, Math.max(0, entry.remainingMs));
      this.pausableTimerHandles.set(key, handle);
      // Keep the entry registered with a fresh clock — otherwise the next
      // pause() has nothing left to freeze and timers run behind the overlay.
      this.pausableTimers.set(key, {
        totalMs: entry.totalMs,
        delayMs: entry.remainingMs,
        startedAt: performance.now(),
        remainingMs: entry.remainingMs,
        callback: entry.callback,
      });
    }
  }

  /**
   * Time left in the current response window, for the shell's trial progress
   * bar. Games arm it as the "deadline" timer (sushi-express: "beltEnd");
   * returns null whenever no response is being waited on.
   * Callers must not poll this while paused — the wall clock keeps running.
   */
  getTrialClock(): TrialClock | null {
    const entry = this.pausableTimers.get("deadline") ?? this.pausableTimers.get("beltEnd");
    if (!entry) return null;
    const remainingMs = Math.max(0, entry.delayMs - (performance.now() - entry.startedAt));
    return { totalMs: entry.totalMs, remainingMs };
  }

  // ── Public interface ─────────────────────────────────

  abstract getConfig(difficulty: number): Record<string, unknown>;
  abstract validateConfig(config: Record<string, unknown>): void;

  start(context: GameContext): void {
    this.context = context;
    this.events.reset();
    this.phase = "practice";

    this.onStart(context);

    // If no practice trials needed, skip to countdown
    if (context.practiceTrials <= 0) {
      this.phase = "countdown";
    }
  }

  handleInput(input: InputEvent): void {
    if (this.phase === "idle" || this.phase === "finished") return;
    this.onInput(input);
  }

  pause(): void {
    if (this.phase === "playing" || this.phase === "practice") {
      this.phase = "paused";
      this.freezePausableTimers();
      this.onPause();
    }
  }

  resume(): void {
    if (this.phase === "paused") {
      // Return to the previous phase (assume playing for simplicity)
      this.phase = "playing";
      this.onResume();
      this.thawPausableTimers();
    }
  }

  finish(): GameSummary {
    this.phase = "finished";
    return this.onFinish();
  }

  getPhase(): GamePhase {
    return this.phase;
  }

  drainEvents(): BuiltEvent[] {
    const collected = [...this.events_buffer];
    this.events_buffer = [];
    return collected;
  }

  abstract getRenderState(): Record<string, unknown>;

  // ── Protected helpers for subclasses ─────────────────

  /** Emit a telemetry event (queued for drain) */
  protected emit(eventType: string, payload: Record<string, unknown>): void {
    const event = this.events.custom(eventType, payload);
    this.events_buffer.push(event);
  }

  /** Convenience: emit trial_started */
  protected emitTrialStarted(trialId: string, params: Record<string, unknown> = {}): void {
    const event = this.events.trialStarted(trialId, params);
    this.events_buffer.push(event);
  }

  /** Convenience: emit response */
  protected emitResponse(trialId: string, params: Record<string, unknown> = {}): void {
    const event = this.events.response(trialId, params);
    this.events_buffer.push(event);
  }

  /** Convenience: emit quality_flag */
  protected emitQualityFlag(code: string, params: Record<string, unknown> = {}): void {
    const event = this.events.qualityFlag(code as never, params);
    this.events_buffer.push(event);
  }

  /** Check if we're in practice phase */
  protected get isPractice(): boolean {
    return this.phase === "practice";
  }

  /** Transition from practice to countdown/playing */
  protected transitionToPlaying(): void {
    this.phase = "countdown";
    // Shell is responsible for showing countdown, then setting to "playing"
  }

  /** Called by shell when countdown finishes */
  protected beginPlaying(): void {
    this.phase = "playing";
  }

  // ── Lifecycle hooks (implement in subclasses) ────────

  protected abstract onStart(context: GameContext): void;
  protected abstract onInput(input: InputEvent): void;
  protected abstract onFinish(): GameSummary;
  protected onPause(): void {}
  protected onResume(): void {}

  // ── Internal ─────────────────────────────────────────

  /** Internal buffer for events before drain */
  private events_buffer: BuiltEvent[] = [];
}
