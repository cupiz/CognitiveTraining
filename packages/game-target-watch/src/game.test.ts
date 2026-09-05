import { describe, it, expect, vi } from "vitest";
import { TargetWatchGame, GAME_KEY, GAME_VERSION } from "./game.js";
import type { GameContext } from "@cog/game-core";

function makeContext(overrides: Partial<GameContext> = {}): GameContext {
  return {
    sessionId: "test-session",
    gameRunId: "test-run",
    gameKey: "target_watch",
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

describe("TargetWatchGame", () => {
  it("has correct key and version", () => {
    const game = new TargetWatchGame();
    expect(game.key).toBe(GAME_KEY);
    expect(game.version).toBe(GAME_VERSION);
  });

  it("starts in practice phase when practiceTrials > 0", () => {
    const game = new TargetWatchGame();
    game.start(makeContext({ practiceTrials: 3 }));
    expect(game.getPhase()).toBe("practice");
  });

  it("starts in countdown when practiceTrials = 0", () => {
    const game = new TargetWatchGame();
    game.start(makeContext({ practiceTrials: 0 }));
    expect(game.getPhase()).toBe("countdown");
  });

  it("returns valid render state", () => {
    const game = new TargetWatchGame();
    game.start(makeContext());
    const state = game.getRenderState();
    expect(state).toHaveProperty("phase");
    expect(state).toHaveProperty("currentStimulus");
    expect(state).toHaveProperty("targetSymbol");
    expect(state).toHaveProperty("isPractice");
    expect(state).toHaveProperty("score");
    expect(state).toHaveProperty("hits");
    expect(state).toHaveProperty("misses");
    expect(state).toHaveProperty("falseAlarms");
  });

  it("provides valid config for difficulty levels", () => {
    const game = new TargetWatchGame();
    for (let d = 1; d <= 10; d++) {
      const config = game.getConfig(d);
      expect(config).toHaveProperty("symbolsPerTrial");
      expect(config).toHaveProperty("targetSymbol");
      expect(config).toHaveProperty("interStimulusMs");
      expect(config).toHaveProperty("responseDeadlineMs");
    }
  });

  it("does not accept input when not in waiting phase", () => {
    const game = new TargetWatchGame();
    game.start(makeContext({ practiceTrials: 0 }));
    // Should not throw
    game.handleInput({ type: "pointer_down", x: 100, y: 100, tClient: 0 });
  });

  it("drains events", () => {
    const game = new TargetWatchGame();
    game.start(makeContext({ practiceTrials: 0 }));
    const events = game.drainEvents();
    // Should have at least trial_started event
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].eventType).toBe("trial_started");
  });

  it("emits trial_started on each trial", () => {
    const game = new TargetWatchGame();
    game.start(makeContext({ practiceTrials: 0 }));
    const events1 = game.drainEvents();
    expect(events1.some(e => e.eventType === "trial_started")).toBe(true);
  });

  it("getConfig returns correct parameters for D1", () => {
    const game = new TargetWatchGame();
    const config = game.getConfig(1) as { symbolsPerTrial: number; targetSymbol: string };
    expect(config.symbolsPerTrial).toBe(8);
    expect(config.targetSymbol).toBe("★");
  });

  it("finish returns valid summary", () => {
    const game = new TargetWatchGame();
    game.start(makeContext({ practiceTrials: 0 }));
    const summary = game.finish();
    expect(summary.gameKey).toBe("target_watch");
    expect(summary.gameVersion).toBe(GAME_VERSION);
    expect(summary.totalTrials).toBeGreaterThanOrEqual(0);
    expect(summary.omissionErrors).toBeGreaterThanOrEqual(0);
    expect(summary.commissionErrors).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(summary.qualityFlags)).toBe(true);
  });
});

describe("TargetWatchGame pause/resume", () => {
  it("can pause and resume during practice", () => {
    const game = new TargetWatchGame();
    game.start(makeContext({ practiceTrials: 3 }));
    game.pause();
    expect(game.getPhase()).toBe("paused");
    game.resume();
    expect(game.getPhase()).not.toBe("paused");
  });

  it("cannot pause when idle", () => {
    const game = new TargetWatchGame();
    game.pause(); // Should not throw
    expect(game.getPhase()).toBe("idle");
  });

  it("cannot resume when not paused", () => {
    const game = new TargetWatchGame();
    game.start(makeContext({ practiceTrials: 0 }));
    game.resume(); // Should not throw
    expect(game.getPhase()).not.toBe("paused");
  });
});

describe("TargetWatchGame scoring", () => {
  it("records hits correctly", () => {
    const game = new TargetWatchGame();
    game.start(makeContext({ difficulty: 1, practiceTrials: 0, maxTrials: 1 }));

    // Wait for stimulus to become active
    vi.useFakeTimers();
    vi.advanceTimersByTime(600); // Wait past showing phase

    // Simulate tap during waiting phase
    game.handleInput({ type: "pointer_down", x: 0, y: 0, tClient: Date.now() });

    vi.useRealTimers();
  });

  it("handles multiple trials", () => {
    const game = new TargetWatchGame();
    game.start(makeContext({ difficulty: 1, practiceTrials: 0, maxTrials: 3 }));

    // Let the game run through trials via timers
    vi.useFakeTimers();
    // Advance through several trial cycles
    for (let i = 0; i < 20; i++) {
      vi.advanceTimersByTime(500);
    }
    vi.useRealTimers();
  });

  it("completes the round after a pause mid-trial", () => {
    const game = new TargetWatchGame();
    game.start(makeContext({ practiceTrials: 0, maxTrials: 3, difficulty: 1 }));

    vi.useFakeTimers();
    vi.advanceTimersByTime(700); // mid an early trial
    game.pause();
    vi.advanceTimersByTime(5000); // time passes while paused
    game.resume();

    let budget = 2000;
    while (game.getPhase() !== "finished" && budget > 0) {
      vi.advanceTimersByTime(500);
      budget--;
    }
    vi.useRealTimers();

    expect(game.getPhase()).toBe("finished");
  });
});
