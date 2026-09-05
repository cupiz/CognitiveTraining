import { describe, it, expect } from "vitest";
import { getDifficultyConfig, validateConfig, generateBelt } from "./difficulty.js";
import { createRng } from "@cog/game-core";

describe("SushiExpress difficulty table", () => {
  it("provides a valid config for every level D1–D10", () => {
    for (let d = 1; d <= 10; d++) {
      const config = getDifficultyConfig(d);
      expect(() => validateConfig(config)).not.toThrow();
      expect(config.platesPerTrial).toBeGreaterThanOrEqual(4);
    }
  });

  it("clamps difficulty outside 1..10", () => {
    expect(getDifficultyConfig(0).beltMs).toBe(getDifficultyConfig(1).beltMs);
    expect(getDifficultyConfig(99).beltMs).toBe(getDifficultyConfig(10).beltMs);
  });

  it("escalates speed with difficulty", () => {
    expect(getDifficultyConfig(10).beltMs).toBeLessThan(getDifficultyConfig(1).beltMs);
    expect(getDifficultyConfig(10).spawnIntervalMs).toBeLessThan(
      getDifficultyConfig(1).spawnIntervalMs,
    );
  });
});

describe("SushiExpress validation", () => {
  it("rejects platesPerTrial > 12", () => {
    expect(() => validateConfig({ ...getDifficultyConfig(3), platesPerTrial: 15 })).toThrow();
  });

  it("rejects sushiTypes < 2", () => {
    expect(() => validateConfig({ ...getDifficultyConfig(3), sushiTypes: 1 })).toThrow();
  });

  it("rejects targetProbability > 0.6", () => {
    expect(() => validateConfig({ ...getDifficultyConfig(3), targetProbability: 0.9 })).toThrow();
  });
});

describe("SushiExpress belt generator", () => {
  it("produces a mixed run for every config and seed", () => {
    for (let d = 1; d <= 10; d++) {
      for (const seed of [1, 7, 42, 99]) {
        const config = getDifficultyConfig(d);
        const { targetSushi, plates } = generateBelt(config, createRng(seed));
        expect(plates).toHaveLength(config.platesPerTrial);
        expect(targetSushi).toBeGreaterThanOrEqual(0);
        expect(targetSushi).toBeLessThan(config.sushiTypes);
        expect(plates.some((p) => p.isTarget)).toBe(true);
        expect(plates.some((p) => !p.isTarget)).toBe(true);
        for (const plate of plates) {
          expect(plate.sushi).toBeGreaterThanOrEqual(0);
          expect(plate.sushi).toBeLessThan(config.sushiTypes);
        }
      }
    }
  });

  it("marks all target plates with the target sushi type", () => {
    const config = getDifficultyConfig(5);
    const { targetSushi, plates } = generateBelt(config, createRng(3));
    for (const plate of plates.filter((p) => p.isTarget)) {
      expect(plate.sushi).toBe(targetSushi);
    }
  });
});