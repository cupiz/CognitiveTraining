import { describe, it, expect, vi } from "vitest";
import { GameRunner } from "./runner.js";
import type { CognitiveGame, GameSummary } from "./game.js";
import type { GameContext, TelemetrySender } from "./context.js";
import type { InputEvent } from "@cog/schemas";
import type { BuiltEvent } from "./event-builder.js";
import { captureDeviceContext } from "./device.js";

// ── Mock Game ──────────────────────────────────────────

function createMockGame(): CognitiveGame & {
  emittedEvents: BuiltEvent[];
  summary: GameSummary;
} {
  const game = {
    key: "memory_matrix" as const,
    version: "1.0.0",
    emittedEvents: [] as BuiltEvent[],
    summary: {
      gameKey: "memory_matrix",
      gameVersion: "1.0.0",
      config: {},
      totalTrials: 20,
      validTrials: 18,
      accuracy: 0.9,
      medianRtMs: 650,
      meanRtMs: 700,
      rtVariability: 120,
      omissionErrors: 1,
      commissionErrors: 1,
      qualityFlags: [],
    } as GameSummary,
    getConfig: vi.fn(() => ({ gridRows: 4 })),
    validateConfig: vi.fn(),
    start: vi.fn(),
    handleInput: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    finish: vi.fn(function (this: typeof game) {
      return this.summary;
    }),
    getPhase: vi.fn(() => "playing" as const),
    drainEvents: vi.fn(() => game.emittedEvents.splice(0)),
    getRenderState: vi.fn(() => ({ grid: [] })),
  };
  return game;
}

function createMockContext(): GameContext {
  return {
    sessionId: "session-1",
    gameRunId: "run-1",
    gameKey: "memory_matrix",
    gameVersion: "1.0.0",
    difficulty: 4,
    seed: 42,
    isPractice: false,
    practiceTrials: 3,
    deviceContext: captureDeviceContext(),
    extra: {},
    startedAt: performance.now(),
    sendTelemetry: {
      send: vi.fn(async () => ({ accepted: 0, rejected: 0, rejectedSequences: [] })),
    } as unknown as TelemetrySender,
  };
}

// ── Tests ──────────────────────────────────────────────

describe("GameRunner", () => {
  it("starts the game", () => {
    const game = createMockGame();
    const ctx = createMockContext();
    const runner = new GameRunner(game, ctx);

    runner.start();
    expect(game.start).toHaveBeenCalledWith(ctx);
  });

  it("does not start twice", () => {
    const game = createMockGame();
    const ctx = createMockContext();
    const runner = new GameRunner(game, ctx);

    runner.start();
    runner.start();
    expect(game.start).toHaveBeenCalledTimes(1);
  });

  it("routes input to game", () => {
    const game = createMockGame();
    const ctx = createMockContext();
    const runner = new GameRunner(game, ctx);
    runner.start();

    const input: InputEvent = { type: "pointer_down", x: 100, y: 200, tClient: 5000 };
    runner.handleInput(input);

    expect(game.handleInput).toHaveBeenCalledWith(input);
  });

  it("ignores input before start", () => {
    const game = createMockGame();
    const ctx = createMockContext();
    const runner = new GameRunner(game, ctx);

    const input: InputEvent = { type: "pointer_down", x: 100, y: 200, tClient: 5000 };
    runner.handleInput(input);

    expect(game.handleInput).not.toHaveBeenCalled();
  });

  it("pauses and resumes the game", () => {
    const game = createMockGame();
    const ctx = createMockContext();
    const runner = new GameRunner(game, ctx);
    runner.start();

    runner.pause();
    expect(game.pause).toHaveBeenCalled();
    expect(runner.getPhase()).toBe("playing"); // mock returns "playing"

    runner.resume();
    expect(game.resume).toHaveBeenCalled();
  });

  it("drains events from game on input", () => {
    const game = createMockGame();
    const ctx = createMockContext();
    const runner = new GameRunner(game, ctx);
    runner.start();

    // Set up game to emit an event on next drain
    game.emittedEvents.push({
      sequenceNo: 1,
      eventType: "trial_started",
      clientTimeMs: 1000,
      payload: { trialId: "t1" },
    });

    runner.handleInput({ type: "pointer_down", x: 0, y: 0, tClient: 5000 });

    // drainEvents should have been called
    expect(game.drainEvents).toHaveBeenCalled();
  });

  it("finishes and returns summary", async () => {
    const game = createMockGame();
    const ctx = createMockContext();
    const runner = new GameRunner(game, ctx);
    runner.start();

    const summary = await runner.finish();

    expect(summary.gameKey).toBe("memory_matrix");
    expect(summary.gameVersion).toBe("1.0.0");
    expect(summary.totalTrials).toBe(20);
    expect(summary.validTrials).toBe(18);
    expect(game.finish).toHaveBeenCalled();
  });

  it("returns empty summary if never started", async () => {
    const game = createMockGame();
    const ctx = createMockContext();
    const runner = new GameRunner(game, ctx);

    const summary = await runner.finish();
    expect(summary.totalTrials).toBe(0);
  });

  it("flushes telemetry on finish", async () => {
    const game = createMockGame();
    const ctx = createMockContext();
    const sendFn = vi.fn(async () => ({ accepted: 0, rejected: 0, rejectedSequences: [] }));
    ctx.sendTelemetry = { send: sendFn } as unknown as TelemetrySender;

    const runner = new GameRunner(game, ctx);
    runner.start();

    // Emit some events
    game.emittedEvents.push(
      { sequenceNo: 1, eventType: "trial_started", clientTimeMs: 1000, payload: {} },
      { sequenceNo: 2, eventType: "response", clientTimeMs: 2000, payload: {} },
    );

    await runner.finish();

    // Telemetry should have been sent
    expect(sendFn).toHaveBeenCalled();
  });

  it("tracks elapsed time", () => {
    const game = createMockGame();
    const ctx = createMockContext();
    const runner = new GameRunner(game, ctx);
    runner.start();

    const elapsed = runner.getElapsedMs();
    expect(elapsed).toBeGreaterThanOrEqual(0);
    expect(typeof elapsed).toBe("number");
  });
});
