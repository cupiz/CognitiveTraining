import { describe, it, expect } from "vitest";
import {
  getDifficultyConfig,
  validateConfig,
  generateTrial,
  shouldSwitch,
  getRandomRule,
  type RuleSwitchConfig,
} from "./difficulty.js";

describe("getDifficultyConfig", () => {
  it("returns valid config for D1", () => {
    const config = getDifficultyConfig(1);
    expect(config.rules).toHaveLength(2);
    expect(config.switchProbability).toBe(0.15);
    expect(config.stimuliCount).toBe(4);
    expect(config.responseDeadlineMs).toBe(5000);
  });

  it("returns valid config for D5", () => {
    const config = getDifficultyConfig(5);
    expect(config.rules).toHaveLength(3);
    expect(config.switchProbability).toBe(0.35);
    expect(config.stimuliCount).toBe(3);
  });

  it("returns valid config for D10", () => {
    const config = getDifficultyConfig(10);
    expect(config.rules).toHaveLength(4);
    expect(config.switchProbability).toBe(0.6);
    expect(config.stimuliCount).toBe(3);
    expect(config.responseDeadlineMs).toBe(2800);
  });

  it("clamps difficulty below 1 to D1", () => {
    const config = getDifficultyConfig(0);
    expect(config.rules).toHaveLength(2);
  });

  it("clamps difficulty above 10 to D10", () => {
    const config = getDifficultyConfig(15);
    expect(config.rules).toHaveLength(4);
  });

  it("has increasing switch probability across difficulties", () => {
    const configs = Array.from({ length: 10 }, (_, i) => getDifficultyConfig(i + 1));
    for (let i = 1; i < configs.length; i++) {
      expect(configs[i].switchProbability).toBeGreaterThanOrEqual(configs[i - 1].switchProbability);
    }
  });

  it("has decreasing response deadline across difficulties", () => {
    const configs = Array.from({ length: 10 }, (_, i) => getDifficultyConfig(i + 1));
    for (let i = 1; i < configs.length; i++) {
      expect(configs[i].responseDeadlineMs).toBeLessThanOrEqual(configs[i - 1].responseDeadlineMs);
    }
  });

  it("has increasing rule count across difficulties", () => {
    const configs = Array.from({ length: 10 }, (_, i) => getDifficultyConfig(i + 1));
    for (let i = 1; i < configs.length; i++) {
      expect(configs[i].rules.length).toBeGreaterThanOrEqual(configs[i - 1].rules.length);
    }
  });
});

describe("validateConfig", () => {
  it("accepts valid config", () => {
    const config = getDifficultyConfig(5);
    expect(() => validateConfig(config)).not.toThrow();
  });

  it("rejects less than 2 rules", () => {
    const config: RuleSwitchConfig = { ...getDifficultyConfig(1), rules: [getDifficultyConfig(1).rules[0]] };
    expect(() => validateConfig(config)).toThrow("At least 2 rules are required");
  });

  it("rejects switchProbability < 0.1", () => {
    const config: RuleSwitchConfig = { ...getDifficultyConfig(1), switchProbability: 0.05 };
    expect(() => validateConfig(config)).toThrow("switchProbability must be between 0.1 and 0.9");
  });

  it("rejects switchProbability > 0.9", () => {
    const config: RuleSwitchConfig = { ...getDifficultyConfig(1), switchProbability: 0.95 };
    expect(() => validateConfig(config)).toThrow("switchProbability must be between 0.1 and 0.9");
  });

  it("rejects stimuliCount < 2", () => {
    const config: RuleSwitchConfig = { ...getDifficultyConfig(1), stimuliCount: 1 };
    expect(() => validateConfig(config)).toThrow("stimuliCount must be at least 2");
  });

  it("rejects responseDeadlineMs < 1000", () => {
    const config: RuleSwitchConfig = { ...getDifficultyConfig(1), responseDeadlineMs: 500 };
    expect(() => validateConfig(config)).toThrow("responseDeadlineMs must be at least 1000ms");
  });
});

describe("generateTrial", () => {
  it("generates trial with correct stimuli count", () => {
    const config = getDifficultyConfig(1);
    const rule = config.rules[0];
    const trial = generateTrial(config, rule, Math.random);
    expect(trial.options).toHaveLength(config.stimuliCount);
  });

  it("target has the rule attribute value", () => {
    const config = getDifficultyConfig(1);
    const rule = config.rules[0];
    const trial = generateTrial(config, rule, Math.random);
    expect(trial.target[rule.attribute]).toBeDefined();
  });

  it("matchIndex points to correct option", () => {
    const config = getDifficultyConfig(3);
    const rule = config.rules[0];
    const trial = generateTrial(config, rule, Math.random);
    const matchOption = trial.options[trial.matchIndex];
    expect(matchOption[rule.attribute]).toBe(trial.target[rule.attribute]);
  });

  it("is deterministic with same seed", () => {
    const config = getDifficultyConfig(3);
    const rule = config.rules[0];
    const rng1 = () => 0.5;
    const rng2 = () => 0.5;
    const trial1 = generateTrial(config, rule, rng1);
    const trial2 = generateTrial(config, rule, rng2);
    expect(trial1.target).toEqual(trial2.target);
    expect(trial1.options).toEqual(trial2.options);
  });

  it("has no duplicate options", () => {
    const config = getDifficultyConfig(5);
    const rule = config.rules[0];
    const trial = generateTrial(config, rule, Math.random);
    const unique = new Set(trial.options.map((s) => `${s.color}-${s.shape}-${s.size}`));
    expect(unique.size).toBe(trial.options.length);
  });

  it("provides rule instruction", () => {
    const config = getDifficultyConfig(1);
    const rule = config.rules[0];
    const trial = generateTrial(config, rule, Math.random);
    expect(trial.ruleInstruction).toBe(rule.instruction);
  });
});

describe("shouldSwitch", () => {
  it("returns true when RNG < switchProbability", () => {
    const config = getDifficultyConfig(1);
    const result = shouldSwitch(config, () => 0.1);
    expect(result).toBe(true);
  });

  it("returns false when RNG >= switchProbability", () => {
    const config = getDifficultyConfig(1);
    const result = shouldSwitch(config, () => 0.5);
    expect(result).toBe(false);
  });

  it("approximately matches configured probability", () => {
    const config = getDifficultyConfig(5);
    let count = 0;
    const n = 1000;
    for (let i = 0; i < n; i++) {
      if (shouldSwitch(config, () => Math.random())) count++;
    }
    const proportion = count / n;
    expect(proportion).toBeGreaterThan(config.switchProbability - 0.05);
    expect(proportion).toBeLessThan(config.switchProbability + 0.05);
  });
});

describe("getRandomRule", () => {
  it("returns a rule from the config", () => {
    const config = getDifficultyConfig(1);
    const rule = getRandomRule(config, Math.random);
    expect(config.rules).toContainEqual(rule);
  });

  it("is deterministic with same seed", () => {
    const config = getDifficultyConfig(3);
    const rule1 = getRandomRule(config, () => 0.5);
    const rule2 = getRandomRule(config, () => 0.5);
    expect(rule1).toEqual(rule2);
  });
});
