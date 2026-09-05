import { describe, it, expect, vi } from "vitest";
import { CourierMapGame, GAME_KEY, GAME_VERSION } from "./game.js";
import type { GameContext } from "@cog/game-core";
import type { CMRenderState } from "./game.js";

function makeContext(overrides: Partial<GameContext> = {}): GameContext {
  return {
    sessionId: "test-session",
    gameRunId: "test-run",
    gameKey: "courier_map",
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

function tap(game: CourierMapGame, cellIndex: number) {
  game.handleInput({ type: "pointer_down", x: 0, y: 0, tClient: 0, cellIndex } as never);
}

function stateOf(game: CourierMapGame): CMRenderState {
  return game.getRenderState() as unknown as CMRenderState;
}

/** Walk the courier along a specific path of node ids (adjacency assumed). */
function walk(game: CourierMapGame, nodes: number[]) {
  for (const n of nodes) tap(game, n);
}

describe("CourierMapGame", () => {
  it("has correct key and version", () => {
    const game = new CourierMapGame();
    expect(game.key).toBe(GAME_KEY);
    expect(game.key).toBe("courier_map");
    expect(game.version).toBe(GAME_VERSION);
    expect(game.version).toBe("0.1.0");
  });

  it("starts in practice phase when practiceTrials > 0", () => {
    const game = new CourierMapGame();
    game.start(makeContext({ practiceTrials: 3 }));
    expect(game.getPhase()).toBe("practice");
  });

  it("returns a valid connected render state", () => {
    const game = new CourierMapGame();
    game.start(makeContext({ practiceTrials: 0 }));
    const state = stateOf(game);
    expect(state.layout).toBeDefined();
    expect(state.layout!.nodes.length).toBeGreaterThanOrEqual(6);
    expect(state.path[0]).toBe(state.layout!.startNode);
    expect(state.activeRules.length).toBeGreaterThanOrEqual(1);
  });

  it("provides valid config for all difficulty levels", () => {
    const game = new CourierMapGame();
    for (let d = 1; d <= 10; d++) {
      const config = game.getConfig(d) as { mapNodes: number; rules: string[]; deadlineMs: number };
      expect(config.mapNodes).toBeGreaterThanOrEqual(6);
      expect(config.rules.length).toBeGreaterThanOrEqual(1);
      expect(config.deadlineMs).toBeGreaterThanOrEqual(8000);
    }
  });

  it("drains events with trial_started first", () => {
    const game = new CourierMapGame();
    game.start(makeContext({ practiceTrials: 0 }));
    const events = game.drainEvents();
    expect(events[0].eventType).toBe("trial_started");
  });

  it("delivers when following the reference path", () => {
    const game = new CourierMapGame();
    vi.useFakeTimers();
    game.start(makeContext({ difficulty: 1, practiceTrials: 0, maxTrials: 1 }));
    vi.advanceTimersByTime(50);

    const state = stateOf(game);
    walk(game, state.layout!.referencePath.slice(1));
    expect(stateOf(game).feedbackKind).toBe("delivered");
    vi.advanceTimersByTime(900);

    const events = game.drainEvents();
    const response = events.find((e) => e.eventType === "response");
    expect(response).toBeDefined();
    expect((response!.payload as { correct: boolean }).correct).toBe(true);
    vi.useRealTimers();
  });

  it("ends as a commission when stepping onto a rule-forbidden node", () => {
    const game = new CourierMapGame();
    vi.useFakeTimers();
    // D3 activates avoid_water. Seed 2 is verified to place a water node
    // adjacent to the start (generator is seeded → stable across runs).
    game.start(makeContext({ difficulty: 3, seed: 2, practiceTrials: 0, maxTrials: 1 }));
    vi.advanceTimersByTime(50);

    const layout = stateOf(game).layout!;
    const waterNode = layout.nodes.find(
      (n) => n.water && isAdjacent(layout.edges, layout.startNode, n.id),
    );
    expect(waterNode).toBeDefined();

    walk(game, [waterNode!.id]);
    vi.advanceTimersByTime(1500);

    const events = game.drainEvents();
    const response = events.find((e) => e.eventType === "response");
    expect(response).toBeDefined();
    expect((response!.payload as { correct: boolean }).correct).toBe(false);
    const summary = game.finish();
    expect(summary.commissionErrors).toBeGreaterThanOrEqual(1);
    vi.useRealTimers();
  });

  it("records a timeout as omission", () => {
    const game = new CourierMapGame();
    vi.useFakeTimers();
    game.start(makeContext({ difficulty: 1, practiceTrials: 0, maxTrials: 1 }));
    vi.advanceTimersByTime(21000); // past D1 deadline (20000ms)
    vi.advanceTimersByTime(900);

    const events = game.drainEvents();
    expect(events.some((e) => e.eventType === "timeout")).toBe(true);
    const summary = game.finish();
    expect(summary.omissionErrors).toBeGreaterThanOrEqual(1);
    vi.useRealTimers();
  });

  it("completes all trials and finishes", () => {
    const game = new CourierMapGame();
    vi.useFakeTimers();
    game.start(makeContext({ difficulty: 1, practiceTrials: 0, maxTrials: 2 }));
    let budget = 400;
    while (game.getPhase() !== "finished" && budget > 0) {
      const state = stateOf(game);
      if (state.phase === "waiting" && state.layout) {
        walk(game, state.layout.referencePath.slice(1));
      }
      vi.advanceTimersByTime(500);
      budget--;
    }
    vi.useRealTimers();
    expect(game.getPhase()).toBe("finished");
    const summary = game.finish();
    expect(summary.totalTrials).toBeGreaterThanOrEqual(2);
  });
});

describe("CourierMapGame pause/resume", () => {
  it("can pause and resume", () => {
    const game = new CourierMapGame();
    game.start(makeContext({ practiceTrials: 1 }));
    game.pause();
    expect(game.getPhase()).toBe("paused");
    game.resume();
    expect(game.getPhase()).not.toBe("paused");
  });

  it("cannot pause when idle", () => {
    const game = new CourierMapGame();
    game.pause();
    expect(game.getPhase()).toBe("idle");
  });
});

function isAdjacent(
  edges: { a: number; b: number; blocked: boolean }[],
  a: number,
  b: number,
): boolean {
  return edges.some((e) => !e.blocked && ((e.a === a && e.b === b) || (e.a === b && e.b === a)));
}