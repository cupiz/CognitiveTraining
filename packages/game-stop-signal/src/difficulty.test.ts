import { describe, it, expect } from "vitest";
import {
  getDifficultyConfig,
  validateConfig,
  isStopTrial,
  calculateSsd,
  adaptSsd,
  type StopSignalConfig,
} from "./difficulty.js";

describe("getDifficultyConfig", () => {
  it("returns valid config for D1", () => {
    const config = getDifficultyConfig(1);
    expect(config.stopTrialProportion).toBe(0.2);
    expect(config.initialStopSignalDelayMs).toBe(500);
    expect(config.goStimulusDurationMs).toBe(2500);
  });

  it("returns valid config for D5", () => {
    const config = getDifficultyConfig(5);
    expect(config.stopTrialProportion).toBe(0.3);
    expect(config.initialStopSignalDelayMs).toBe(400);
    expect(config.goStimulusDurationMs).toBe(1700);
  });

  it("returns valid config for D10", () => {
    const config = getDifficultyConfig(10);
    expect(config.stopTrialProportion).toBe(0.42);
    expect(config.initialStopSignalDelayMs).toBe(280);
    expect(config.goStimulusDurationMs).toBe(800);
  });

  it("clamps difficulty below 1 to D1", () => {
    const config = getDifficultyConfig(0);
    expect(config.stopTrialProportion).toBe(0.2);
  });

  it("clamps difficulty above 10 to D10", () => {
    const config = getDifficultyConfig(15);
    expect(config.stopTrialProportion).toBe(0.42);
  });

  it("has increasing stop trial proportion across difficulties", () => {
    const configs = Array.from({ length: 10 }, (_, i) => getDifficultyConfig(i + 1));
    for (let i = 1; i < configs.length; i++) {
      expect(configs[i].stopTrialProportion).toBeGreaterThanOrEqual(configs[i - 1].stopTrialProportion);
    }
  });

  it("has decreasing SSD across difficulties", () => {
    const configs = Array.from({ length: 10 }, (_, i) => getDifficultyConfig(i + 1));
    for (let i = 1; i < configs.length; i++) {
      expect(configs[i].initialStopSignalDelayMs).toBeLessThanOrEqual(configs[i - 1].initialStopSignalDelayMs);
    }
  });

  it("has decreasing go stimulus duration across difficulties", () => {
    const configs = Array.from({ length: 10 }, (_, i) => getDifficultyConfig(i + 1));
    for (let i = 1; i < configs.length; i++) {
      expect(configs[i].goStimulusDurationMs).toBeLessThanOrEqual(configs[i - 1].goStimulusDurationMs);
    }
  });
});

describe("validateConfig", () => {
  it("accepts valid config", () => {
    const config = getDifficultyConfig(5);
    expect(() => validateConfig(config)).not.toThrow();
  });

  it("rejects stopTrialProportion <= 0", () => {
    const config: StopSignalConfig = { ...getDifficultyConfig(1), stopTrialProportion: 0 };
    expect(() => validateConfig(config)).toThrow("stopTrialProportion must be between 0 and 1");
  });

  it("rejects stopTrialProportion >= 1", () => {
    const config: StopSignalConfig = { ...getDifficultyConfig(1), stopTrialProportion: 1 };
    expect(() => validateConfig(config)).toThrow("stopTrialProportion must be between 0 and 1");
  });

  it("rejects initialStopSignalDelayMs < 100", () => {
    const config: StopSignalConfig = { ...getDifficultyConfig(1), initialStopSignalDelayMs: 50 };
    expect(() => validateConfig(config)).toThrow("initialStopSignalDelayMs must be at least 100ms");
  });

  it("rejects goStimulusDurationMs < 500", () => {
    const config: StopSignalConfig = { ...getDifficultyConfig(1), goStimulusDurationMs: 400 };
    expect(() => validateConfig(config)).toThrow("goStimulusDurationMs must be at least 500ms");
  });

  it("rejects minSsdMs >= maxSsdMs", () => {
    const config: StopSignalConfig = { ...getDifficultyConfig(1), minSsdMs: 500, maxSsdMs: 500 };
    expect(() => validateConfig(config)).toThrow("minSsdMs must be less than maxSsdMs");
  });
});

describe("isStopTrial", () => {
  it("returns true when RNG < stopTrialProportion", () => {
    const config = getDifficultyConfig(1);
    const result = isStopTrial(config, () => 0.1);
    expect(result).toBe(true);
  });

  it("returns false when RNG >= stopTrialProportion", () => {
    const config = getDifficultyConfig(1);
    const result = isStopTrial(config, () => 0.5);
    expect(result).toBe(false);
  });

  it("approximately matches configured proportion", () => {
    const config = getDifficultyConfig(5);
    let count = 0;
    const n = 1000;
    for (let i = 0; i < n; i++) {
      if (isStopTrial(config, () => Math.random())) count++;
    }
    const proportion = count / n;
    expect(proportion).toBeGreaterThan(config.stopTrialProportion - 0.05);
    expect(proportion).toBeLessThan(config.stopTrialProportion + 0.05);
  });
});

describe("adaptSsd", () => {
  it("decreases SSD on successful stop", () => {
    const config = getDifficultyConfig(5);
    const newSsd = adaptSsd(config, 400, true);
    expect(newSsd).toBe(400 - config.ssdStepMs);
  });

  it("increases SSD on failed stop", () => {
    const config = getDifficultyConfig(5);
    const newSsd = adaptSsd(config, 400, false);
    expect(newSsd).toBe(400 + config.ssdStepMs);
  });

  it("clamps to minSsdMs", () => {
    const config = getDifficultyConfig(5);
    const newSsd = adaptSsd(config, config.minSsdMs, true);
    expect(newSsd).toBe(config.minSsdMs);
  });

  it("clamps to maxSsdMs", () => {
    const config = getDifficultyConfig(5);
    const newSsd = adaptSsd(config, config.maxSsdMs, false);
    expect(newSsd).toBe(config.maxSsdMs);
  });
});

describe("calculateSsd", () => {
  it("returns current SSD within bounds", () => {
    const config = getDifficultyConfig(5);
    const ssd = calculateSsd(config, 400);
    expect(ssd).toBe(400);
  });

  it("clamps below minSsdMs", () => {
    const config = getDifficultyConfig(5);
    const ssd = calculateSsd(config, 50);
    expect(ssd).toBe(config.minSsdMs);
  });

  it("clamps above maxSsdMs", () => {
    const config = getDifficultyConfig(5);
    const ssd = calculateSsd(config, 2000);
    expect(ssd).toBe(config.maxSsdMs);
  });
});
