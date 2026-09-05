import { describe, it, expect } from "vitest";
import { computePerformance } from "./performance.js";
import type { PerformanceInput } from "./types.js";

describe("computePerformance", () => {
  function makeInput(overrides: Partial<PerformanceInput> = {}): PerformanceInput {
    return {
      accuracy: 0.8,
      medianRtMs: 1000,
      meanRtMs: 1100,
      rtVariability: 200,
      omissionErrors: 2,
      commissionErrors: 1,
      validTrialCount: 20,
      qualityFlags: [],
      ...overrides,
    };
  }

  it("returns usable score for valid input", () => {
    const result = computePerformance(makeInput());
    expect(result.usable).toBe(true);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(1);
    expect(result.accuracyComponent).toBeGreaterThan(0);
    expect(result.speedComponent).toBeGreaterThan(0);
    expect(result.consistencyComponent).toBeGreaterThan(0);
  });

  it("returns unusable for insufficient trials", () => {
    const result = computePerformance(makeInput({ validTrialCount: 2 }));
    expect(result.usable).toBe(false);
    expect(result.score).toBe(0);
    expect(result.unusableReason).toContain("Insufficient trials");
  });

  it("returns unusable for too many quality flags", () => {
    const flags = Array(6).fill({ code: "IMPOSSIBLE_RT" });
    const result = computePerformance(makeInput({ qualityFlags: flags, validTrialCount: 10 }));
    expect(result.usable).toBe(false);
    expect(result.unusableReason).toContain("Too many quality flags");
  });

  it("handles perfect accuracy", () => {
    const result = computePerformance(makeInput({ accuracy: 1.0 }));
    expect(result.accuracyComponent).toBe(1.0);
  });

  it("handles zero accuracy", () => {
    const result = computePerformance(makeInput({ accuracy: 0.0 }));
    expect(result.accuracyComponent).toBe(0);
  });

  it("handles fast RT (high speed score)", () => {
    const result = computePerformance(makeInput({ medianRtMs: 300 }));
    expect(result.speedComponent).toBeGreaterThan(0.8);
  });

  it("handles slow RT (low speed score)", () => {
    const result = computePerformance(makeInput({ medianRtMs: 4000 }));
    expect(result.speedComponent).toBeLessThan(0.3);
  });

  it("handles consistent RT (high consistency)", () => {
    const result = computePerformance(makeInput({ rtVariability: 50, meanRtMs: 1000 }));
    expect(result.consistencyComponent).toBeGreaterThan(0.9);
  });

  it("handles variable RT (low consistency)", () => {
    const result = computePerformance(makeInput({ rtVariability: 800, meanRtMs: 1000 }));
    expect(result.consistencyComponent).toBeLessThan(0.3);
  });

  it("clamps score to 0–1", () => {
    const result = computePerformance(makeInput({ accuracy: 1.5, medianRtMs: -100 }));
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it("weights accuracy most heavily", () => {
    const highAcc = computePerformance(makeInput({ accuracy: 1.0, medianRtMs: 3000 }));
    const lowAcc = computePerformance(makeInput({ accuracy: 0.3, medianRtMs: 500 }));
    // High accuracy should score higher despite slower RT
    expect(highAcc.score).toBeGreaterThan(lowAcc.score);
  });
});
