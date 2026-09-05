import { describe, it, expect } from "vitest";
import {
  getDifficultyConfig,
  validateConfig,
  generateMenu,
  generateOrder,
} from "./difficulty.js";

describe("getDifficultyConfig", () => {
  it("returns D1 preset", () => {
    const config = getDifficultyConfig(1);
    expect(config).toEqual({
      orderLength: 2,
      menuSize: 4,
      exposureMs: 2500,
      patienceMs: 12000,
      similarPairs: 0,
    });
  });

  it("returns D10 preset", () => {
    const config = getDifficultyConfig(10);
    expect(config).toEqual({
      orderLength: 7,
      menuSize: 8,
      exposureMs: 900,
      patienceMs: 6500,
      similarPairs: 3,
    });
  });

  it("clamps below 1 to D1 and above 10 to D10", () => {
    expect(getDifficultyConfig(0)).toEqual(getDifficultyConfig(1));
    expect(getDifficultyConfig(99)).toEqual(getDifficultyConfig(10));
  });

  it("rounds fractional difficulty", () => {
    expect(getDifficultyConfig(4.4)).toEqual(getDifficultyConfig(4));
  });
});

describe("validateConfig", () => {
  it("accepts every table preset", () => {
    for (let d = 1; d <= 10; d++) {
      expect(() => validateConfig(getDifficultyConfig(d))).not.toThrow();
    }
  });

  it("rejects orderLength out of range", () => {
    expect(() =>
      validateConfig({ orderLength: 0, menuSize: 4, exposureMs: 2500, patienceMs: 12000, similarPairs: 0 }),
    ).toThrow();
    expect(() =>
      validateConfig({ orderLength: 9, menuSize: 8, exposureMs: 900, patienceMs: 6500, similarPairs: 0 }),
    ).toThrow();
  });

  it("rejects menuSize out of range", () => {
    expect(() =>
      validateConfig({ orderLength: 2, menuSize: 3, exposureMs: 2500, patienceMs: 12000, similarPairs: 0 }),
    ).toThrow();
  });

  it("rejects similarPairs >= menuSize", () => {
    expect(() =>
      validateConfig({ orderLength: 2, menuSize: 4, exposureMs: 2500, patienceMs: 12000, similarPairs: 4 }),
    ).toThrow();
  });
});

describe("generateMenu", () => {
  it("builds a menu of the configured size", () => {
    const config = getDifficultyConfig(5);
    const menu = generateMenu(config, () => 0.5);
    expect(menu).toHaveLength(6);
    expect(menu.map((m) => m.id)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("is deterministic for the same rng sequence", () => {
    const config = getDifficultyConfig(8);
    const seq = [0.1, 0.7, 0.3, 0.9, 0.2, 0.8, 0.4, 0.6, 0.15, 0.55];
    const run = () => {
      let i = 0;
      const rng = () => seq[i++ % seq.length];
      return generateMenu(config, rng).map((m) => m.emoji).join("");
    };
    expect(run()).toBe(run());
  });

  it("plants at least the configured similar pairs", () => {
    const config = getDifficultyConfig(9); // similarPairs: 3
    let i = 0;
    const rng = () => {
      i++;
      return (i * 0.37) % 1;
    };
    const menu = generateMenu(config, rng);
    const byFamily = new Map<string, number>();
    for (const item of menu) {
      byFamily.set(item.family, (byFamily.get(item.family) ?? 0) + 1);
    }
    const pairs = [...byFamily.values()].filter((n) => n >= 2).length;
    expect(pairs).toBeGreaterThanOrEqual(3);
  });
});

describe("generateOrder", () => {
  it("generates orders of the configured length within the menu", () => {
    const config = getDifficultyConfig(4);
    const order = generateOrder(config, () => 0.99);
    expect(order).toHaveLength(4);
    for (const idx of order) {
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(config.menuSize);
    }
  });
});
