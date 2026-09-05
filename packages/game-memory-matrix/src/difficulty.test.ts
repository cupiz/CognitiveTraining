import { describe, it, expect } from "vitest";
import { getDifficultyConfig, validateConfig } from "./difficulty.js";

describe("getDifficultyConfig", () => {
  it("returns D1 config for difficulty 1", () => {
    const config = getDifficultyConfig(1);
    expect(config.gridRows).toBe(3);
    expect(config.gridCols).toBe(3);
    expect(config.targetCount).toBe(2);
    expect(config.exposureMs).toBe(2000);
  });

  it("returns D5 config for difficulty 5", () => {
    const config = getDifficultyConfig(5);
    expect(config.gridRows).toBe(5);
    expect(config.gridCols).toBe(5);
    expect(config.targetCount).toBe(6);
    expect(config.exposureMs).toBe(1300);
  });

  it("returns D10 config for difficulty 10", () => {
    const config = getDifficultyConfig(10);
    expect(config.gridRows).toBe(8);
    expect(config.gridCols).toBe(8);
    expect(config.targetCount).toBe(12);
    expect(config.exposureMs).toBe(800);
  });

  it("clamps difficulty below 1 to D1", () => {
    const config = getDifficultyConfig(0);
    expect(config.gridRows).toBe(3);
  });

  it("clamps difficulty above 10 to D10", () => {
    const config = getDifficultyConfig(15);
    expect(config.gridRows).toBe(8);
  });

  it("handles fractional difficulty", () => {
    const config = getDifficultyConfig(2.5);
    expect(config.gridRows).toBe(4); // rounds to D3
  });
});

describe("validateConfig", () => {
  it("accepts valid config", () => {
    expect(() =>
      validateConfig({ gridRows: 4, gridCols: 4, targetCount: 5, exposureMs: 1200, responseDeadlineMs: 4000 }),
    ).not.toThrow();
  });

  it("rejects targetCount > total cells", () => {
    expect(() =>
      validateConfig({ gridRows: 3, gridCols: 3, targetCount: 10, exposureMs: 1200, responseDeadlineMs: 4000 }),
    ).toThrow("targetCount (10) exceeds grid size");
  });

  it("rejects targetCount < 1", () => {
    expect(() =>
      validateConfig({ gridRows: 3, gridCols: 3, targetCount: 0, exposureMs: 1200, responseDeadlineMs: 4000 }),
    ).toThrow("targetCount must be at least 1");
  });
});
