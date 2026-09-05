import { describe, it, expect, vi } from "vitest";

/** The engine gates serves on performance.now(), so tests fake it too. */
const FAKE_TIMERS: Parameters<typeof vi.useFakeTimers>[0] = {
  toFake: ["performance", "setTimeout", "clearTimeout", "setInterval", "clearInterval"],
};
import { SushiExpressGame, GAME_KEY, GAME_VERSION } from "./game.js";
import { SERVE_ZONE_LEFT, SERVE_ZONE_RIGHT } from "./difficulty.js";
import type { GameContext } from "@cog/game-core";
import type { SXRenderState } from "./game.js";

function makeContext(overrides: Partial<GameContext> = {}): GameContext {
  return {
    sessionId: "test-session",
    gameRunId: "test-run",
    gameKey: "sushi_express",
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

function tap(game: SushiExpressGame) {
  game.handleInput({ type: "pointer_down", x: 0, y: 0, tClient: 0, cellIndex: 0 } as never);
}

function stateOf(game: SushiExpressGame): SXRenderState {
  return game.getRenderState() as unknown as SXRenderState;
}

describe("SushiExpressGame", () => {
  it("has correct key and version", () => {
    const game = new SushiExpressGame();
    expect(game.key).toBe(GAME_KEY);
    expect(game.key).toBe("sushi_express");
    expect(game.version).toBe(GAME_VERSION);
    expect(game.version).toBe("0.1.0");
  });

  it("starts in practice phase when practiceTrials > 0", () => {
    const game = new SushiExpressGame();
    game.start(makeContext({ practiceTrials: 3 }));
    expect(game.getPhase()).toBe("practice");
  });

  it("returns a valid render state with plates", () => {
    const game = new SushiExpressGame();
    game.start(makeContext({ practiceTrials: 0 }));
    const state = stateOf(game);
    expect(state.plates.length).toBeGreaterThanOrEqual(4);
    expect(state.targetSushi).toBeGreaterThanOrEqual(0);
    expect(state.phase).toBe("waiting");
  });

  it("provides valid config for all difficulty levels", () => {
    const game = new SushiExpressGame();
    for (let d = 1; d <= 10; d++) {
      const config = game.getConfig(d) as {
        platesPerTrial: number;
        sushiTypes: number;
        beltMs: number;
        spawnIntervalMs: number;
      };
      expect(config.platesPerTrial).toBeGreaterThanOrEqual(4);
      expect(config.sushiTypes).toBeGreaterThanOrEqual(2);
      expect(config.beltMs).toBeGreaterThanOrEqual(1500);
      expect(config.spawnIntervalMs).toBeGreaterThanOrEqual(600);
    }
  });

  it("drains events with trial_started first", () => {
    const game = new SushiExpressGame();
    game.start(makeContext({ practiceTrials: 0 }));
    const events = game.drainEvents();
    expect(events[0].eventType).toBe("trial_started");
  });

  it("serves every target plate for a perfect run", () => {
    const game = new SushiExpressGame();
    vi.useFakeTimers(FAKE_TIMERS);
    game.start(makeContext({ difficulty: 1, practiceTrials: 0, maxTrials: 1 }));
    const config = game.getConfig(1) as { beltMs: number; spawnIntervalMs: number };
    const beltMs = config.beltMs;
    const spawnMs = config.spawnIntervalMs;

    const state = stateOf(game);
    // Tap each TARGET plate exactly when it sits in the middle of the zone.
    // advanceTimersByTime is incremental, so advance by the delta.
    let t = 0;
    for (const plate of state.plates) {
      if (!plate.isTarget) continue;
      const tMid = plate.id * spawnMs + ((SERVE_ZONE_LEFT + SERVE_ZONE_RIGHT) / 2) * beltMs;
      vi.advanceTimersByTime(Math.max(0, tMid - t));
      t = tMid;
      tap(game);
    }
    vi.advanceTimersByTime(2000); // belt end + feedback

    const events = game.drainEvents();
    const response = events.find((e) => e.eventType === "response");
    // All targets served, no distractor served → perfect run → correct:true.
    expect(response).toBeDefined();
    expect((response!.payload as { correct: boolean }).correct).toBe(true);
    vi.useRealTimers();
  });

  it("missed targets count as an omission", () => {
    const game = new SushiExpressGame();
    vi.useFakeTimers(FAKE_TIMERS);
    game.start(makeContext({ difficulty: 1, practiceTrials: 0, maxTrials: 1 }));
    // Do nothing — let the belt run out.
    const state = stateOf(game);
    const endMs =
      (state.plates.length - 1) * state.spawnIntervalMs + SERVE_ZONE_RIGHT * state.beltMs + 200;
    vi.advanceTimersByTime(endMs + 1200);

    const events = game.drainEvents();
    expect(events.some((e) => e.eventType === "timeout")).toBe(true);
    const summary = game.finish();
    expect(summary.omissionErrors).toBeGreaterThanOrEqual(1);
    vi.useRealTimers();
  });

  it("completes all trials and finishes", () => {
    const game = new SushiExpressGame();
    vi.useFakeTimers(FAKE_TIMERS);
    game.start(makeContext({ difficulty: 1, practiceTrials: 0, maxTrials: 2 }));
    let budget = 600;
    while (game.getPhase() !== "finished" && budget > 0) {
      const state = stateOf(game);
      if (state.phase === "waiting") {
        // Tap at every serve-zone midpoint of every target plate.
        // advanceTimersByTime is incremental, so advance by the delta.
        let t = 0;
        for (const plate of state.plates) {
          if (!plate.isTarget) continue;
          const tMid =
            plate.id * state.spawnIntervalMs +
            ((SERVE_ZONE_LEFT + SERVE_ZONE_RIGHT) / 2) * state.beltMs;
          vi.advanceTimersByTime(Math.max(0, tMid - t));
          t = tMid;
          tap(game);
        }
      }
      vi.advanceTimersByTime(600);
      budget--;
    }
    vi.useRealTimers();
    expect(game.getPhase()).toBe("finished");
    const summary = game.finish();
    expect(summary.totalTrials).toBeGreaterThanOrEqual(2);
  });
});

describe("SushiExpressGame pause/resume", () => {
  it("can pause and resume", () => {
    const game = new SushiExpressGame();
    game.start(makeContext({ practiceTrials: 1 }));
    game.pause();
    expect(game.getPhase()).toBe("paused");
    game.resume();
    expect(game.getPhase()).not.toBe("paused");
  });

  it("cannot pause when idle", () => {
    const game = new SushiExpressGame();
    game.pause();
    expect(game.getPhase()).toBe("idle");
  });
});