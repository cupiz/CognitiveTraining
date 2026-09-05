import { describe, it, expect, vi } from "vitest";
import { RedLightGame, GAME_KEY, GAME_VERSION } from "./game.js";
import type { RLRenderState } from "./game.js";
import type { GameContext } from "@cog/game-core";

function makeContext(overrides: Partial<GameContext> = {}): GameContext {
  return {
    sessionId: "test-session",
    gameRunId: "test-run",
    gameKey: "red_light",
    gameVersion: GAME_VERSION,
    difficulty: 3,
    seed: 42,
    isPractice: false,
    maxTrials: 5,
    practiceTrials: 2,
    deviceContext: {
      userAgent: "test",
      screenWidth: 1920,
      screenHeight: 1080,
      pixelRatio: 1,
      touchSupport: false,
      refreshRate: 60,
      platform: "test",
      language: "id",
      timezone: "Asia/Jakarta",
    },
    extra: {},
    startedAt: 0,
    sendTelemetry: { send: vi.fn().mockResolvedValue({ accepted: 0, rejected: 0 }) },
    ...overrides,
  };
}

/**
 * Hunt a deterministic seed whose first scored trial is a go (or stop) trial.
 * At t=2000ms the go cue has certainly fired (ready ≤ 1200ms): a go trial is
 * still in "go" (deadline 3000ms at D1), a stop trial has certainly shown red
 * (ready + SSD 550 ≤ 1750ms) and is in "stop" (window 1000ms → ends ≤ 2750ms).
 */
function findTrialKind(kind: "go" | "stop"): number {
  for (let seed = 0; seed < 1000; seed++) {
    vi.useFakeTimers();
    const game = new RedLightGame();
    game.start(makeContext({ seed, practiceTrials: 0, maxTrials: 2, difficulty: 1 }));
    vi.advanceTimersByTime(2000);
    const phase = (game.getRenderState() as unknown as RLRenderState).phase;
    vi.useRealTimers();
    game.finish();
    if (kind === "stop" && phase === "stop") return seed;
    if (kind === "go" && phase === "go") return seed;
  }
  throw new Error(`no ${kind} seed found`);
}

describe("RedLightGame", () => {
  it("has correct key and version", () => {
    const game = new RedLightGame();
    expect(game.key).toBe(GAME_KEY);
    expect(game.version).toBe(GAME_VERSION);
  });

  it("starts in practice phase when practiceTrials > 0", () => {
    const game = new RedLightGame();
    game.start(makeContext({ practiceTrials: 3 }));
    expect(game.getPhase()).toBe("practice");
  });

  it("starts in countdown when practiceTrials = 0", () => {
    const game = new RedLightGame();
    game.start(makeContext({ practiceTrials: 0 }));
    expect(game.getPhase()).toBe("countdown");
  });

  it("returns valid render state", () => {
    const game = new RedLightGame();
    game.start(makeContext());
    const state = game.getRenderState();
    expect(state).toHaveProperty("phase");
    expect(state).toHaveProperty("isStopTrial");
    expect(state).toHaveProperty("showStopSignal");
    expect(state).toHaveProperty("isPractice");
    expect(state).toHaveProperty("score");
    expect(state).toHaveProperty("goTrials");
    expect(state).toHaveProperty("stopTrials");
    expect(state).toHaveProperty("correctGos");
    expect(state).toHaveProperty("failedStops");
    expect(state).toHaveProperty("successfulStops");
    expect(state).toHaveProperty("currentSsdMs");
    expect(state).toHaveProperty("goDeadlineMs");
    expect(state).toHaveProperty("stopWindowMs");
  });

  it("provides valid config for all difficulty levels", () => {
    const game = new RedLightGame();
    for (let d = 1; d <= 10; d++) {
      const config = game.getConfig(d);
      expect(config).toHaveProperty("stopTrialProportion");
      expect(config).toHaveProperty("initialStopSignalDelayMs");
      expect(config).toHaveProperty("goStimulusDurationMs");
    }
  });

  it("getConfig returns correct parameters for D1", () => {
    const game = new RedLightGame();
    const config = game.getConfig(1) as { stopTrialProportion: number; initialStopSignalDelayMs: number };
    expect(config.stopTrialProportion).toBe(0.2);
    expect(config.initialStopSignalDelayMs).toBe(550);
  });

  it("drains trial_started after the ready countdown", () => {
    vi.useFakeTimers();
    const game = new RedLightGame();
    game.start(makeContext({ practiceTrials: 0, seed: 42 }));
    vi.advanceTimersByTime(1500);
    vi.useRealTimers();
    const events = game.drainEvents();
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].eventType).toBe("trial_started");
  });

  it("finish returns valid summary", () => {
    const game = new RedLightGame();
    game.start(makeContext({ practiceTrials: 0 }));
    const summary = game.finish();
    expect(summary.gameKey).toBe("red_light");
    expect(summary.gameVersion).toBe(GAME_VERSION);
    expect(summary.totalTrials).toBeGreaterThanOrEqual(0);
    expect(summary.omissionErrors).toBeGreaterThanOrEqual(0);
    expect(summary.commissionErrors).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(summary.qualityFlags)).toBe(true);
  });

  it("does not throw on input outside go/stop", () => {
    const game = new RedLightGame();
    game.start(makeContext({ practiceTrials: 0 }));
    game.handleInput({ type: "pointer_down", x: 100, y: 100, tClient: 0 });
    // Should not throw (early tap path is kind, not fatal)
  });
});

