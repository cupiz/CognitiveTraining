import { describe, it, expect } from "vitest";
import { generatePlan, getDefaultConstraints, PLANNER_VERSION } from "./engine.js";
import type { PlannerInput, GameKey, AbilityState, DomainPerformance, GameExposure } from "./types.js";

describe("generatePlan", () => {
  function makeInput(overrides: Partial<PlannerInput> = {}): PlannerInput {
    return {
      childId: "child-1",
      adaptiveStates: {},
      domainPerformances: [],
      gameExposures: [],
      constraints: getDefaultConstraints(),
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

  it("generates a plan with multiple games", () => {
    const result = generatePlan(makeInput());
    expect(result.items.length).toBeGreaterThanOrEqual(3);
    expect(result.items.length).toBeLessThanOrEqual(6);
    expect(result.plannerVersion).toBe(PLANNER_VERSION);
  });

  it("respects maxDurationSec constraint", () => {
    const result = generatePlan(makeInput({
      constraints: { maxDurationSec: 5 * 60 }, // 5 minutes
    }));
    // 5 min / 2.5 min per game = max 2 games
    expect(result.items.length).toBeLessThanOrEqual(2);
    expect(result.estimatedDurationSec).toBeLessThanOrEqual(5 * 60);
  });

  it("excludes specified games", () => {
    const result = generatePlan(makeInput({
      constraints: { excludeGames: ["memory_matrix", "target_watch"] },
    }));
    const gameKeys = result.items.map((i) => i.gameKey);
    expect(gameKeys).not.toContain("memory_matrix");
    expect(gameKeys).not.toContain("target_watch");
  });

  it("forces specified games", () => {
    const result = generatePlan(makeInput({
      constraints: { forceGames: ["rule_switch"] },
    }));
    const gameKeys = result.items.map((i) => i.gameKey);
    expect(gameKeys).toContain("rule_switch");
  });

  it("includes adaptive difficulty", () => {
    const abilities: Partial<Record<GameKey, AbilityState | null>> = {
      memory_matrix: makeAbility({ difficulty: 7 }),
      target_watch: makeAbility({ difficulty: 3 }),
    };

    const result = generatePlan(makeInput({ adaptiveStates: abilities }));
    const mm = result.items.find((i) => i.gameKey === "memory_matrix");
    const tw = result.items.find((i) => i.gameKey === "target_watch");

    if (mm) expect(mm.difficulty).toBe(7);
    if (tw) expect(tw.difficulty).toBe(3);
  });

  it("uses default difficulty when no state", () => {
    const result = generatePlan(makeInput());
    for (const item of result.items) {
      expect(item.difficulty).toBe(5);
    }
  });

  it("returns empty for no eligible games", () => {
    const result = generatePlan(makeInput({
      constraints: {
        excludeGames: ["memory_matrix", "target_watch", "quick_match", "stop_signal", "rule_switch", "spice_stall", "red_light", "courier_map", "lighthouse_keeper", "sushi_express", "crystal_palace"],
      },
    }));
    expect(result.items.length).toBe(0);
    expect(result.rationale).toContain("no_eligible_games");
  });

  it("includes rationale codes", () => {
    const result = generatePlan(makeInput());
    expect(result.rationale.length).toBeGreaterThan(0);
  });

  it("sets target domain for each item", () => {
    const result = generatePlan(makeInput());
    for (const item of result.items) {
      expect(item.targetDomain).toBeDefined();
      expect(typeof item.targetDomain).toBe("string");
    }
  });

  it("sets game version per family", () => {
    const result = generatePlan(makeInput());
    for (const item of result.items) {
      const expected =
        item.gameKey === "spice_stall" ||
        item.gameKey === "red_light" ||
        item.gameKey === "courier_map" ||
        item.gameKey === "lighthouse_keeper" ||
        item.gameKey === "sushi_express" ||
        item.gameKey === "crystal_palace"
          ? "0.1.0"
          : "1.0.0";
      expect(item.gameVersion).toBe(expected);
    }
  });

  it("prioritizes weak domains", () => {
    const performances: DomainPerformance[] = [
      { domain: "working_memory", score: 20, confidence: 0.8, sourceRunCount: 10 },
      { domain: "sustained_attention", score: 80, confidence: 0.8, sourceRunCount: 10 },
      { domain: "processing_speed", score: 70, confidence: 0.8, sourceRunCount: 10 },
      { domain: "inhibitory_control", score: 75, confidence: 0.8, sourceRunCount: 10 },
      { domain: "cognitive_flexibility", score: 65, confidence: 0.8, sourceRunCount: 10 },
    ];

    const result = generatePlan(makeInput({ domainPerformances: performances }));
    // memory_matrix (working_memory) should be included
    const gameKeys = result.items.map((i) => i.gameKey);
    expect(gameKeys).toContain("memory_matrix");
  });

  it("avoids recently played games", () => {
    const exposures: GameExposure[] = [
      { gameKey: "memory_matrix", lastPlayedAt: new Date().toISOString(), totalPlays: 20, recentPlays: 5 },
      { gameKey: "target_watch", lastPlayedAt: null, totalPlays: 0, recentPlays: 0 },
    ];

    const result = generatePlan(makeInput({ gameExposures: exposures }));
    // target_watch should be selected (never played)
    const gameKeys = result.items.map((i) => i.gameKey);
    expect(gameKeys).toContain("target_watch");
  });
});

describe("getDefaultConstraints", () => {
  it("returns reasonable defaults", () => {
    const constraints = getDefaultConstraints();
    expect(constraints.maxDurationSec).toBe(900); // 15 min
    expect(constraints.maxGames).toBe(6);
    expect(constraints.minUniqueGames).toBe(3);
  });
});
