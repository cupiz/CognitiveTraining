import { describe, it, expect, vi } from "vitest";
import { PairCardsGame, GAME_KEY, GAME_VERSION } from "./game.js";
import type { GameContext } from "@cog/game-core";

function makeContext(overrides: Partial<GameContext> = {}): GameContext {
  return {
    sessionId: "test-session",
    gameRunId: "test-run",
    gameKey: "pair_cards",
    gameVersion: GAME_VERSION,
    difficulty: 1,
    seed: 42,
    isPractice: false,
    maxTrials: 20,
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

function flipCard(game: PairCardsGame, idx: number) {
  game.handleInput({ type: "pointer_down", x: idx, y: 0, tClient: 0, cellIndex: idx } as unknown as Parameters<
    PairCardsGame["handleInput"]
  >[0]);
}

describe("PairCardsGame", () => {
  it("has correct key and version", () => {
    const game = new PairCardsGame();
    expect(game.key).toBe(GAME_KEY);
    expect(game.version).toBe(GAME_VERSION);
  });

  it("deals the right number of cards and enters play after preview", () => {
    vi.useFakeTimers();
    const game = new PairCardsGame();
    game.start(makeContext({ difficulty: 1 }));
    vi.advanceTimersByTime(20); // boot timer fires → preview phase
    const state = game.getRenderState() as { phase: string; cards: unknown[] };
    expect(state.phase).toBe("preview");
    expect(state.cards.length).toBe(8); // 4 pairs × 2
    vi.advanceTimersByTime(3000); // preview 2500ms elapsed
    expect((game.getRenderState() as { phase: string }).phase).toBe("play");
    vi.useRealTimers();
  });

  it("keeps a matched pair open and finishes when all pairs are found", () => {
    vi.useFakeTimers();
    const game = new PairCardsGame();
    game.start(makeContext({ difficulty: 1 }));
    vi.advanceTimersByTime(3000); // preview over

    // Find all 4 pairs by peeking the engine's pairIds.
    const ids = (game as unknown as { cards: { pairId: number }[] }).cards.map((c) => c.pairId);
    const byPair = new Map<number, number[]>();
    ids.forEach((pairId, idx) => {
      byPair.set(pairId, [...(byPair.get(pairId) ?? []), idx]);
    });
    for (const [pairId, [a, b]] of byPair) {
      void pairId;
      flipCard(game, a);
      flipCard(game, b);
    }
    const final = game.getRenderState() as { matchedPairs: number; phase: string; score: number };
    expect(final.matchedPairs).toBe(4);
    expect(final.phase).toBe("finished");
    expect(final.score).toBe(4);
    vi.useRealTimers();
  });

  it("flips a mismatched pair back after a beat", () => {
    vi.useFakeTimers();
    const game = new PairCardsGame();
    game.start(makeContext({ difficulty: 1 }));
    vi.advanceTimersByTime(3000);

    const ids = (game as unknown as { cards: { pairId: number }[] }).cards;
    const first = ids[0];
    const different = ids.findIndex((c, i) => i !== 0 && c.pairId !== first.pairId);
    flipCard(game, 0);
    flipCard(game, different);
    let state = game.getRenderState() as { phase: string; mismatches: number };
    expect(state.mismatches).toBe(1);
    vi.advanceTimersByTime(1500); // flip-back elapsed
    state = game.getRenderState() as { phase: string; mismatches: number };
    expect(state.phase).toBe("play");
    vi.useRealTimers();
  });

  it("ends the round when the mismatch budget runs out", () => {
    vi.useFakeTimers();
    const game = new PairCardsGame();
    game.start(makeContext({ difficulty: 1 }));
    vi.advanceTimersByTime(3000);

    // Deterministic mismatches: flip card 0 + the first card with a different
    // pairId, every iteration. Budget = 4*2+3 = 11 mismatches.
    for (let i = 0; i < 13; i++) {
      const state = game.getRenderState() as { phase: string };
      if (state.phase !== "play") break;
      const pairIds = (game as unknown as { cards: { pairId: number }[] }).cards.map((c) => c.pairId);
      const second = pairIds.findIndex((pid, idx) => idx !== 0 && pid !== pairIds[0]);
      flipCard(game, 0);
      flipCard(game, second);
      vi.advanceTimersByTime(1200); // flip-back resolves
    }
    const final = game.getRenderState() as { phase: string; mismatches: number; matchedPairs: number };
    expect(final.mismatches).toBeGreaterThanOrEqual(11);
    expect(final.phase).toBe("finished");
    vi.useRealTimers();
  });

  it("cannot pause when idle", () => {
    const game = new PairCardsGame();
    game.pause();
    expect(game.getPhase()).toBe("idle");
  });
});