describe("RedLightGame pause/resume", () => {
  it("can pause and resume during practice", () => {
    const game = new RedLightGame();
    game.start(makeContext({ practiceTrials: 3 }));
    game.pause();
    expect(game.getPhase()).toBe("paused");
    game.resume();
    expect(game.getPhase()).not.toBe("paused");
  });

  it("cannot pause when idle", () => {
    const game = new RedLightGame();
    game.pause();
    expect(game.getPhase()).toBe("idle");
  });

  it("cannot resume when not paused", () => {
    const game = new RedLightGame();
    game.start(makeContext({ practiceTrials: 0 }));
    game.resume();
    expect(game.getPhase()).not.toBe("paused");
  });
});

describe("RedLightGame trials", () => {
  it("go trial: tap after the green cue is correct", () => {
    const seed = findTrialKind("go");
    vi.useFakeTimers();
    const game = new RedLightGame();
    game.start(makeContext({ seed, practiceTrials: 0, maxTrials: 1, difficulty: 1 }));

    vi.advanceTimersByTime(2000); // go cue fired, still in go
    game.handleInput({ type: "pointer_down", x: 100, y: 100, tClient: 0 });
    vi.advanceTimersByTime(900); // feedback window

    const state = game.getRenderState() as unknown as RLRenderState;
    expect(state.responseCorrect).toBe(true);
    expect(state.score).toBe(1);
    expect(state.correctGos).toBe(1);

    // Round completes after the feedback.
    vi.advanceTimersByTime(2000);
    vi.useRealTimers();
    expect(game.getPhase()).toBe("finished");
  });

  it("go trial: no tap before the deadline is an omission", () => {
    const seed = findTrialKind("go");
    vi.useFakeTimers();
    const game = new RedLightGame();
    game.start(makeContext({ seed, practiceTrials: 0, maxTrials: 1, difficulty: 1 }));

    vi.advanceTimersByTime(2000); // in go
    // deadline fires at ready(≤1200) + 3000 = ≤4200; feedback starts at +800
    vi.advanceTimersByTime(2300); // past the latest deadline, before feedback ends

    const state = game.getRenderState() as unknown as RLRenderState;
    expect(state.responseCorrect).toBe(false);
    expect(state.goTrials).toBe(1);
    vi.useRealTimers();
    const events = game.drainEvents();
    expect(events.some((e) => e.eventType === "timeout")).toBe(true);
  });

  it("stop trial: holding through the red window is correct", () => {
    const seed = findTrialKind("stop");
    vi.useFakeTimers();
    const game = new RedLightGame();
    game.start(makeContext({ seed, practiceTrials: 0, maxTrials: 1, difficulty: 1 }));

    vi.advanceTimersByTime(2000); // red lamp showing, in stop phase
    vi.advanceTimersByTime(1100); // stop window (1000ms) elapses

    const state = game.getRenderState() as unknown as RLRenderState;
    expect(state.responseCorrect).toBe(true);
    expect(state.successfulStops).toBe(1);
    expect(state.score).toBe(1);
    vi.useRealTimers();
  });

  it("stop trial: tapping during the red window is a commission", () => {
    const seed = findTrialKind("stop");
    vi.useFakeTimers();
    const game = new RedLightGame();
    game.start(makeContext({ seed, practiceTrials: 0, maxTrials: 1, difficulty: 1 }));

    vi.advanceTimersByTime(2000); // red lamp showing
    game.handleInput({ type: "pointer_down", x: 100, y: 100, tClient: 0 });
    vi.advanceTimersByTime(900);

    const state = game.getRenderState() as unknown as RLRenderState;
    expect(state.responseCorrect).toBe(false);
    expect(state.failedStops).toBe(1);
    // Failed stop makes the next SSD longer (easier).
    expect(state.currentSsdMs).toBeGreaterThan(550);
    vi.useRealTimers();
  });

  it("early tap during the Siap countdown is excluded with a quality flag", () => {
    const game = new RedLightGame();
    game.start(makeContext({ seed: 7, practiceTrials: 0, maxTrials: 2, difficulty: 1 }));

    vi.useFakeTimers();
    vi.advanceTimersByTime(300); // still in "ready"
    game.handleInput({ type: "pointer_down", x: 100, y: 100, tClient: 0 });

    const flags = game.drainEvents().filter((e) => e.eventType === "quality_flag");
    expect(flags.length).toBe(1);
    expect(flags[0].payload.code).toBe("TOO_FAST_RESPONSE");

    // No trial was created for the false start — a fresh one begins after the warning.
    vi.advanceTimersByTime(1100); // warning feedback (900ms) → beginTrial
    expect((game.getRenderState() as unknown as RLRenderState).phase).toBe("ready");
    vi.useRealTimers();
    expect(game.finish().totalTrials).toBe(0);
  });

  it("completes the round after a pause mid-trial", () => {
    vi.useFakeTimers();
    const game = new RedLightGame();
    game.start(makeContext({ practiceTrials: 0, maxTrials: 3, difficulty: 1 }));

    vi.advanceTimersByTime(700); // mid an early trial
    game.pause();
    vi.advanceTimersByTime(5000); // time passes while paused
    game.resume();

    let budget = 2000;
    while (game.getPhase() !== "finished" && budget > 0) {
      vi.advanceTimersByTime(500);
      budget--;
    }
    vi.useRealTimers();

    expect(game.getPhase()).toBe("finished");
  });
});