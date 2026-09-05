import { describe, it, expect, vi } from "vitest";
import { WideViewGame, GAME_KEY, GAME_VERSION } from "./game.js";
import type { GameContext } from "@cog/game-core";

function makeContext(overrides: Partial<GameContext> = {}): GameContext {
  return {
    sessionId: "test-session",
    gameRunId: "test-run",
    gameKey: "wide_view",
    gameVersion: GAME_VERSION,
    difficulty: 1,
    seed: 42,
    isPractice: false,
    maxTrials: 4,
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

describe("WideViewGame", () => {
  it("has correct key and version", () => {
    const game = new WideViewGame();
    expect(game.key).toBe(GAME_KEY);
    expect(game.version).toBe(GAME_VERSION);
  });

  it("boots into the fixation phase with a central symbol", () => {
    const game = new WideViewGame();
    game.start(makeContext({ practiceTrials: 0 }));
    const state = game.getRenderState() as { phase: string; centralSymbol: string | null };
    expect(state.phase).toBe("fixation");
    expect(state.centralSymbol).toBeTruthy();
    expect(game.getPhase()).toBe("playing");
  });

  it("flashes a peripheral target once during fixation", () => {
    vi.useFakeTimers();
    const game = new WideViewGame();
    game.start(makeContext({ practiceTrials: 0, difficulty: 1 }));

    // D1: flashMs 500 within centralMs 2400 — step through the fixation.
    let sawFlash = false;
    for (let i = 0; i < 26 && !sawFlash; i++) {
      vi.advanceTimersByTime(100);
      const state = game.getRenderState() as { flashActive: boolean; flashPosition: number };
      if (state.flashActive) {
        sawFlash = true;
        expect(state.flashPosition).toBeGreaterThanOrEqual(0);
        expect(state.flashPosition).toBeLessThanOrEqual(7);
      }
    }
    expect(sawFlash).toBe(true);
    vi.useRealTimers();
  });

  it("moves to the probe phase after the fixation window", () => {
    vi.useFakeTimers();
    const game = new WideViewGame();
    game.start(makeContext({ practiceTrials: 0, difficulty: 1 }));
    vi.advanceTimersByTime(2600); // centralMs 2400 elapsed
    const state = game.getRenderState() as { phase: string };
    expect(state.phase).toBe("probe");
    vi.useRealTimers();
  });

  it("scores a correct probe and shows the correct slot in feedback", () => {
    vi.useFakeTimers();
    const game = new WideViewGame();
    game.start(makeContext({ practiceTrials: 0, difficulty: 1 }));
    vi.advanceTimersByTime(2600); // → probe

    // Peek the correct slot, then answer correctly.
    const correct = (game as unknown as { flashSlot: number }).flashSlot;
    game.handleInput({ type: "pointer_down", x: 0, y: 0, tClient: 0, cellIndex: correct } as unknown as Parameters<WideViewGame["handleInput"]>[0]);
    const state = game.getRenderState() as {
      phase: string;
      feedbackKind: string | null;
      correctSlot: number;
      score: number;
    };
    expect(state.phase).toBe("feedback");
    expect(state.feedbackKind).toBe("correct");
    expect(state.correctSlot).toBe(correct);
    expect(state.score).toBe(1);
    vi.useRealTimers();
  });

  it("finishes the round after all trials", () => {
    const game = new WideViewGame();
    game.start(makeContext({ practiceTrials: 0, maxTrials: 2, difficulty: 1 }));
    vi.useFakeTimers();
    for (let i = 0; i < 6; i++) {
      vi.advanceTimersByTime(6000); // fixation + feedback + intermission
      game.handleInput({ type: "pointer_down", x: 0, y: 0, tClient: 0, cellIndex: 0 } as unknown as Parameters<WideViewGame["handleInput"]>[0]);
    }
    const summary = game.finish();
    expect(summary.gameKey).toBe("wide_view");
    expect(game.getPhase()).toBe("finished");
    vi.useRealTimers();
  });

  it("cannot pause when idle", () => {
    const game = new WideViewGame();
    game.pause();
    expect(game.getPhase()).toBe("idle");
  });
});
