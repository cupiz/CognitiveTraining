import { describe, it, expect, vi } from "vitest";
import { LighthouseKeeperGame, GAME_KEY, GAME_VERSION } from "./game.js";
import type { GameContext } from "@cog/game-core";
import type { LKRenderState } from "./game.js";

function makeContext(overrides: Partial<GameContext> = {}): GameContext {
  return {
    sessionId: "test-session",
    gameRunId: "test-run",
    gameKey: "lighthouse_keeper",
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

function tap(game: LighthouseKeeperGame, cellIndex: number) {
  game.handleInput({ type: "pointer_down", x: 0, y: 0, tClient: 0, cellIndex } as never);
}

function stateOf(game: LighthouseKeeperGame): LKRenderState {
  return game.getRenderState() as unknown as LKRenderState;
}

describe("LighthouseKeeperGame", () => {
  it("has correct key and version", () => {
    const game = new LighthouseKeeperGame();
    expect(game.key).toBe(GAME_KEY);
    expect(game.key).toBe("lighthouse_keeper");
    expect(game.version).toBe(GAME_VERSION);
    expect(game.version).toBe("0.1.0");
  });

  it("starts in practice phase when practiceTrials > 0", () => {
    const game = new LighthouseKeeperGame();
    game.start(makeContext({ practiceTrials: 3 }));
    expect(game.getPhase()).toBe("practice");
  });

  it("returns a valid render state with a sequence", () => {
    const game = new LighthouseKeeperGame();
    game.start(makeContext({ practiceTrials: 0 }));
    const state = stateOf(game);
    expect(state.phase).toBe("showing");
    expect(state.showSequence).toBe(true);
    expect(state.sequence.length).toBeGreaterThanOrEqual(2);
  });

  it("provides valid config for all difficulty levels", () => {
    const game = new LighthouseKeeperGame();
    for (let d = 1; d <= 10; d++) {
      const config = game.getConfig(d) as { seqLength: number; flashMs: number; patienceMs: number };
      expect(config.seqLength).toBeGreaterThanOrEqual(2);
      expect(config.flashMs).toBeGreaterThanOrEqual(400);
      expect(config.patienceMs).toBeGreaterThanOrEqual(6000);
    }
  });

  it("drains events with trial_started first", () => {
    const game = new LighthouseKeeperGame();
    game.start(makeContext({ practiceTrials: 0 }));
    const events = game.drainEvents();
    expect(events[0].eventType).toBe("trial_started");
  });

  it("records a correct sequence", () => {
    const game = new LighthouseKeeperGame();
    vi.useFakeTimers();
    game.start(makeContext({ difficulty: 1, practiceTrials: 0, maxTrials: 1 }));
    vi.advanceTimersByTime(2100); // D1 exposure = 2 × 1000ms
    const state = stateOf(game);
    expect(state.phase).toBe("waiting");
    for (const pane of state.sequence) tap(game, pane);
    vi.advanceTimersByTime(1000);

    const events = game.drainEvents();
    const response = events.find((e) => e.eventType === "response");
    expect(response).toBeDefined();
    expect((response!.payload as { correct: boolean }).correct).toBe(true);
    expect(
      (response!.payload as { selectedCells: number[] }).selectedCells,
    ).toEqual(state.sequence);
    vi.useRealTimers();
  });

  it("records a wrong pane as commission", () => {
    const game = new LighthouseKeeperGame();
    vi.useFakeTimers();
    game.start(makeContext({ difficulty: 1, practiceTrials: 0, maxTrials: 1 }));
    vi.advanceTimersByTime(2100);

    const state = stateOf(game);
    tap(game, (state.sequence[0] + 1) % 4); // deliberately wrong first pane
    vi.advanceTimersByTime(1000);

    const events = game.drainEvents();
    const response = events.find((e) => e.eventType === "response");
    expect(response).toBeDefined();
    expect((response!.payload as { correct: boolean }).correct).toBe(false);
    const summary = game.finish();
    expect(summary.commissionErrors).toBeGreaterThanOrEqual(1);
    vi.useRealTimers();
  });

  it("records a timeout as omission", () => {
    const game = new LighthouseKeeperGame();
    vi.useFakeTimers();
    game.start(makeContext({ difficulty: 1, practiceTrials: 0, maxTrials: 1 }));
    vi.advanceTimersByTime(2100); // into waiting
    vi.advanceTimersByTime(15500); // past D1 patience (15000ms)
    vi.advanceTimersByTime(1000);

    const events = game.drainEvents();
    expect(events.some((e) => e.eventType === "timeout")).toBe(true);
    const summary = game.finish();
    expect(summary.omissionErrors).toBeGreaterThanOrEqual(1);
    vi.useRealTimers();
  });

  it("completes all trials and finishes", () => {
    const game = new LighthouseKeeperGame();
    vi.useFakeTimers();
    game.start(makeContext({ difficulty: 1, practiceTrials: 0, maxTrials: 2 }));
    let budget = 400;
    while (game.getPhase() !== "finished" && budget > 0) {
      const state = stateOf(game);
      if (state.phase === "waiting") {
        for (const pane of state.sequence) tap(game, pane);
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

describe("LighthouseKeeperGame pause/resume", () => {
  it("can pause and resume", () => {
    const game = new LighthouseKeeperGame();
    game.start(makeContext({ practiceTrials: 1 }));
    game.pause();
    expect(game.getPhase()).toBe("paused");
    game.resume();
    expect(game.getPhase()).not.toBe("paused");
  });

  it("cannot pause when idle", () => {
    const game = new LighthouseKeeperGame();
    game.pause();
    expect(game.getPhase()).toBe("idle");
  });
});