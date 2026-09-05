import { describe, it, expect } from "vitest";
import { getDifficultyConfig, validateConfig, generateGrid } from "./difficulty.js";
import { createRng } from "@cog/game-core";

describe("CrystalPalace difficulty table", () => {
  it("provides a valid config for every level D1–D10", () => {
    for (let d = 1; d <= 10; d++) {
      const config = getDifficultyConfig(d);
      expect(() => validateConfig(config)).not.toThrow();
      expect(config.matchCount).toBeGreaterThanOrEqual(2);
    }
  });

  it("clamps difficulty outside 1..10", () => {
    expect(getDifficultyConfig(0).gridCols).toBe(getDifficultyConfig(1).gridCols);
    expect(getDifficultyConfig(99).gridCols).toBe(getDifficultyConfig(10).gridCols);
  });

  it("escalates load with difficulty", () => {
    expect(getDifficultyConfig(10).gridRows * getDifficultyConfig(10).gridCols).toBeGreaterThan(
      getDifficultyConfig(1).gridRows * getDifficultyConfig(1).gridCols,
    );
  });
});

describe("CrystalPalace validation", () => {
  it("rejects gridRows > 8", () => {
    expect(() => validateConfig({ ...getDifficultyConfig(3), gridRows: 9 })).toThrow();
  });

  it("rejects too-small grids", () => {
    expect(() =>
      validateConfig({ gridRows: 2, gridCols: 2, matchCount: 4, similarLevel: 0, deadlineMs: 15000 }),
    ).toThrow();
  });

  it("rejects similarLevel > 3", () => {
    expect(() => validateConfig({ ...getDifficultyConfig(3), similarLevel: 4 })).toThrow();
  });

  it("rejects deadlineMs out of range", () => {
    expect(() => validateConfig({ ...getDifficultyConfig(3), deadlineMs: 5000 })).toThrow();
  });
});

describe("CrystalPalace grid generator", () => {
  it("always places exactly the requested matches", () => {
    for (let d = 1; d <= 10; d++) {
      for (const seed of [1, 7, 42, 99]) {
        const config = getDifficultyConfig(d);
        const grid = generateGrid(config, createRng(seed));
        const matches = grid.cells.filter((c) => c.isMatch);
        expect(matches).toHaveLength(config.matchCount);
        for (const m of matches) {
          expect(m.color).toBe(grid.targetColor);
          expect(m.shape).toBe(grid.targetShape);
        }
      }
    }
  });

  it("never lets unrelated crystals accidentally match the target", () => {
    const config = getDifficultyConfig(10);
    const grid = generateGrid(config, createRng(5));
    const unrelated = grid.cells.filter((c) => !c.isMatch);
    for (const c of unrelated) {
      expect(c.color === grid.targetColor && c.shape === grid.targetShape).toBe(false);
    }
  });

  it("plants near-miss distractors sharing colour or cut at higher levels", () => {
    const config = getDifficultyConfig(7); // similarLevel 3
    const grid = generateGrid(config, createRng(3));
    const distractors = grid.cells.filter((c) => !c.isMatch);
    const nearMiss = distractors.filter(
      (c) => c.color === grid.targetColor || c.shape === grid.targetShape,
    );
    expect(nearMiss.length).toBeGreaterThan(0);
  });
});