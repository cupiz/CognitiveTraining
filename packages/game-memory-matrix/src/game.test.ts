import { describe, it, expect, vi } from "vitest";
import { MemoryMatrixGame, GAME_KEY, GAME_VERSION } from "./game.js";
import type { GameContext } from "@cog/game-core";
import { captureDeviceContext } from "@cog/game-core";

function createContext(overrides: Partial<GameContext> = {}): GameContext {
  return {
    sessionId: "test-session",
    gameRunId: "test-run",
    gameKey: "memory_matrix",
    gameVersion: GAME_VERSION,
    difficulty: 3,
    seed: 42,
    isPractice: false,
    practiceTrials: 2,
    maxTrials: 10,
    deviceContext: captureDeviceContext(),
    extra: {},
    startedAt: performance.now(),
    sendTelemetry: {
      send: async () => ({ accepted: 0, rejected: 0, rejectedSequences: [] }),
    },
    ...overrides,
  };
}

describe("MemoryMatrixGame", () => {
  it("has correct key and version", () => {
    const game = new MemoryMatrixGame();
    expect(game.key).toBe(GAME_KEY);
    expect(game.version).toBe(GAME_VERSION);
  });

  it("getConfig returns difficulty parameters", () => {
    const game = new MemoryMatrixGame();
    const config = game.getConfig(3);
    expect(config).toHaveProperty("gridRows");
    expect(config).toHaveProperty("gridCols");
    expect(config).toHaveProperty("targetCount");
    expect(config).toHaveProperty("exposureMs");
  });

  it("validateConfig passes for valid config", () => {
    const game = new MemoryMatrixGame();
    expect(() => game.validateConfig(game.getConfig(5))).not.toThrow();
  });

  it("starts in practice phase when practiceTrials > 0", () => {
    const game = new MemoryMatrixGame();
    game.start(createContext({ practiceTrials: 3 }));
    expect(game.getPhase()).toBe("practice");
  });

  it("starts without practice when practiceTrials is 0", () => {
    const game = new MemoryMatrixGame();
    game.start(createContext({ practiceTrials: 0 }));
    // Should transition through countdown
    expect(["countdown", "playing"]).toContain(game.getPhase());
  });

  it("getRenderState returns grid info", () => {
    const game = new MemoryMatrixGame();
    game.start(createContext({ difficulty: 3 }));
    const state = game.getRenderState();
    expect(state).toHaveProperty("gridRows");
    expect(state).toHaveProperty("gridCols");
    expect(state).toHaveProperty("showTargets");
    expect(state).toHaveProperty("isPractice");
  });

  it("produces a summary on finish", () => {
    const game = new MemoryMatrixGame();
    game.start(createContext({ practiceTrials: 0, maxTrials: 5 }));
    const summary = game.finish();
    expect(summary.gameKey).toBe("memory_matrix");
    expect(summary.gameVersion).toBe(GAME_VERSION);
    expect(summary.totalTrials).toBeGreaterThanOrEqual(0);
    expect(summary.omissionErrors).toBeGreaterThanOrEqual(0);
    expect(summary.commissionErrors).toBeGreaterThanOrEqual(0);
    expect(summary.qualityFlags).toBeInstanceOf(Array);
  });

  it("pause/resume works", () => {
    const game = new MemoryMatrixGame();
    game.start(createContext({ practiceTrials: 0 }));
    game.pause();
    expect(game.getPhase()).toBe("paused");
    game.resume();
    expect(game.getPhase()).not.toBe("paused");
  });

  it("seed produces deterministic grid", () => {
    const game1 = new MemoryMatrixGame();
    const game2 = new MemoryMatrixGame();

    const ctx1 = createContext({ seed: 12345, practiceTrials: 0 });
    const ctx2 = createContext({ seed: 12345, practiceTrials: 0 });

    game1.start(ctx1);
    game2.start(ctx2);

    const state1 = game1.getRenderState();
    const state2 = game2.getRenderState();

    // Same seed should produce same highlighted cells
    expect(state1.highlightedCells).toEqual(state2.highlightedCells);
  });
});

describe("pause/resume continues after mid-trial pause", () => {
  it("completes the round after a pause mid-trial", () => {
    const game = new MemoryMatrixGame();
    game.start(createContext({ practiceTrials: 0, maxTrials: 3, difficulty: 1 }));

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
