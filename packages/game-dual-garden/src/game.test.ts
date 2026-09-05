import { describe, it, expect, vi } from "vitest";
import { DualGardenGame, GAME_KEY, GAME_VERSION } from "./game.js";
import type { GameContext } from "@cog/game-core";

function makeContext(overrides: Partial<GameContext> = {}): GameContext {
  return {
    sessionId: "test-session",
    gameRunId: "test-run",
    gameKey: "dual_garden",
    gameVersion: GAME_VERSION,
    difficulty: 1,
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

describe("DualGardenGame", () => {
  it("has correct key and version", () => {
    const game = new DualGardenGame();
    expect(game.key).toBe(GAME_KEY);
    expect(game.version).toBe(GAME_VERSION);
  });

  it("boots into a round with both streams visible", () => {
    const game = new DualGardenGame();
    game.start(makeContext({ practiceTrials: 0 }));
    const state = game.getRenderState() as {
      phase: string;
      currentAnimal: string | null;
      currentFruit: string | null;
      targetAnimal: string;
      targetFruit: string;
    };
    expect(state.phase).toBe("round");
    expect(state.currentAnimal).toBeTruthy();
    expect(state.currentFruit).toBeTruthy();
    expect(state.targetAnimal).toBeTruthy();
    expect(state.targetFruit).toBeTruthy();
    expect(game.getPhase()).toBe("playing");
  });

  it("cannot pause when idle", () => {
    const game = new DualGardenGame();
    game.pause();
    expect(game.getPhase()).toBe("idle");
  });

  it("keeps timers frozen across a pause → resume → pause cycle", () => {
    const game = new DualGardenGame();
    game.start(makeContext({ practiceTrials: 0 }));
    vi.useFakeTimers();

    vi.advanceTimersByTime(300);
    game.pause();
    vi.advanceTimersByTime(5000);
    expect(game.getRenderState().phase).toBe("paused");

    game.resume();
    vi.advanceTimersByTime(100);
    game.pause();
    vi.advanceTimersByTime(60_000);

    expect(game.getRenderState().phase).toBe("paused");
    expect(game.getPhase()).not.toBe("finished");
    vi.useRealTimers();
  });

  it("finishes the round after all trials", () => {
    const game = new DualGardenGame();
    game.start(makeContext({ practiceTrials: 0, maxTrials: 2 }));
    vi.useFakeTimers();

    for (let i = 0; i < 6; i++) {
      vi.advanceTimersByTime(5000); // window + feedback + intermission
    }
    const summary = game.finish();
    expect(summary.gameKey).toBe("dual_garden");
    expect(game.getPhase()).toBe("finished");
    vi.useRealTimers();
  });

  it("accepts a marker tap as a response and advances to feedback", () => {
    const game = new DualGardenGame();
    game.start(makeContext({ practiceTrials: 0 }));
    vi.useFakeTimers();
    vi.advanceTimersByTime(100);

    game.handleInput({ type: "pointer_down", x: 0, y: 0, tClient: 0 });
    const state = game.getRenderState() as { phase: string; awaitingResponse: boolean };
    expect(state.phase).toBe("feedback");
    expect(state.awaitingResponse).toBe(false);
    vi.useRealTimers();
  });
});
