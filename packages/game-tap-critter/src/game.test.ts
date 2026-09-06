import { describe, it, expect, vi } from "vitest";
import { TapCritterGame, GAME_KEY, GAME_VERSION } from "./game.js";
import type { GameContext } from "@cog/game-core";

function makeContext(overrides: Partial<GameContext> = {}): GameContext {
  return {
    sessionId: "test-session",
    gameRunId: "test-run",
    gameKey: "tap_critter",
    gameVersion: GAME_VERSION,
    difficulty: 1,
    seed: 42,
    isPractice: false,
    maxTrials: 5,
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

function tapHole(game: TapCritterGame, hole: number) {
  game.handleInput({ type: "pointer_down", x: hole, y: 0, tClient: 0, cellIndex: hole } as unknown as Parameters<
    TapCritterGame["handleInput"]
  >[0]);
}

describe("TapCritterGame", () => {
  it("has correct key and version", () => {
    const game = new TapCritterGame();
    expect(game.key).toBe(GAME_KEY);
    expect(game.version).toBe(GAME_VERSION);
  });

  it("boots with a critter popping out of a hole", () => {
    const game = new TapCritterGame();
    game.start(makeContext({ practiceTrials: 0 }));
    const state = game.getRenderState() as {
      phase: string;
      currentHole: number;
      currentKind: string | null;
    };
    expect(state.phase).toBe("pop");
    expect(state.currentHole).toBeGreaterThanOrEqual(0);
    expect(["critter", "decoy"]).toContain(state.currentKind);
    expect(game.getPhase()).toBe("playing");
  });

  it("cannot pause when idle", () => {
    const game = new TapCritterGame();
    game.pause();
    expect(game.getPhase()).toBe("idle");
  });

  it("keeps timers frozen across a pause → resume → pause cycle", () => {
    const game = new TapCritterGame();
    game.start(makeContext({ practiceTrials: 0 }));
    vi.useFakeTimers();

    vi.advanceTimersByTime(200);
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

  it("finishes the round after all pops", () => {
    const game = new TapCritterGame();
    game.start(makeContext({ practiceTrials: 0, maxTrials: 3 }));
    vi.useFakeTimers();
    for (let i = 0; i < 8; i++) {
      vi.advanceTimersByTime(6000); // pop + between + gap cycles
    }
    const summary = game.finish();
    expect(summary.gameKey).toBe("tap_critter");
    expect(game.getPhase()).toBe("finished");
    vi.useRealTimers();
  });

  it("tapping the occupied hole closes the pop early", () => {
    const game = new TapCritterGame();
    game.start(makeContext({ practiceTrials: 0 }));
    vi.useFakeTimers();
    vi.advanceTimersByTime(100);
    const hole = (game.getRenderState() as { currentHole: number }).currentHole;
    tapHole(game, hole);
    const state = game.getRenderState() as { phase: string; feedbackKind: string | null };
    expect(["caught", "wrong"]).toContain(state.feedbackKind);
    expect(state.phase).toBe("between");
    vi.useRealTimers();
  });
});
