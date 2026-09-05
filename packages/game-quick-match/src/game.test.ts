import { describe, it, expect, vi } from "vitest";
import { QuickMatchGame, GAME_KEY, GAME_VERSION } from "./game.js";
import type { GameContext } from "@cog/game-core";

function makeContext(overrides: Partial<GameContext> = {}): GameContext {
  return {
    sessionId: "test-session",
    gameRunId: "test-run",
    gameKey: "quick_match",
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

describe("QuickMatchGame", () => {
  it("has correct key and version", () => {
    const game = new QuickMatchGame();
    expect(game.key).toBe(GAME_KEY);
    expect(game.version).toBe(GAME_VERSION);
  });

  it("starts in practice phase when practiceTrials > 0", () => {
    const game = new QuickMatchGame();
    game.start(makeContext({ practiceTrials: 3 }));
    expect(game.getPhase()).toBe("practice");
  });

  it("starts in countdown when practiceTrials = 0", () => {
    const game = new QuickMatchGame();
    game.start(makeContext({ practiceTrials: 0 }));
    expect(game.getPhase()).toBe("countdown");
  });

  it("returns valid render state", () => {
    const game = new QuickMatchGame();
    game.start(makeContext());
    const state = game.getRenderState();
    expect(state).toHaveProperty("phase");
    expect(state).toHaveProperty("targetStimulus");
    expect(state).toHaveProperty("options");
    expect(state).toHaveProperty("targetIndex");
    expect(state).toHaveProperty("selectedIndex");
    expect(state).toHaveProperty("isPractice");
    expect(state).toHaveProperty("score");
    expect(state).toHaveProperty("correctCount");
    expect(state).toHaveProperty("incorrectCount");
    expect(state).toHaveProperty("timeoutCount");
  });

  it("provides valid config for all difficulty levels", () => {
    const game = new QuickMatchGame();
    for (let d = 1; d <= 10; d++) {
      const config = game.getConfig(d);
      expect(config).toHaveProperty("optionsCount");
      expect(config).toHaveProperty("presentationTimeMs");
      expect(config).toHaveProperty("distractorCount");
      expect(config).toHaveProperty("responseDeadlineMs");
    }
  });

  it("does not accept input when not in matching phase", () => {
    const game = new QuickMatchGame();
    game.start(makeContext({ practiceTrials: 0 }));
    game.handleInput({ type: "pointer_down", x: 100, y: 100, tClient: 0 });
    // Should not throw
  });

  it("drains events", () => {
    const game = new QuickMatchGame();
    game.start(makeContext({ practiceTrials: 0 }));
    const events = game.drainEvents();
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].eventType).toBe("trial_started");
  });

  it("getConfig returns correct parameters for D1", () => {
    const game = new QuickMatchGame();
    const config = game.getConfig(1) as { optionsCount: number; presentationTimeMs: number };
    expect(config.optionsCount).toBe(2);
    expect(config.presentationTimeMs).toBe(3000);
  });

  it("finish returns valid summary", () => {
    const game = new QuickMatchGame();
    game.start(makeContext({ practiceTrials: 0 }));
    const summary = game.finish();
    expect(summary.gameKey).toBe("quick_match");
    expect(summary.gameVersion).toBe(GAME_VERSION);
    expect(summary.totalTrials).toBeGreaterThanOrEqual(0);
    expect(summary.omissionErrors).toBeGreaterThanOrEqual(0);
    expect(summary.commissionErrors).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(summary.qualityFlags)).toBe(true);
  });
});

