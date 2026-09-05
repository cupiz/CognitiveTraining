import { describe, it, expect } from "vitest";
import { createInitialState, updateAbility, batchUpdateAbility } from "./ability-estimator.js";
import type { AbilityState, PerformanceScore } from "./types.js";

describe("createInitialState", () => {
  it("creates initial state with default values", () => {
    const state = createInitialState("child-1", "memory_matrix");
    expect(state.ability).toBe(5.0);
    expect(state.uncertainty).toBe(4.0);
    expect(state.difficulty).toBe(5.0);
    expect(state.attempts).toBe(0);
    expect(state.algorithmVersion).toContain("v0.1");
  });
});

describe("updateAbility", () => {
  function makeState(overrides: Partial<AbilityState> = {}): AbilityState {
    return {
      ability: 5.0,
      uncertainty: 4.0,
      difficulty: 5.0,
      attempts: 0,
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

  it("returns same state for unusable performance", () => {
    const state = makeState();
    const perf = makePerformance({ usable: false });
    const result = updateAbility(state, perf);
    expect(result).toEqual(state);
  });

  it("increases ability for high performance", () => {
    const state = makeState({ ability: 5.0, difficulty: 5.0 });
    const perf = makePerformance({ score: 0.9 });
    const result = updateAbility(state, perf);
    expect(result.ability).toBeGreaterThan(5.0);
  });

  it("decreases ability for low performance", () => {
    const state = makeState({ ability: 5.0, difficulty: 5.0 });
    const perf = makePerformance({ score: 0.3 });
    const result = updateAbility(state, perf);
    expect(result.ability).toBeLessThan(5.0);
  });

  it("reduces uncertainty with each observation", () => {
    const state = makeState({ uncertainty: 4.0 });
    const perf = makePerformance();
    const result = updateAbility(state, perf);
    expect(result.uncertainty).toBeLessThan(4.0);
  });

  it("increments attempt count", () => {
    const state = makeState({ attempts: 5 });
    const perf = makePerformance();
    const result = updateAbility(state, perf);
    expect(result.attempts).toBe(6);
  });

  it("clamps ability to 0–10", () => {
    const state = makeState({ ability: 9.9, uncertainty: 5.0 });
    const perf = makePerformance({ score: 1.0 });
    const result = updateAbility(state, perf);
    expect(result.ability).toBeLessThanOrEqual(10);
  });

  it("clamps ability to minimum 0", () => {
    const state = makeState({ ability: 0.1, uncertainty: 5.0 });
    const perf = makePerformance({ score: 0 });
    const result = updateAbility(state, perf);
    expect(result.ability).toBeGreaterThanOrEqual(0);
  });

  it("does not reduce uncertainty below minimum", () => {
    const state = makeState({ uncertainty: 0.5 });
    const perf = makePerformance();
    const result = updateAbility(state, perf);
    expect(result.uncertainty).toBeGreaterThanOrEqual(0.5);
  });

  it("larger updates with higher uncertainty", () => {
    const stateHigh = makeState({ ability: 5.0, uncertainty: 4.0 });
    const stateLow = makeState({ ability: 5.0, uncertainty: 1.0 });
    const perf = makePerformance({ score: 0.9 });
    
    const resultHigh = updateAbility(stateHigh, perf);
    const resultLow = updateAbility(stateLow, perf);
    
    const deltaHigh = Math.abs(resultHigh.ability - 5.0);
    const deltaLow = Math.abs(resultLow.ability - 5.0);
    
    expect(deltaHigh).toBeGreaterThan(deltaLow);
  });
});

describe("batchUpdateAbility", () => {
  it("applies multiple updates sequentially", () => {
    const initial = createInitialState("child-1", "memory_matrix");
    const performances: PerformanceScore[] = [
      { score: 0.8, accuracyComponent: 0.9, speedComponent: 0.7, consistencyComponent: 0.6, usable: true },
      { score: 0.9, accuracyComponent: 1.0, speedComponent: 0.8, consistencyComponent: 0.7, usable: true },
      { score: 0.85, accuracyComponent: 0.95, speedComponent: 0.75, consistencyComponent: 0.65, usable: true },
    ];
    
    const result = batchUpdateAbility(initial, performances);
    expect(result.attempts).toBe(3);
    expect(result.ability).not.toBe(5.0); // Should have changed
  });

  it("handles empty performance array", () => {
    const initial = createInitialState("child-1", "memory_matrix");
    const result = batchUpdateAbility(initial, []);
    expect(result.attempts).toBe(0);
    expect(result.ability).toBe(5.0);
  });

  it("skips unusable performances", () => {
    const initial = createInitialState("child-1", "memory_matrix");
    const performances: PerformanceScore[] = [
      { score: 0, accuracyComponent: 0, speedComponent: 0, consistencyComponent: 0, usable: false },
      { score: 0.8, accuracyComponent: 0.9, speedComponent: 0.7, consistencyComponent: 0.6, usable: true },
    ];
    
    const result = batchUpdateAbility(initial, performances);
    expect(result.attempts).toBe(1); // Only usable one counted
  });
});
