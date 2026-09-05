import { describe, it, expect, vi } from "vitest";
import { SpiceStallGame, GAME_KEY, GAME_VERSION } from "./game.js";
import type { GameContext } from "@cog/game-core";
import type { SSRenderState } from "./game.js";

function makeContext(overrides: Partial<GameContext> = {}): GameContext {
  return {
    sessionId: "test-session",
    gameRunId: "test-run",
    gameKey: "spice_stall",
    gameVersion: GAME_VERSION,
    difficulty: 3,
    seed: 42,
    isPractice: false,
    maxTrials: 5,
    practiceTrials: 2,
    deviceContext: {
      userAgent: "test",
      screenWidth: 1920,
      screenHeight: 1080,
      pixelRatio: 1,
      touchSupport: false,
      refreshRate: 60,
      platform: "test",
      language: "en",
      timezone: "UTC",
    },
    extra: {},
    startedAt: 0,
    sendTelemetry: { send: vi.fn().mockResolvedValue({ accepted: 0, rejected: 0 }) },
    ...overrides,
  };
}

function tap(game: SpiceStallGame, cellIndex: number) {
  game.handleInput({ type: "pointer_down", x: 0, y: 0, tClient: 0, cellIndex } as never);
}

function stateOf(game: SpiceStallGame): SSRenderState {
  return game.getRenderState() as unknown as SSRenderState;
}

describe("SpiceStallGame", () => {
  it("has correct key and version", () => {
    const game = new SpiceStallGame();
    expect(game.key).toBe(GAME_KEY);
    expect(game.key).toBe("spice_stall");
    expect(game.version).toBe(GAME_VERSION);
    expect(game.version).toBe("0.1.0");
  });

  it("starts in practice phase when practiceTrials > 0", () => {
    const game = new SpiceStallGame();
    game.start(makeContext({ practiceTrials: 3 }));
    expect(game.getPhase()).toBe("practice");
  });

  it("starts in countdown when practiceTrials = 0", () => {
    const game = new SpiceStallGame();
    game.start(makeContext({ practiceTrials: 0 }));
    expect(game.getPhase()).toBe("countdown");
  });

  it("returns valid render state", () => {
    const game = new SpiceStallGame();
    game.start(makeContext());
    const state = stateOf(game);
    expect(state).toHaveProperty("phase");
    expect(state).toHaveProperty("menu");
    expect(state).toHaveProperty("order");
    expect(state).toHaveProperty("tappedIndices");
    expect(state).toHaveProperty("showOrder");
    expect(state).toHaveProperty("showFeedback");
    expect(state).toHaveProperty("isPractice");
    expect(state).toHaveProperty("score");
    expect(state.menu.length).toBeGreaterThan(0);
  });

  it("provides valid config for all difficulty levels", () => {
    const game = new SpiceStallGame();
    for (let d = 1; d <= 10; d++) {
      const config = game.getConfig(d) as { orderLength: number; menuSize: number };
      expect(config).toHaveProperty("orderLength");
      expect(config).toHaveProperty("menuSize");
      expect(config).toHaveProperty("exposureMs");
      expect(config).toHaveProperty("patienceMs");
      expect(config).toHaveProperty("similarPairs");
    }
  });

  it("ignores taps while the order is still showing", () => {
    const game = new SpiceStallGame();
    game.start(makeContext({ practiceTrials: 0 }));
    const before = stateOf(game).tappedIndices.length;
    tap(game, 0);
    expect(stateOf(game).tappedIndices.length).toBe(before);
  });

  it("drains events with trial_started first", () => {
    const game = new SpiceStallGame();
    game.start(makeContext({ practiceTrials: 0 }));
    const events = game.drainEvents();
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].eventType).toBe("trial_started");
  });

  it("finish returns valid summary", () => {
    const game = new SpiceStallGame();
    game.start(makeContext({ practiceTrials: 0 }));
    const summary = game.finish();
    expect(summary.gameKey).toBe("spice_stall");
    expect(summary.gameVersion).toBe(GAME_VERSION);
    expect(summary.totalTrials).toBeGreaterThanOrEqual(0);
    expect(summary.omissionErrors).toBeGreaterThanOrEqual(0);
    expect(summary.commissionErrors).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(summary.qualityFlags)).toBe(true);
  });
});

