import { describe, it, expect, vi } from "vitest";
import { RuleSwitchGame, GAME_KEY, GAME_VERSION } from "./game.js";
import type { GameContext } from "@cog/game-core";

function makeContext(overrides: Partial<GameContext> = {}): GameContext {
  return {
    sessionId: "test-session",
    gameRunId: "test-run",
    gameKey: "rule_switch",
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
      language: "en",
      timezone: "UTC",
    },
    extra: {},
    startedAt: 0,
    sendTelemetry: { send: vi.fn().mockResolvedValue({ accepted: 0, rejected: 0 }) },
    ...overrides,
  };
}

describe("RuleSwitchGame", () => {
  it("has correct key and version", () => {
    const game = new RuleSwitchGame();
    expect(game.key).toBe(GAME_KEY);
    expect(game.version).toBe(GAME_VERSION);
  });

  it("starts in practice phase when practiceTrials > 0", () => {
    const game = new RuleSwitchGame();
    game.start(makeContext({ practiceTrials: 3 }));
    expect(game.getPhase()).toBe("practice");
  });

  it("starts in countdown when practiceTrials = 0", () => {
    const game = new RuleSwitchGame();
    game.start(makeContext({ practiceTrials: 0 }));
    expect(game.getPhase()).toBe("countdown");
  });

  it("returns valid render state", () => {
    const game = new RuleSwitchGame();
    game.start(makeContext());
    const state = game.getRenderState();
    expect(state).toHaveProperty("phase");
    expect(state).toHaveProperty("currentRule");
    expect(state).toHaveProperty("targetStimulus");
    expect(state).toHaveProperty("options");
    expect(state).toHaveProperty("matchIndex");
    expect(state).toHaveProperty("isSwitchTrial");
    expect(state).toHaveProperty("isPractice");
    expect(state).toHaveProperty("score");
    expect(state).toHaveProperty("switchTrials");
    expect(state).toHaveProperty("stayTrials");
    expect(state).toHaveProperty("perseverativeErrors");
  });

  it("provides valid config for all difficulty levels", () => {
    const game = new RuleSwitchGame();
    for (let d = 1; d <= 10; d++) {
      const config = game.getConfig(d);
      expect(config).toHaveProperty("rules");
      expect(config).toHaveProperty("switchProbability");
      expect(config).toHaveProperty("stimuliCount");
      expect(config).toHaveProperty("responseDeadlineMs");
    }
  });

  it("does not accept input when not in waiting phase", () => {
    const game = new RuleSwitchGame();
    game.start(makeContext({ practiceTrials: 0 }));
    game.handleInput({ type: "pointer_down", x: 100, y: 100, tClient: 0 });
    // Should not throw
  });

  it("drains events", () => {
    const game = new RuleSwitchGame();
    game.start(makeContext({ practiceTrials: 0 }));
    const events = game.drainEvents();
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].eventType).toBe("trial_started");
  });

  it("getConfig returns correct parameters for D1", () => {
    const game = new RuleSwitchGame();
    const config = game.getConfig(1) as { rules: unknown[]; switchProbability: number };
    expect(config.rules).toHaveLength(2);
    expect(config.switchProbability).toBe(0.15);
  });

  it("finish returns valid summary", () => {
    const game = new RuleSwitchGame();
    game.start(makeContext({ practiceTrials: 0 }));
    const summary = game.finish();
    expect(summary.gameKey).toBe("rule_switch");
    expect(summary.gameVersion).toBe(GAME_VERSION);
    expect(summary.totalTrials).toBeGreaterThanOrEqual(0);
    expect(summary.omissionErrors).toBeGreaterThanOrEqual(0);
    expect(summary.commissionErrors).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(summary.qualityFlags)).toBe(true);
  });
});

describe("RuleSwitchGame pause/resume", () => {
  it("can pause and resume during practice", () => {
    const game = new RuleSwitchGame();
    game.start(makeContext({ practiceTrials: 3 }));
    game.pause();
    expect(game.getPhase()).toBe("paused");
    game.resume();
    expect(game.getPhase()).not.toBe("paused");
  });

  it("cannot pause when idle", () => {
    const game = new RuleSwitchGame();
    game.pause();
    expect(game.getPhase()).toBe("idle");
  });

  it("cannot resume when not paused", () => {
    const game = new RuleSwitchGame();
    game.start(makeContext({ practiceTrials: 0 }));
    game.resume();
    expect(game.getPhase()).not.toBe("paused");
  });
});

describe("RuleSwitchGame scoring", () => {
  it("records correct selection", () => {
    const game = new RuleSwitchGame();
    game.start(makeContext({ difficulty: 1, practiceTrials: 0, maxTrials: 1 }));

    vi.useFakeTimers();
    vi.advanceTimersByTime(900); // Past rule display

    const state = game.getRenderState() as { matchIndex: number };
    game.handleInput({ type: "pointer_down", x: 0, y: 0, tClient: Date.now(), optionIndex: state.matchIndex } as never);

    vi.useRealTimers();
  });

  it("records incorrect selection", () => {
    const game = new RuleSwitchGame();
    game.start(makeContext({ difficulty: 1, practiceTrials: 0, maxTrials: 1 }));

    vi.useFakeTimers();
    vi.advanceTimersByTime(900);

    const state = game.getRenderState() as { matchIndex: number; options: unknown[] };
    const wrongIndex = state.matchIndex === 0 ? 1 : 0;
    if (wrongIndex < state.options.length) {
      game.handleInput({ type: "pointer_down", x: 0, y: 0, tClient: Date.now(), optionIndex: wrongIndex } as never);
    }

    vi.useRealTimers();
  });

  it("handles timeout", () => {
    const game = new RuleSwitchGame();
    game.start(makeContext({ difficulty: 1, practiceTrials: 0, maxTrials: 1 }));

    vi.useFakeTimers();
    vi.advanceTimersByTime(900); // Past rule display
    vi.advanceTimersByTime(5500); // Past deadline

    vi.useRealTimers();
  });

  it("handles multiple trials", () => {
    const game = new RuleSwitchGame();
    game.start(makeContext({ difficulty: 1, practiceTrials: 0, maxTrials: 3 }));

    vi.useFakeTimers();
    for (let i = 0; i < 30; i++) {
      vi.advanceTimersByTime(500);
    }
    vi.useRealTimers();
  });

  it("completes the round after a pause mid-trial", () => {
    const game = new RuleSwitchGame();
    game.start(makeContext({ practiceTrials: 0, maxTrials: 3, difficulty: 1 }));

    vi.useFakeTimers();
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
