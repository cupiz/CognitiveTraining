import { describe, it, expect, vi } from "vitest";
import { TrainNBackGame, GAME_KEY, GAME_VERSION } from "./game.js";
import type { GameContext } from "@cog/game-core";

function makeContext(overrides: Partial<GameContext> = {}): GameContext {
  return {
    sessionId: "test-session",
    gameRunId: "test-run",
    gameKey: "train_n_back",
    gameVersion: GAME_VERSION,
    difficulty: 3,
    seed: 42,
    isPractice: false,
    maxTrials: 6,
    practiceTrials: 0,
    deviceContext: {
      userAgent: "test",
      screenWidth: 1280,
      screenHeight: 720,
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

describe("TrainNBackGame", () => {
  it("has correct key and version", () => {
    const game = new TrainNBackGame();
    expect(game.key).toBe(GAME_KEY);
    expect(game.version).toBe(GAME_VERSION);
  });

  it("boots into the wagon phase with a fruit on screen", () => {
    const game = new TrainNBackGame();
    game.start(makeContext({ practiceTrials: 0 }));
    const state = game.getRenderState() as { phase: string; currentFruit: string | null };
    expect(state.phase).toBe("wagon");
    expect(state.currentFruit).toBeTruthy();
    expect(game.getPhase()).toBe("playing");
  });

  it("cannot pause when idle", () => {
    const game = new TrainNBackGame();
    game.pause();
    expect(game.getPhase()).toBe("idle");
  });

  it("keeps timers frozen across a pause → resume → pause cycle", () => {
    const game = new TrainNBackGame();
    game.start(makeContext({ practiceTrials: 0, difficulty: 1 }));
    vi.useFakeTimers();

    vi.advanceTimersByTime(300); // mid wagon
    game.pause(); // first pause freezes the wagon deadline
    vi.advanceTimersByTime(5000); // paused — nothing may advance
    expect(game.getRenderState().phase).toBe("paused");

    game.resume();
    vi.advanceTimersByTime(100); // still mid wagon
    game.pause(); // second pause must freeze again
    vi.advanceTimersByTime(60_000); // a full minute passes while paused

    expect(game.getRenderState().phase).toBe("paused");
    expect(game.getPhase()).not.toBe("finished");
    vi.useRealTimers();
  });

  it("finishes the round after all wagons", () => {
    const game = new TrainNBackGame();
    game.start(makeContext({ practiceTrials: 0, maxTrials: 2, difficulty: 1 }));
    vi.useFakeTimers();

    for (let i = 0; i < 4; i++) {
      vi.advanceTimersByTime(5000); // let the wagon deadline close each one
    }
    const summary = game.finish();
    expect(summary.gameKey).toBe("train_n_back");
    expect(game.getPhase()).toBe("finished");
    vi.useRealTimers();
  });

  it("accepts a bell tap as a response and advances to feedback", () => {
    const game = new TrainNBackGame();
    game.start(makeContext({ practiceTrials: 0, maxTrials: 5, difficulty: 1 }));
    vi.useFakeTimers();

    vi.advanceTimersByTime(100); // wagon on screen
    game.handleInput({ type: "pointer_down", x: 0, y: 0, tClient: 0 });
    const state = game.getRenderState() as { phase: string; awaitingResponse: boolean };
    expect(state.phase).toBe("feedback");
    expect(state.awaitingResponse).toBe(false);
    vi.useRealTimers();
  });

  it("ignores a second bell tap in the same wagon", () => {
    const game = new TrainNBackGame();
    game.start(makeContext({ practiceTrials: 0, maxTrials: 5, difficulty: 1 }));
    vi.useFakeTimers();
    vi.advanceTimersByTime(100);

    game.handleInput({ type: "pointer_down", x: 0, y: 0, tClient: 0 });
    const before = game.getRenderState() as { trialNumber: number };
    game.handleInput({ type: "pointer_down", x: 0, y: 0, tClient: 0 });
    const after = game.getRenderState() as { trialNumber: number };
    expect(after.trialNumber).toBe(before.trialNumber);
    vi.useRealTimers();
  });
});
