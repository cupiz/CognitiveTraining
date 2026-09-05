import { describe, it, expect } from "vitest";
import {
  getDomainMapping,
  getPrimaryDomain,
  getGamesForDomain,
  getDomainWeight,
  getAllDomains,
  getAllGameKeys,
} from "./domain-mapping.js";

describe("getDomainMapping", () => {
  it("returns mapping for each game", () => {
    const games = getAllGameKeys();
    for (const game of games) {
      const mapping = getDomainMapping(game);
      expect(mapping).toBeDefined();
      expect(mapping!.gameKey).toBe(game);
      expect(mapping!.primaryDomain).toBeDefined();
      expect(mapping!.weights).toBeDefined();
    }
  });

  it("returns undefined for unknown game", () => {
    // @ts-expect-error testing invalid game key
    const mapping = getDomainMapping("unknown_game");
    expect(mapping).toBeUndefined();
  });
});

describe("getPrimaryDomain", () => {
  it("returns correct primary domains", () => {
    expect(getPrimaryDomain("memory_matrix")).toBe("working_memory");
    expect(getPrimaryDomain("target_watch")).toBe("sustained_attention");
    expect(getPrimaryDomain("quick_match")).toBe("processing_speed");
    expect(getPrimaryDomain("stop_signal")).toBe("inhibitory_control");
    expect(getPrimaryDomain("rule_switch")).toBe("cognitive_flexibility");
    expect(getPrimaryDomain("spice_stall")).toBe("working_memory");
    expect(getPrimaryDomain("red_light")).toBe("inhibitory_control");
    expect(getPrimaryDomain("courier_map")).toBe("cognitive_flexibility");
    expect(getPrimaryDomain("lighthouse_keeper")).toBe("working_memory");
    expect(getPrimaryDomain("sushi_express")).toBe("processing_speed");
    expect(getPrimaryDomain("crystal_palace")).toBe("visual_spatial");
  });
});

describe("getGamesForDomain", () => {
  it("returns games for working_memory", () => {
    const games = getGamesForDomain("working_memory");
    expect(games).toContain("memory_matrix");
    expect(games).toContain("spice_stall");
  });

  it("returns games for processing_speed", () => {
    const games = getGamesForDomain("processing_speed");
    expect(games.length).toBeGreaterThan(0);
  });

  it("returns crystal_palace for visual_spatial (its primary)", () => {
    const games = getGamesForDomain("visual_spatial");
    expect(games).toContain("crystal_palace");
  });
});

describe("getDomainWeight", () => {
  it("returns weight for primary domain", () => {
    const weight = getDomainWeight("memory_matrix", "working_memory");
    expect(weight).toBeGreaterThan(0.5);
  });

  it("returns weight for secondary domain", () => {
    const weight = getDomainWeight("memory_matrix", "visual_spatial");
    expect(weight).toBeGreaterThan(0);
    expect(weight).toBeLessThan(0.5);
  });

  it("returns 0 for unrelated domain", () => {
    const weight = getDomainWeight("memory_matrix", "inhibitory_control");
    expect(weight).toBe(0);
  });
});

describe("getAllDomains", () => {
  it("returns 6 domains", () => {
    const domains = getAllDomains();
    expect(domains.length).toBe(6);
  });
});

describe("getAllGameKeys", () => {
  it("returns 11 games", () => {
    const games = getAllGameKeys();
    expect(games.length).toBe(11);
    expect(games).toContain("red_light");
    expect(games).toContain("crystal_palace");
  });
});
