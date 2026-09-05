import { describe, it, expect } from "vitest";
import { scoreGames } from "./scoring.js";
import type { DomainPerformance, GameExposure, GameKey, AbilityState } from "./types.js";

describe("scoreGames", () => {
  function makeExposure(overrides: Partial<GameExposure> = {}): GameExposure {
    return {
      gameKey: "memory_matrix",
      lastPlayedAt: null,
      totalPlays: 0,
      recentPlays: 0,
      ...overrides,
    };
  }

  function makePerformance(overrides: Partial<DomainPerformance> = {}): DomainPerformance {
    return {
      domain: "working_memory",
      score: 50,
      confidence: 0.8,
      sourceRunCount: 10,
      ...overrides,
    };
  }

  function makeAbility(overrides: Partial<AbilityState> = {}): AbilityState {
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

  it("returns scored games for all 7 games", () => {
    const result = scoreGames([], [], {});
    expect(result.length).toBe(11);
    // Each game should have a score
    for (const game of result) {
      expect(game.score).toBeGreaterThanOrEqual(0);
      expect(game.score).toBeLessThanOrEqual(1);
      expect(game.gameKey).toBeDefined();
    }
  });

  it("prioritizes weak domains", () => {
    // Low working_memory performance → memory_matrix should score high
    const performances = [
      makePerformance({ domain: "working_memory", score: 20, confidence: 0.8 }),
      makePerformance({ domain: "sustained_attention", score: 80, confidence: 0.8 }),
    ];

    const result = scoreGames(performances, [], {});
    const memoryMatrix = result.find((g) => g.gameKey === "memory_matrix");
    const targetWatch = result.find((g) => g.gameKey === "target_watch");

    expect(memoryMatrix!.weaknessScore).toBeGreaterThan(targetWatch!.weaknessScore);
  });

  it("penalizes recently played games", () => {
    const exposures = [
      makeExposure({ gameKey: "memory_matrix", recentPlays: 3, totalPlays: 10 }),
      makeExposure({ gameKey: "target_watch", recentPlays: 0, totalPlays: 5 }),
    ];

    const result = scoreGames([], exposures, {});
    const memoryMatrix = result.find((g) => g.gameKey === "memory_matrix");
    const targetWatch = result.find((g) => g.gameKey === "target_watch");

    expect(memoryMatrix!.exposureScore).toBeLessThan(targetWatch!.exposureScore);
  });

  it("boosts never-played games over recently played", () => {
    const exposures = [
      makeExposure({ gameKey: "memory_matrix", totalPlays: 10, recentPlays: 3 }),
      makeExposure({ gameKey: "quick_match", totalPlays: 0, recentPlays: 0 }),
    ];

    const result = scoreGames([], exposures, {});
    const memoryMatrix = result.find((g) => g.gameKey === "memory_matrix");
    const quickMatch = result.find((g) => g.gameKey === "quick_match");

    expect(quickMatch!.exposureScore).toBeGreaterThan(memoryMatrix!.exposureScore);
  });

  it("handles no data gracefully", () => {
    const result = scoreGames([], [], {});
    expect(result.length).toBe(11);
    // All scores should be reasonable
    for (const game of result) {
      expect(game.score).toBeGreaterThan(0);
      expect(game.score).toBeLessThanOrEqual(1);
    }
  });

  it("includes rationale codes", () => {
    const performances = [
      makePerformance({ domain: "working_memory", score: 20, confidence: 0.8 }),
    ];

    const result = scoreGames(performances, [], {});
    const memoryMatrix = result.find((g) => g.gameKey === "memory_matrix");
    expect(memoryMatrix!.rationale.length).toBeGreaterThan(0);
  });

  it("returns games sorted by score descending", () => {
    const result = scoreGames([], [], {});
    for (let i = 1; i < result.length; i++) {
      expect(result[i].score).toBeLessThanOrEqual(result[i - 1].score);
    }
  });

  it("high uncertainty gives medium ability score", () => {
    const abilities: Partial<Record<GameKey, AbilityState | null>> = {
      memory_matrix: makeAbility({ uncertainty: 4.0 }),
      target_watch: makeAbility({ uncertainty: 1.0 }),
    };

    const result = scoreGames([], [], abilities);
    const memoryMatrix = result.find((g) => g.gameKey === "memory_matrix");

    // High uncertainty → medium suitability
    expect(memoryMatrix!.abilityScore).toBeCloseTo(0.6, 1);
  });
});
