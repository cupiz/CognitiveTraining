import { describe, it, expect } from "vitest";
import { processGameRun, getInitialState, previewPerformance } from "./engine.js";
import type { PerformanceInput, GameKey } from "./types.js";

describe("processGameRun", () => {
  function makeMetrics(overrides: Partial<PerformanceInput> = {}): PerformanceInput {
    return {
      accuracy: 0.8,
      medianRtMs: 1000,
      meanRtMs: 1100,
      rtVariability: 200,
      omissionErrors: 2,
      commissionErrors: 1,
      validTrialCount: 20,
      qualityFlags: [],
      ...overrides,
    };
  }

  const gameKey: GameKey = "memory_matrix";

  it("creates new state if null", () => {
    const result = processGameRun(null, makeMetrics(), gameKey);
    expect(result.state.attempts).toBe(1);
    expect(result.state.ability).not.toBe(0);
    expect(result.performance.usable).toBe(true);
  });

  it("updates existing state", () => {
    const initial = getInitialState("child-1", gameKey);
    const result = processGameRun(initial, makeMetrics({ accuracy: 0.9 }), gameKey);
    expect(result.state.attempts).toBe(1);
    expect(result.recommendation).toBeDefined();
  });

  it("returns performance score", () => {
    const result = processGameRun(null, makeMetrics(), gameKey);
    expect(result.performance.score).toBeGreaterThan(0);
    expect(result.performance.usable).toBe(true);
  });

  it("handles high performance", () => {
    const initial = getInitialState("child-1", gameKey);
    const result = processGameRun(initial, makeMetrics({ accuracy: 0.95, medianRtMs: 500 }), gameKey);
    expect(result.recommendation.changed).toBe(true);
    expect(result.recommendation.difficulty).toBeGreaterThan(5.0);
  });

  it("handles low performance", () => {
    const initial = getInitialState("child-1", gameKey);
    const result = processGameRun(initial, makeMetrics({ accuracy: 0.3, medianRtMs: 3000 }), gameKey);
    expect(result.recommendation.changed).toBe(true);
    expect(result.recommendation.difficulty).toBeLessThan(5.0);
  });

  it("handles unusable metrics", () => {
    const initial = getInitialState("child-1", gameKey);
    const result = processGameRun(initial, makeMetrics({ validTrialCount: 1 }), gameKey);
    expect(result.performance.usable).toBe(false);
    expect(result.recommendation.changed).toBe(false);
  });

  it("works for all game keys", () => {
    const games: GameKey[] = ["memory_matrix", "target_watch", "quick_match", "stop_signal", "rule_switch", "spice_stall", "red_light", "courier_map", "lighthouse_keeper", "sushi_express", "crystal_palace"];
    const metrics = makeMetrics();
    
    for (const game of games) {
      const result = processGameRun(null, metrics, game);
      expect(result.state).toBeDefined();
      expect(result.recommendation).toBeDefined();
    }
  });

  it("multiple runs accumulate", () => {
    let state = getInitialState("child-1", gameKey);
    
    // Run 1: good performance
    const result1 = processGameRun(state, makeMetrics({ accuracy: 0.9 }), gameKey);
    state = result1.state;
    
    // Run 2: good performance again
    const result2 = processGameRun(state, makeMetrics({ accuracy: 0.9 }), gameKey);
    state = result2.state;
    
    expect(state.attempts).toBe(2);
    expect(state.uncertainty).toBeLessThan(4.0); // Should decrease
  });
});

describe("getInitialState", () => {
  it("creates initial state with defaults", () => {
    const state = getInitialState("child-1", "memory_matrix");
    expect(state.ability).toBe(5.0);
    expect(state.uncertainty).toBe(4.0);
    expect(state.difficulty).toBe(5.0);
    expect(state.attempts).toBe(0);
  });
});

describe("previewPerformance", () => {
  it("computes performance without updating state", () => {
    const metrics: PerformanceInput = {
      accuracy: 0.8,
      medianRtMs: 1000,
      meanRtMs: 1100,
      rtVariability: 200,
      omissionErrors: 2,
      commissionErrors: 1,
      validTrialCount: 20,
      qualityFlags: [],
    };
    
    const result = previewPerformance(metrics);
    expect(result.usable).toBe(true);
    expect(result.score).toBeGreaterThan(0);
  });
});
