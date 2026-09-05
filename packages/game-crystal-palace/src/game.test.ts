import { describe, it, expect, vi } from "vitest";
import { CrystalPalaceGame, GAME_KEY, GAME_VERSION } from "./game.js";
import type { GameContext } from "@cog/game-core";
import type { CPRenderState } from "./game.js";

function makeContext(overrides: Partial<GameContext> = {}): GameContext {
  return {
    sessionId: "test-session",
    gameRunId: "test-run",
    gameKey: "crystal_palace",
    gameVersion: GAME_VERSION,
    difficulty: 1,
    seed: 42,
    isPractice: false,
    maxTrials: 3,
    practiceTrials: 1,
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

function tap(game: CrystalPalaceGame, cellIndex: number) {
  game.handleInput({ type: "pointer_down", x: 0, y: 0, tClient: 0, cellIndex } as never);
}

function stateOf(game: CrystalPalaceGame): CPRenderState {
  return game.getRenderState() as unknown as CPRenderState;
}

describe("CrystalPalaceGame", () => {
  it("has correct key and version", () => {
    const game = new CrystalPalaceGame();
    expect(game.key).toBe(GAME_KEY);
    expect(game.key).toBe("crystal_palace");
    expect(game.version).toBe(GAME_VERSION);
    expect(game.version).toBe("0.1.0");
  });

  it("starts in practice phase when practiceTrials > 0", () => {
    const game = new CrystalPalaceGame();
    game.start(makeContext({ practiceTrials: 3 }));
    expect(game.getPhase()).toBe("practice");
  });

  it("returns a valid render state with a grid", () => {
    const game = new CrystalPalaceGame();
    game.start(makeContext({ practiceTrials: 0 }));
    const state = stateOf(game);
    expect(state.grid).toBeDefined();
    expect(state.grid!.cells.length).toBeGreaterThanOrEqual(4);
    expect(state.phase).toBe("waiting");
  });

  it("provides valid config for all difficulty levels", () => {
    const game = new CrystalPalaceGame();
    for (let d = 1; d <= 10; d++) {
      const config = game.getConfig(d) as {
        gridRows: number;
        gridCols: number;
        matchCount: number;
        deadlineMs: number;
      };
      expect(config.gridRows).toBeGreaterThanOrEqual(2);
      expect(config.matchCount).toBeGreaterThanOrEqual(2);
      expect(config.deadlineMs).toBeGreaterThanOrEqual(8000);
    }
  });

  it("drains events with trial_started first", () => {
    const game = new CrystalPalaceGame();
    game.start(makeContext({ practiceTrials: 0 }));
    const events = game.drainEvents();
    expect(events[0].eventType).toBe("trial_started");
  });

  it("finds every matching crystal for a perfect run", () => {
    const game = new CrystalPalaceGame();
    vi.useFakeTimers();
    game.start(makeContext({ difficulty: 1, practiceTrials: 0, maxTrials: 1 }));

    const state = stateOf(game);
    const matches = state.grid!.cells.filter((c) => c.isMatch);
    for (const m of matches) tap(game, m.id);
    vi.advanceTimersByTime(1000);

    const events = game.drainEvents();
    const response = events.find((e) => e.eventType === "response");
    expect(response).toBeDefined();
    expect((response!.payload as { correct: boolean }).correct).toBe(true);
    expect(
      (response!.payload as { selectedCells: number[] }).selectedCells.length,
    ).toBe(matches.length);
    vi.useRealTimers();
  });

  it("ends as a commission when tapping a wrong crystal", () => {
    const game = new CrystalPalaceGame();
    vi.useFakeTimers();
    game.start(makeContext({ difficulty: 1, practiceTrials: 0, maxTrials: 1 }));

    const state = stateOf(game);
    const wrong = state.grid!.cells.find((c) => !c.isMatch)!;
    tap(game, wrong.id);
    vi.advanceTimersByTime(1000);

    const events = game.drainEvents();
    const response = events.find((e) => e.eventType === "response");
    expect(response).toBeDefined();
    expect((response!.payload as { correct: boolean }).correct).toBe(false);
    const summary = game.finish();
    expect(summary.commissionErrors).toBeGreaterThanOrEqual(1);
    vi.useRealTimers();
  });

  it("records a deadline timeout as omission", () => {
    const game = new CrystalPalaceGame();
    vi.useFakeTimers();
    game.start(makeContext({ difficulty: 1, practiceTrials: 0, maxTrials: 1 }));
    vi.advanceTimersByTime(20500); // past D1 deadline (20000ms)
    vi.advanceTimersByTime(1000);

    const events = game.drainEvents();
    expect(events.some((e) => e.eventType === "timeout")).toBe(true);
    const summary = game.finish();
    expect(summary.omissionErrors).toBeGreaterThanOrEqual(1);
    vi.useRealTimers();
  });

  it("completes all trials and finishes", () => {
    const game = new CrystalPalaceGame();
    vi.useFakeTimers();
    game.start(makeContext({ difficulty: 1, practiceTrials: 0, maxTrials: 2 }));
    let budget = 400;
    while (game.getPhase() !== "finished" && budget > 0) {
      const state = stateOf(game);
      if (state.phase === "waiting" && state.grid) {
        for (const m of state.grid.cells.filter((c) => c.isMatch)) tap(game, m.id);
      }
      vi.advanceTimersByTime(400);
      budget--;
    }
    vi.useRealTimers();
    expect(game.getPhase()).toBe("finished");
    const summary = game.finish();
    expect(summary.totalTrials).toBeGreaterThanOrEqual(2);
  });
});

describe("CrystalPalaceGame pause/resume", () => {
  it("can pause and resume", () => {
    const game = new CrystalPalaceGame();
    game.start(makeContext({ practiceTrials: 1 }));
    game.pause();
    expect(game.getPhase()).toBe("paused");
    game.resume();
    expect(game.getPhase()).not.toBe("paused");
  });

  it("cannot pause when idle", () => {
    const game = new CrystalPalaceGame();
    game.pause();
    expect(game.getPhase()).toBe("idle");
  });
});