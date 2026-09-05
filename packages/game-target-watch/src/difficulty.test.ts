import { describe, it, expect } from "vitest";
import { getDifficultyConfig, validateConfig, generateSequence, type TargetWatchConfig } from "./difficulty.js";

describe("getDifficultyConfig", () => {
  it("returns valid config for D1", () => {
    const config = getDifficultyConfig(1);
    expect(config.symbolsPerTrial).toBe(8);
    expect(config.targetSymbol).toBe("★");
    expect(config.interStimulusMs).toBe(2500);
    expect(config.targetProportion).toBe(0.375);
  });

  it("returns valid config for D5", () => {
    const config = getDifficultyConfig(5);
    expect(config.symbolsPerTrial).toBe(16);
    expect(config.targetSymbol).toBe("◆");
    expect(config.interStimulusMs).toBe(1600);
  });

  it("returns valid config for D10", () => {
    const config = getDifficultyConfig(10);
    expect(config.symbolsPerTrial).toBe(26);
    expect(config.interStimulusMs).toBe(900);
    expect(config.responseDeadlineMs).toBe(1000);
  });

  it("clamps difficulty below 1 to D1", () => {
    const config = getDifficultyConfig(0);
    expect(config.symbolsPerTrial).toBe(8);
  });

  it("clamps difficulty above 10 to D10", () => {
    const config = getDifficultyConfig(15);
    expect(config.symbolsPerTrial).toBe(26);
  });

  it("rounds fractional difficulty", () => {
    const config3 = getDifficultyConfig(3.4);
    const config4 = getDifficultyConfig(3.6);
    expect(config3.symbolsPerTrial).not.toBe(config4.symbolsPerTrial);
  });

  it("has decreasing inter-stimulus interval across difficulties", () => {
    const configs = Array.from({ length: 10 }, (_, i) => getDifficultyConfig(i + 1));
    for (let i = 1; i < configs.length; i++) {
      expect(configs[i].interStimulusMs).toBeLessThan(configs[i - 1].interStimulusMs);
    }
  });

  it("has increasing symbols per trial across difficulties", () => {
    const configs = Array.from({ length: 10 }, (_, i) => getDifficultyConfig(i + 1));
    for (let i = 1; i < configs.length; i++) {
      expect(configs[i].symbolsPerTrial).toBeGreaterThanOrEqual(configs[i - 1].symbolsPerTrial);
    }
  });

  it("has decreasing target proportion across difficulties", () => {
    const configs = Array.from({ length: 10 }, (_, i) => getDifficultyConfig(i + 1));
    for (let i = 1; i < configs.length; i++) {
      expect(configs[i].targetProportion).toBeLessThanOrEqual(configs[i - 1].targetProportion);
    }
  });
});

describe("validateConfig", () => {
  it("accepts valid config", () => {
    const config = getDifficultyConfig(5);
    expect(() => validateConfig(config)).not.toThrow();
  });

  it("rejects symbolsPerTrial < 3", () => {
    const config: TargetWatchConfig = { ...getDifficultyConfig(1), symbolsPerTrial: 2 };
    expect(() => validateConfig(config)).toThrow("symbolsPerTrial must be at least 3");
  });

  it("rejects targetProportion <= 0", () => {
    const config: TargetWatchConfig = { ...getDifficultyConfig(1), targetProportion: 0 };
    expect(() => validateConfig(config)).toThrow("targetProportion must be between 0 and 1");
  });

  it("rejects targetProportion >= 1", () => {
    const config: TargetWatchConfig = { ...getDifficultyConfig(1), targetProportion: 1 };
    expect(() => validateConfig(config)).toThrow("targetProportion must be between 0 and 1");
  });

  it("rejects interStimulusMs < 500", () => {
    const config: TargetWatchConfig = { ...getDifficultyConfig(1), interStimulusMs: 400 };
    expect(() => validateConfig(config)).toThrow("interStimulusMs must be at least 500ms");
  });

  it("rejects empty distractorSymbols", () => {
    const config: TargetWatchConfig = { ...getDifficultyConfig(1), distractorSymbols: [] };
    expect(() => validateConfig(config)).toThrow("distractorSymbols must not be empty");
  });
});

describe("generateSequence", () => {
  it("generates sequence with correct length", () => {
    const config = getDifficultyConfig(1);
    const sequence = generateSequence(config, Math.random);
    expect(sequence).toHaveLength(config.symbolsPerTrial);
  });

  it("includes at least one target", () => {
    const config = getDifficultyConfig(1);
    const sequence = generateSequence(config, Math.random);
    expect(sequence).toContain(config.targetSymbol);
  });

  it("only contains valid symbols", () => {
    const config = getDifficultyConfig(5);
    const sequence = generateSequence(config, Math.random);
    const validSymbols = [config.targetSymbol, ...config.distractorSymbols];
    for (const s of sequence) {
      expect(validSymbols).toContain(s);
    }
  });

  it("is deterministic with same seed", () => {
    const config = getDifficultyConfig(3);
    const rng1 = () => 0.5;
    const rng2 = () => 0.5;
    const seq1 = generateSequence(config, rng1);
    const seq2 = generateSequence(config, rng2);
    expect(seq1).toEqual(seq2);
  });

  it("produces different sequences with different seeds", () => {
    const config = getDifficultyConfig(5);
    let seed1 = 12345;
    let seed2 = 67890;
    const rng1 = () => { seed1 = (seed1 * 16807) % 2147483647; return seed1 / 2147483647; };
    const rng2 = () => { seed2 = (seed2 * 16807) % 2147483647; return seed2 / 2147483647; };
    const seq1 = generateSequence(config, rng1);
    const seq2 = generateSequence(config, rng2);
    // Very unlikely to be identical with different seeds
    expect(seq1.join("")).not.toBe(seq2.join(""));
  });

  it("maintains approximate target proportion", () => {
    const config = getDifficultyConfig(5);
    const sequence = generateSequence(config, Math.random);
    const targetCount = sequence.filter(s => s === config.targetSymbol).length;
    const expectedCount = Math.round(config.symbolsPerTrial * config.targetProportion);
    expect(targetCount).toBe(expectedCount);
  });
});
