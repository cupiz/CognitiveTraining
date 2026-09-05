import { describe, it, expect } from "vitest";
import { getDifficultyConfig, validateConfig, generateTrial, type QuickMatchConfig } from "./difficulty.js";

describe("getDifficultyConfig", () => {
  it("returns valid config for D1", () => {
    const config = getDifficultyConfig(1);
    expect(config.optionsCount).toBe(2);
    expect(config.presentationTimeMs).toBe(3000);
    expect(config.distractorCount).toBe(0);
  });

  it("returns valid config for D5", () => {
    const config = getDifficultyConfig(5);
    expect(config.optionsCount).toBe(4);
    expect(config.presentationTimeMs).toBe(1800);
    expect(config.distractorCount).toBe(2);
  });

  it("returns valid config for D10", () => {
    const config = getDifficultyConfig(10);
    expect(config.optionsCount).toBe(8);
    expect(config.presentationTimeMs).toBe(700);
    expect(config.distractorCount).toBe(5);
  });

  it("clamps difficulty below 1 to D1", () => {
    const config = getDifficultyConfig(0);
    expect(config.optionsCount).toBe(2);
  });

  it("clamps difficulty above 10 to D10", () => {
    const config = getDifficultyConfig(15);
    expect(config.optionsCount).toBe(8);
  });

  it("has decreasing presentation time across difficulties", () => {
    const configs = Array.from({ length: 10 }, (_, i) => getDifficultyConfig(i + 1));
    for (let i = 1; i < configs.length; i++) {
      expect(configs[i].presentationTimeMs).toBeLessThanOrEqual(configs[i - 1].presentationTimeMs);
    }
  });

  it("has increasing options count across difficulties", () => {
    const configs = Array.from({ length: 10 }, (_, i) => getDifficultyConfig(i + 1));
    for (let i = 1; i < configs.length; i++) {
      expect(configs[i].optionsCount).toBeGreaterThanOrEqual(configs[i - 1].optionsCount);
    }
  });

  it("has increasing distractor count across difficulties", () => {
    const configs = Array.from({ length: 10 }, (_, i) => getDifficultyConfig(i + 1));
    for (let i = 1; i < configs.length; i++) {
      expect(configs[i].distractorCount).toBeGreaterThanOrEqual(configs[i - 1].distractorCount);
    }
  });
});

describe("validateConfig", () => {
  it("accepts valid config", () => {
    const config = getDifficultyConfig(5);
    expect(() => validateConfig(config)).not.toThrow();
  });

  it("rejects optionsCount < 2", () => {
    const config: QuickMatchConfig = { ...getDifficultyConfig(1), optionsCount: 1 };
    expect(() => validateConfig(config)).toThrow("optionsCount must be at least 2");
  });

  it("rejects presentationTimeMs < 200", () => {
    const config: QuickMatchConfig = { ...getDifficultyConfig(1), presentationTimeMs: 100 };
    expect(() => validateConfig(config)).toThrow("presentationTimeMs must be at least 200ms");
  });

  it("rejects responseDeadlineMs < 500", () => {
    const config: QuickMatchConfig = { ...getDifficultyConfig(1), responseDeadlineMs: 400 };
    expect(() => validateConfig(config)).toThrow("responseDeadlineMs must be at least 500ms");
  });

  it("rejects distractorCount >= optionsCount", () => {
    const config: QuickMatchConfig = { ...getDifficultyConfig(1), distractorCount: 2, optionsCount: 2 };
    expect(() => validateConfig(config)).toThrow("distractorCount must be less than optionsCount");
  });
});

describe("generateTrial", () => {
  it("generates trial with correct options count", () => {
    const config = getDifficultyConfig(1);
    const trial = generateTrial(config, Math.random);
    expect(trial.options).toHaveLength(config.optionsCount);
  });

  it("includes the target in options", () => {
    const config = getDifficultyConfig(5);
    const trial = generateTrial(config, Math.random);
    expect(trial.options).toContain(trial.target);
  });

  it("targetIndex points to correct option", () => {
    const config = getDifficultyConfig(3);
    const trial = generateTrial(config, Math.random);
    expect(trial.options[trial.targetIndex]).toBe(trial.target);
  });

  it("is deterministic with same seed", () => {
    const config = getDifficultyConfig(3);
    const rng1 = () => 0.5;
    const rng2 = () => 0.5;
    const trial1 = generateTrial(config, rng1);
    const trial2 = generateTrial(config, rng2);
    expect(trial1.target).toBe(trial2.target);
    expect(trial1.options).toEqual(trial2.options);
  });

  it("produces different trials with different seeds", () => {
    const config = getDifficultyConfig(5);
    let seed1 = 11111;
    let seed2 = 99999;
    const rng1 = () => { seed1 = (seed1 * 16807) % 2147483647; return seed1 / 2147483647; };
    const rng2 = () => { seed2 = (seed2 * 16807) % 2147483647; return seed2 / 2147483647; };
    const trial1 = generateTrial(config, rng1);
    const trial2 = generateTrial(config, rng2);
    // At least the options order or target should differ
    expect(trial1.options.join("")).not.toBe(trial2.options.join(""));
  });

  it("has no duplicate options", () => {
    const config = getDifficultyConfig(8);
    const trial = generateTrial(config, Math.random);
    expect(new Set(trial.options).size).toBe(trial.options.length);
  });
});