describe("SpiceStallGame pause/resume", () => {
  it("can pause and resume during practice", () => {
    const game = new SpiceStallGame();
    game.start(makeContext({ practiceTrials: 3 }));
    game.pause();
    expect(game.getPhase()).toBe("paused");
    game.resume();
    expect(game.getPhase()).not.toBe("paused");
  });

  it("cannot pause when idle", () => {
    const game = new SpiceStallGame();
    game.pause();
    expect(game.getPhase()).toBe("idle");
  });

  it("cannot resume when not paused", () => {
    const game = new SpiceStallGame();
    game.start(makeContext({ practiceTrials: 0 }));
    game.resume();
    expect(game.getPhase()).not.toBe("paused");
  });
});

describe("SpiceStallGame scoring", () => {
  it("records a correct order", () => {
    const game = new SpiceStallGame();
    vi.useFakeTimers();
    game.start(makeContext({ difficulty: 1, practiceTrials: 0, maxTrials: 1 }));
    vi.advanceTimersByTime(2600); // past D1 exposure (2500ms) into the waiting window

    const state = stateOf(game);
    expect(state.showOrder).toBe(false);
    for (const idx of state.order) tap(game, idx);
    vi.advanceTimersByTime(900); // feedback + trial end

    const events = game.drainEvents();
    const response = events.find((e) => e.eventType === "response");
    expect(response).toBeDefined();
    expect((response!.payload as { correct: boolean }).correct).toBe(true);
    vi.useRealTimers();
  });

  it("records a wrong order as commission", () => {
    const game = new SpiceStallGame();
    vi.useFakeTimers();
    game.start(makeContext({ difficulty: 1, practiceTrials: 0, maxTrials: 1 }));
    vi.advanceTimersByTime(2600);

    const state = stateOf(game);
    // Tap a deliberately rotated order.
    const wrong = [...state.order.slice(1), state.order[0]];
    for (const idx of wrong) tap(game, idx);
    vi.advanceTimersByTime(900);

    const events = game.drainEvents();
    const response = events.find((e) => e.eventType === "response");
    expect(response).toBeDefined();
    expect((response!.payload as { correct: boolean }).correct).toBe(false);

    const summary = game.finish();
    expect(summary.commissionErrors).toBeGreaterThanOrEqual(1);
    vi.useRealTimers();
  });

  it("records a timeout as omission", () => {
    const game = new SpiceStallGame();
    vi.useFakeTimers();
    game.start(makeContext({ difficulty: 1, practiceTrials: 0, maxTrials: 1 }));

    vi.advanceTimersByTime(2600); // into waiting
    vi.advanceTimersByTime(12500); // past D1 patience (12000ms)
    vi.advanceTimersByTime(900); // feedback + trial end
    const events = game.drainEvents();
    expect(events.some((e) => e.eventType === "timeout" || e.eventType === "response")).toBe(true);

    const summary = game.finish();
    expect(summary.omissionErrors).toBeGreaterThanOrEqual(1);
    vi.useRealTimers();
  });

  it("completes all trials and finishes", () => {
    const game = new SpiceStallGame();
    vi.useFakeTimers();
    game.start(makeContext({ difficulty: 1, practiceTrials: 0, maxTrials: 2 }));
    let budget = 400;
    while (game.getPhase() !== "finished" && budget > 0) {
      vi.advanceTimersByTime(500);
      budget--;
    }
    vi.useRealTimers();

    expect(game.getPhase()).toBe("finished");
    const summary = game.finish();
    expect(summary.totalTrials).toBeGreaterThanOrEqual(2);
  });
});
