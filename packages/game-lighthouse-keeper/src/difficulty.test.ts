import { describe, it, expect } from "vitest";
import {
  getDifficultyConfig,
  validateConfig,
  generateSequence,
} from "./difficulty.js";
import { createRng } from "@cog/game-core";

describe("LighthouseKeeper difficulty table", () => {
  it("provides a valid config for every level D1–D10", () => {
    for (let d = 1; d <= 10; d++) {
      const config = getDifficultyConfig(d);
      expect(() => validateConfig(config)).not.toThrow();
      expect(config.seqLength).toBeGreaterThanOrEqual(2);
    }
  });

  it("clamps difficulty outside 1..10", () => {
    expect(getDifficultyConfig(0).seqLength).toBe(getDifficultyConfig(1).seqLength);
    expect(getDifficultyConfig(99).seqLength).toBe(getDifficultyConfig(10).seqLength);
  });

  it("escalates sequence length with difficulty", () => {
    expect(getDifficultyConfig(10).seqLength).toBeGreaterThan(getDifficultyConfig(1).seqLength);
    expect(getDifficultyConfig(10).flashMs).toBeLessThan(getDifficultyConfig(1).flashMs);
  });
});

describe("LighthouseKeeper validation", () => {
  it("rejects seqLength > 8", () => {
    expect(() => validateConfig({ ...getDifficultyConfig(3), seqLength: 9 })).toThrow();
  });

  it("rejects flashMs < 400", () => {
    expect(() => validateConfig({ ...getDifficultyConfig(3), flashMs: 300 })).toThrow();
  });

  it("rejects patienceMs out of range", () => {
    expect(() => validateConfig({ ...getDifficultyConfig(3), patienceMs: 3000 })).toThrow();
  });
});

describe("LighthouseKeeper sequence generator", () => {
  it("returns the requested length with panes 0..3", () => {
    for (const seed of [1, 2, 3, 42]) {
      const seq = generateSequence(getDifficultyConfig(7), createRng(seed));
      expect(seq).toHaveLength(getDifficultyConfig(7).seqLength);
      for (const pane of seq) {
        expect(pane).toBeGreaterThanOrEqual(0);
        expect(pane).toBeLessThanOrEqual(3);
      }
    }
  });

  it("never repeats the same pane twice in a row", () => {
    for (const seed of [1, 2, 3, 4, 5, 42, 99]) {
      const seq = generateSequence(getDifficultyConfig(10), createRng(seed));
      for (let i = 1; i < seq.length; i++) {
        expect(seq[i]).not.toBe(seq[i - 1]);
      }
    }
  });
});