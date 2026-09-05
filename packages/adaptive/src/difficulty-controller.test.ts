import { describe, it, expect } from "vitest";
import { recommendDifficulty, getGameBounds, clampDifficulty, getDifficultyLevel } from "./difficulty-controller.js";
import type { AbilityState, PerformanceScore, GameKey } from "./types.js";

describe("recommendDifficulty", () => {
  function makeState(overrides: Partial<AbilityState> = {}): AbilityState {
    return {
      ability: 5.0,
      uncertainty: 2.0,
      difficulty: 5.0,
      attempts: 10,
      lastUpdatedAt: new Date().toISOString(),
      algorithmVersion: "test",
      ...overrides,
    };
  }

  function makePerformance(overrides: Partial<PerformanceScore> = {}): PerformanceScore {
    return {
      score: 0.7,
      accuracyComponent: 0.8,
      speedComponent: 0.6,
      consistencyComponent: 0.5,
      usable: true,
      ...overrides,
    };
  }

  const gameKey: GameKey = "memory_matrix";

  it("increases difficulty for high performance", () => {
    const state = makeState({ difficulty: 5.0 });
    const perf = makePerformance({ score: 0.9 });
    const result = recommendDifficulty(state, perf, gameKey);
    expect(result.difficulty).toBeGreaterThan(5.0);
    expect(result.changed).toBe(true);
    expect(result.rationale).toContain("high_performance");
  });

  it("decreases difficulty for low performance", () => {
    const state = makeState({ difficulty: 5.0 });
    const perf = makePerformance({ score: 0.3 });
    const result = recommendDifficulty(state, perf, gameKey);
    expect(result.difficulty).toBeLessThan(5.0);
    expect(result.changed).toBe(true);
    expect(result.rationale).toContain("low_performance");
  });

  it("keeps difficulty for mid-range performance", () => {
    const state = makeState({ difficulty: 5.0 });
    const perf = makePerformance({ score: 0.7 });
    const result = recommendDifficulty(state, perf, gameKey);
    expect(result.difficulty).toBe(5.0);
    expect(result.changed).toBe(false);
    expect(result.rationale).toContain("accuracy_in_target_zone");
  });

  it("no change for unusable data", () => {
    const state = makeState({ difficulty: 5.0 });
    const perf = makePerformance({ usable: false });
    const result = recommendDifficulty(state, perf, gameKey);
    expect(result.difficulty).toBe(5.0);
    expect(result.changed).toBe(false);
  });

  it("clamps to game bounds", () => {
    const state = makeState({ difficulty: 9.9 });
    const perf = makePerformance({ score: 0.99 });
    const result = recommendDifficulty(state, perf, gameKey);
    expect(result.difficulty).toBeLessThanOrEqual(10);
  });

  it("clamps to minimum difficulty", () => {
    const state = makeState({ difficulty: 1.1 });
    const perf = makePerformance({ score: 0.1 });
    const result = recommendDifficulty(state, perf, gameKey);
    expect(result.difficulty).toBeGreaterThanOrEqual(1);
  });

  it("limits session change", () => {
    const state = makeState({ ability: 5.0, difficulty: 5.0 });
    const perf = makePerformance({ score: 0.99 });
    const result = recommendDifficulty(state, perf, gameKey);
    // Should not change more than 1.0 from ability
    expect(Math.abs(result.difficulty - state.ability)).toBeLessThanOrEqual(1.0);
  });

  it("reports previous difficulty", () => {
    const state = makeState({ difficulty: 5.0 });
    const perf = makePerformance({ score: 0.9 });
    const result = recommendDifficulty(state, perf, gameKey);
    expect(result.previousDifficulty).toBe(5.0);
  });

  it("works for all game keys", () => {
    const games: GameKey[] = ["memory_matrix", "target_watch", "quick_match", "stop_signal", "rule_switch", "spice_stall", "red_light", "courier_map", "lighthouse_keeper", "sushi_express", "crystal_palace"];
    const state = makeState();
    const perf = makePerformance({ score: 0.9 });
    
    for (const game of games) {
      const result = recommendDifficulty(state, perf, game);
      expect(result.difficulty).toBeGreaterThanOrEqual(1);
      expect(result.difficulty).toBeLessThanOrEqual(10);
    }
  });
});

describe("getGameBounds", () => {
  it("returns bounds for each game", () => {
    const bounds = getGameBounds("memory_matrix");
    expect(bounds.min).toBe(1);
    expect(bounds.max).toBe(10);
    expect(bounds.maxStep).toBeGreaterThan(0);
  });
});

describe("clampDifficulty", () => {
  it("clamps to bounds", () => {
    expect(clampDifficulty(0.5, "memory_matrix")).toBe(1);
    expect(clampDifficulty(11, "memory_matrix")).toBe(10);
    expect(clampDifficulty(5, "memory_matrix")).toBe(5);
  });
});

describe("getDifficultyLevel", () => {
  it("rounds to nearest integer", () => {
    expect(getDifficultyLevel(5.0)).toBe(5);
    expect(getDifficultyLevel(5.6)).toBe(6);
    expect(getDifficultyLevel(5.4)).toBe(5);
  });

  it("clamps to 1–10", () => {
    expect(getDifficultyLevel(0.5)).toBe(1);
    expect(getDifficultyLevel(11)).toBe(10);
  });
});