describe("QuickMatchGame pause/resume", () => {
  it("can pause and resume during practice", () => {
    const game = new QuickMatchGame();
    game.start(makeContext({ practiceTrials: 3 }));
    game.pause();
    expect(game.getPhase()).toBe("paused");
    game.resume();
    expect(game.getPhase()).not.toBe("paused");
  });

  it("cannot pause when idle", () => {
    const game = new QuickMatchGame();
    game.pause();
    expect(game.getPhase()).toBe("idle");
  });

  it("cannot resume when not paused", () => {
    const game = new QuickMatchGame();
    game.start(makeContext({ practiceTrials: 0 }));
    game.resume();
    expect(game.getPhase()).not.toBe("paused");
  });

  // Regression: thawPausableTimers used to leave the pausableTimers map empty,
  // so a second pause had nothing to freeze and trial timers kept firing while
  // the kid was looking at the pause overlay — the round played itself to the
  // result screen behind the modal.
  it("keeps timers frozen across a pause → resume → pause cycle", () => {
    const game = new QuickMatchGame();
    game.start(makeContext({ practiceTrials: 0, maxTrials: 5, difficulty: 1 }));
    vi.useFakeTimers();

    vi.advanceTimersByTime(500); // mid preview
    game.pause(); // first pause freezes the preview timer
    vi.advanceTimersByTime(5000); // paused — nothing may advance
    expect(game.getRenderState().phase).toBe("paused");

    game.resume(); // preview re-armed with its remaining time
    vi.advanceTimersByTime(100); // still mid preview, no input yet
    game.pause(); // second pause must freeze the preview timer again
    vi.advanceTimersByTime(60_000); // a full minute passes while paused

    expect(game.getRenderState().phase).toBe("paused");
    expect(game.getPhase()).not.toBe("finished");
    vi.useRealTimers();
  });

  it("finishes the round normally after a pause mid-trial", () => {
    const game = new QuickMatchGame();
    game.start(makeContext({ practiceTrials: 0, maxTrials: 3, difficulty: 1 }));
    vi.useFakeTimers();
    vi.advanceTimersByTime(700); // mid preview
    game.pause();
    vi.advanceTimersByTime(5000); // time passes while paused
    game.resume();
    vi.advanceTimersByTime(5000); // preview + deadline elapse after resume
    expect(game.getRenderState().phase).not.toBe("paused");
    vi.useRealTimers();
  });

  it("exposes the response window as a trial clock for the time bar", () => {
    const game = new QuickMatchGame();
    const deadlineMs = (game.getConfig(1) as { responseDeadlineMs: number }).responseDeadlineMs;
    vi.useFakeTimers();
    game.start(makeContext({ practiceTrials: 0, maxTrials: 1, difficulty: 1 }));

    // Preview: nothing to answer yet
    expect(game.getTrialClock()).toBeNull();

    vi.advanceTimersByTime(3500); // preview (3s at D1) elapsed → matching, deadline armed
    const clock = game.getTrialClock();
    expect(clock).not.toBeNull();
    expect(clock!.totalMs).toBe(deadlineMs);
    expect(clock!.remainingMs).toBeLessThanOrEqual(deadlineMs);

    vi.advanceTimersByTime(1000);
    expect(game.getTrialClock()!.remainingMs).toBeLessThan(clock!.remainingMs);

    // Freeze/thaw must keep the original window length for the bar scale
    game.pause();
    game.resume();
    expect(game.getTrialClock()!.totalMs).toBe(deadlineMs);

    vi.advanceTimersByTime(10_000); // deadline + feedback elapse → round finished, no window
    expect(game.getTrialClock()).toBeNull();
    vi.useRealTimers();
  });
});

describe("QuickMatchGame scoring", () => {
  it("records correct selection", () => {
    const game = new QuickMatchGame();
    game.start(makeContext({ difficulty: 1, practiceTrials: 0, maxTrials: 1 }));

    vi.useFakeTimers();
    vi.advanceTimersByTime(3100); // Past preview phase

    // Get render state to find target index
    const state = game.getRenderState() as { targetIndex: number };
    // Simulate tap on correct option
    game.handleInput({ type: "pointer_down", x: 0, y: 0, tClient: Date.now(), optionIndex: state.targetIndex } as never);

    vi.useRealTimers();
  });

  it("records incorrect selection", () => {
    const game = new QuickMatchGame();
    game.start(makeContext({ difficulty: 1, practiceTrials: 0, maxTrials: 1 }));

    vi.useFakeTimers();
    vi.advanceTimersByTime(3100);

    const state = game.getRenderState() as { targetIndex: number; options: string[] };
    // Select wrong option
    const wrongIndex = state.targetIndex === 0 ? 1 : 0;
    if (wrongIndex < state.options.length) {
      game.handleInput({ type: "pointer_down", x: 0, y: 0, tClient: Date.now(), optionIndex: wrongIndex } as never);
    }

    vi.useRealTimers();
  });

  it("handles timeout", () => {
    const game = new QuickMatchGame();
    game.start(makeContext({ difficulty: 1, practiceTrials: 0, maxTrials: 1 }));

    vi.useFakeTimers();
    vi.advanceTimersByTime(3100); // Past preview
    vi.advanceTimersByTime(5500); // Past deadline

    vi.useRealTimers();
  });

  it("handles multiple trials", () => {
    const game = new QuickMatchGame();
    game.start(makeContext({ difficulty: 1, practiceTrials: 0, maxTrials: 3 }));

    vi.useFakeTimers();
    for (let i = 0; i < 30; i++) {
      vi.advanceTimersByTime(500);
    }
    vi.useRealTimers();
  });

  it("completes the round after a pause mid-trial", () => {
    const game = new QuickMatchGame();
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
