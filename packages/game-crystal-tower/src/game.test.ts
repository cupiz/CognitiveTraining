import { describe, it, expect, vi } from "vitest";
import { CrystalTowerGame, GAME_KEY, GAME_VERSION } from "./game.js";
import type { GameContext } from "@cog/game-core";

function makeContext(overrides: Partial<GameContext> = {}): GameContext {
  return {
    sessionId: "test-session",
    gameRunId: "test-run",
    gameKey: "crystal_tower",
    gameVersion: GAME_VERSION,
    difficulty: 1,
    seed: 42,
    isPractice: false,
    maxTrials: 2,
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

function tapPeg(game: CrystalTowerGame, peg: number) {
  // cellIndex travels as an extra field (the shell injects it the same way).
  game.handleInput({ type: "pointer_down", x: peg, y: 0, tClient: 0, cellIndex: peg } as unknown as Parameters<
    CrystalTowerGame["handleInput"]
  >[0]);
}

function solveOptimally(game: CrystalTowerGame, disks: number, from = 0, to = 2, via = 1) {
  if (disks === 0) return;
  solveOptimally(game, disks - 1, from, via, to);
  tapPeg(game, from);
  tapPeg(game, to);
  solveOptimally(game, disks - 1, via, to, from);
}

describe("CrystalTowerGame", () => {
  it("has correct key and version", () => {
    const game = new CrystalTowerGame();
    expect(game.key).toBe(GAME_KEY);
    expect(game.version).toBe(GAME_VERSION);
  });

  it("starts with all crystals stacked on peg 0", () => {
    const game = new CrystalTowerGame();
    game.start(makeContext({ difficulty: 1 }));
    const state = game.getRenderState() as { pegs: number[][]; disks: number };
    expect(state.pegs[0]).toEqual([3, 2, 1]);
    expect(state.pegs[1]).toEqual([]);
    expect(state.pegs[2]).toEqual([]);
    expect(game.getPhase()).toBe("playing");
  });

  it("cannot pause when idle", () => {
    const game = new CrystalTowerGame();
    game.pause();
    expect(game.getPhase()).toBe("idle");
  });

  it("rejects putting a bigger crystal on a smaller one", () => {
    const game = new CrystalTowerGame();
    game.start(makeContext({ difficulty: 1 }));
    tapPeg(game, 0); // lift size 1
    tapPeg(game, 1); // drop on empty peg — legal
    tapPeg(game, 0); // lift size 2
    tapPeg(game, 1); // illegal: size 2 on size 1
    const state = game.getRenderState() as { pegs: number[][]; feedbackKind: string | null };
    expect(state.pegs[1]).toEqual([1]);
    expect(state.pegs[0]).toEqual([3, 2]);
    expect(state.feedbackKind).toBe("invalid_move");
  });

  it("solves the round when all crystals reach the rightmost tower", () => {
    const game = new CrystalTowerGame();
    game.start(makeContext({ difficulty: 1 }));
    solveOptimally(game, 3);
    const state = game.getRenderState() as { pegs: number[][]; feedbackKind: string | null; score: number };
    expect(state.pegs[2]).toEqual([3, 2, 1]);
    expect(state.feedbackKind).toBe("solved");
    expect(state.score).toBe(1);
  });

  it("fails the round when the move limit is reached", () => {
    const game = new CrystalTowerGame();
    game.start(makeContext({ difficulty: 1, maxTrials: 1 }));
    vi.useFakeTimers();
    // Burn legal moves: move the smallest crystal out of peg 0, then shuttle
    // it between pegs 2/1 — each drop is one move toward the limit.
    const taps = [0, 1];
    for (let i = 0; i < 20; i++) taps.push(2, 1);
    for (const peg of taps) tapPeg(game, peg);
    const state = game.getRenderState() as { feedbackKind: string | null };
    expect(state.feedbackKind).toBe("too_many_moves");
    vi.useRealTimers();
  });

  it("keeps timers frozen across a pause → resume → pause cycle", () => {
    const game = new CrystalTowerGame();
    game.start(makeContext({ difficulty: 1 }));
    vi.useFakeTimers();

    vi.advanceTimersByTime(1000);
    game.pause();
    vi.advanceTimersByTime(5000);
    expect(game.getRenderState().phase).toBe("paused");

    game.resume();
    vi.advanceTimersByTime(100);
    game.pause();
    vi.advanceTimersByTime(120_000);

    expect(game.getRenderState().phase).toBe("paused");
    expect(game.getPhase()).not.toBe("finished");
    vi.useRealTimers();
  });
});
