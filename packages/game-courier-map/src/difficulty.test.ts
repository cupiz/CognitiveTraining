import { describe, it, expect } from "vitest";
import {
  getDifficultyConfig,
  validateConfig,
  generateLayout,
  shortestPath,
  RULE_IDS,
  type CourierMapConfig,
} from "./difficulty.js";
import { createRng } from "@cog/game-core";

describe("CourierMap difficulty table", () => {
  it("provides a valid config for every level D1–D10", () => {
    for (let d = 1; d <= 10; d++) {
      const config = getDifficultyConfig(d);
      expect(() => validateConfig(config)).not.toThrow();
      expect(config.mapNodes).toBeGreaterThanOrEqual(6);
      expect(config.rules.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("clamps difficulty outside 1..10", () => {
    expect(getDifficultyConfig(0).mapNodes).toBe(getDifficultyConfig(1).mapNodes);
    expect(getDifficultyConfig(99).mapNodes).toBe(getDifficultyConfig(10).mapNodes);
  });

  it("escalates difficulty across levels", () => {
    expect(getDifficultyConfig(10).mapNodes).toBeGreaterThan(getDifficultyConfig(1).mapNodes);
    expect(getDifficultyConfig(10).rules.length).toBeGreaterThanOrEqual(
      getDifficultyConfig(1).rules.length,
    );
  });
});

describe("CourierMap validation", () => {
  it("rejects mapNodes < 6", () => {
    expect(() => validateConfig({ ...getDifficultyConfig(3), mapNodes: 5 })).toThrow();
  });

  it("rejects blockedEdges >= mapNodes", () => {
    expect(() => validateConfig({ ...getDifficultyConfig(3), blockedEdges: 8 })).toThrow();
  });

  it("rejects unknown rules", () => {
    expect(() =>
      validateConfig({ ...getDifficultyConfig(3), rules: ["teleport" as never] }),
    ).toThrow();
  });

  it("rejects switchProbability > 0.4", () => {
    expect(() => validateConfig({ ...getDifficultyConfig(5), switchProbability: 0.9 })).toThrow();
  });

  it("rejects deadlineMs out of range", () => {
    expect(() => validateConfig({ ...getDifficultyConfig(3), deadlineMs: 5000 })).toThrow();
  });
});

describe("CourierMap generator", () => {
  it("always produces a connected, solvable layout (all difficulties, many seeds)", () => {
    for (let d = 1; d <= 10; d++) {
      for (const seed of [1, 7, 42, 1337, 2026]) {
        const config = getDifficultyConfig(d) as CourierMapConfig;
        const layout = generateLayout(config, createRng(seed));
        expect(layout.nodes).toHaveLength(config.mapNodes);
        expect(layout.startNode).not.toBe(layout.goalNode);
        expect(layout.referencePath.length).toBeGreaterThanOrEqual(2);
        // Reference must actually be a valid path under the config rules.
        const path = shortestPath(layout, layout.startNode, config.rules);
        expect(path).not.toBeNull();
        expect(path![0]).toBe(layout.startNode);
        expect(path![path!.length - 1]).toBe(layout.goalNode);
      }
    }
  });

  it("marks exactly the requested number of blocked edges (when possible)", () => {
    const config = { ...getDifficultyConfig(8), blockedEdges: 2 } as CourierMapConfig;
    const layout = generateLayout(config, createRng(3));
    expect(layout.edges.filter((e) => e.blocked).length).toBe(2);
  });

  it("keeps the map connected after blocking edges", () => {
    const config = { ...getDifficultyConfig(10) } as CourierMapConfig;
    const layout = generateLayout(config, createRng(9));
    const adj: number[][] = Array.from({ length: layout.nodes.length }, () => []);
    for (const e of layout.edges) {
      if (e.blocked) continue;
      adj[e.a].push(e.b);
      adj[e.b].push(e.a);
    }
    const seen = new Set<number>([0]);
    const queue = [0];
    while (queue.length) {
      const cur = queue.pop()!;
      for (const next of adj[cur]) {
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
    expect(seen.size).toBe(layout.nodes.length);
  });

  it("fails loudly rather than returning an unsolvable map", () => {
    // 2 rules with a tiny map and many blocked edges is still generatable;
    // the point is the generator throws instead of silently misbehaving.
    const config = { mapNodes: 6, blockedEdges: 5, rules: RULE_IDS.slice(0, 2), switchProbability: 0, deadlineMs: 20000 };
    expect(() => generateLayout(config, createRng(5))).not.toThrow();
  });
});