import { describe, it, expect } from "vitest";
import { computeMetrics, checkResponseQuality, checkSessionQuality } from "./scoring.js";
import type { RawEvent } from "./scoring.js";

// ── Helpers ───────────────────────────────────────────────

function makeResponse(
  sequenceNo: number,
  trialId: string,
  correct: boolean,
  rt: number,
): RawEvent {
  return {
    sequenceNo,
    eventType: "response",
    clientTimeMs: 1000 + sequenceNo * 100,
    payload: { trialId, correct, reactionTimeMs: rt },
  };
}

function makeTimeout(sequenceNo: number, trialId: string): RawEvent {
  return {
    sequenceNo,
    eventType: "timeout",
    clientTimeMs: 1000 + sequenceNo * 100,
    payload: { trialId },
  };
}

function makeTrialStarted(sequenceNo: number, trialId: string): RawEvent {
  return {
    sequenceNo,
    eventType: "trial_started",
    clientTimeMs: 1000 + sequenceNo * 100,
    payload: { trialId },
  };
}

function makeQualityFlag(sequenceNo: number, code: string, trialId?: string): RawEvent {
  return {
    sequenceNo,
    eventType: "quality_flag",
    clientTimeMs: 1000 + sequenceNo * 100,
    payload: { code, ...(trialId ? { trialId } : {}) },
  };
}

// ── computeMetrics ────────────────────────────────────────

describe("computeMetrics", () => {
  it("returns zero metrics for empty events", () => {
    const result = computeMetrics([], 5);
    expect(result.accuracy).toBe(0);
    expect(result.medianRtMs).toBe(0);
    expect(result.meanRtMs).toBe(0);
    expect(result.rtVariability).toBe(0);
    expect(result.omissionErrors).toBe(0);
    expect(result.commissionErrors).toBe(0);
    expect(result.validTrialCount).toBe(0);
    expect(result.qualityFlags).toEqual([]);
  });

  it("computes accuracy for all correct responses", () => {
    const events = [
      makeResponse(1, "t1", true, 500),
      makeResponse(2, "t2", true, 600),
      makeResponse(3, "t3", true, 550),
    ];
    const result = computeMetrics(events, 5);
    expect(result.accuracy).toBe(1);
    expect(result.validTrialCount).toBe(3);
    expect(result.commissionErrors).toBe(0);
  });

  it("computes accuracy with incorrect responses", () => {
    const events = [
      makeResponse(1, "t1", true, 500),
      makeResponse(2, "t2", false, 300),
      makeResponse(3, "t3", true, 600),
      makeResponse(4, "t4", true, 550),
    ];
    const result = computeMetrics(events, 5);
    expect(result.accuracy).toBeCloseTo(0.75);
    expect(result.commissionErrors).toBe(1);
  });

  it("counts timeout events as omission errors", () => {
    const events = [
      makeResponse(1, "t1", true, 500),
      makeTimeout(2, "t2"),
      makeTimeout(3, "t3"),
      makeResponse(4, "t4", true, 600),
    ];
    const result = computeMetrics(events, 5);
    expect(result.omissionErrors).toBe(2);
    expect(result.validTrialCount).toBe(4);
    expect(result.accuracy).toBeCloseTo(0.5);
  });

  it("computes median RT correctly", () => {
    const events = [
      makeResponse(1, "t1", true, 100),
      makeResponse(2, "t2", true, 200),
      makeResponse(3, "t3", true, 300),
      makeResponse(4, "t4", true, 400),
      makeResponse(5, "t5", true, 500),
    ];
    const result = computeMetrics(events, 5);
    expect(result.medianRtMs).toBe(300);
    expect(result.meanRtMs).toBe(300);
  });

  it("computes RT variability (standard deviation)", () => {
    const events = [
      makeResponse(1, "t1", true, 100),
      makeResponse(2, "t2", true, 100),
      makeResponse(3, "t3", true, 100),
    ];
    const result = computeMetrics(events, 5);
    expect(result.rtVariability).toBe(0);
  });

  it("filters out impossible RTs from valid RT stats", () => {
    const events = [
      makeResponse(1, "t1", true, 50), // too fast
      makeResponse(2, "t2", true, 500),
      makeResponse(3, "t3", true, 600),
    ];
    const result = computeMetrics(events, 5);
    // Only t2 and t3 are valid RTs
    expect(result.medianRtMs).toBe(550);
    expect(result.qualityFlags.some((f) => f.code === "IMPOSSIBLE_RT")).toBe(true);
  });

  it("detects duplicate responses", () => {
    const events = [
      makeResponse(1, "t1", true, 500),
      makeResponse(2, "t1", false, 600), // duplicate trial ID
    ];
    const result = computeMetrics(events, 5);
    expect(result.qualityFlags.some((f) => f.code === "DUPLICATE_RESPONSE")).toBe(true);
  });

  it("includes existing quality flag events", () => {
    const events = [
      makeTrialStarted(1, "t1"),
      makeQualityFlag(2, "TAB_HIDDEN_DURING_TRIAL", "t1"),
      makeResponse(3, "t1", true, 500),
    ];
    const result = computeMetrics(events, 5);
    expect(result.qualityFlags.some((f) => f.code === "TAB_HIDDEN_DURING_TRIAL")).toBe(true);
  });

  it("handles go/stop game style responses", () => {
    const events: RawEvent[] = [
      { sequenceNo: 1, eventType: "response", clientTimeMs: 1000, payload: { trialId: "t1", responded: true, targetPresent: true, reactionTimeMs: 400 } },
      { sequenceNo: 2, eventType: "response", clientTimeMs: 1100, payload: { trialId: "t2", responded: false, targetPresent: false } },
      { sequenceNo: 3, eventType: "response", clientTimeMs: 1200, payload: { trialId: "t3", responded: true, targetPresent: false, reactionTimeMs: 350 } },
      { sequenceNo: 4, eventType: "response", clientTimeMs: 1300, payload: { trialId: "t4", responded: false, targetPresent: true } },
    ];
    const result = computeMetrics(events, 5);
    expect(result.accuracy).toBeCloseTo(0.5); // 2 correct (t1, t2) out of 4
    expect(result.commissionErrors).toBe(1); // t3: responded to non-target
    expect(result.omissionErrors).toBe(1); // t4: missed target
  });

  it("handles stop signal style responses", () => {
    const events: RawEvent[] = [
      { sequenceNo: 1, eventType: "response", clientTimeMs: 1000, payload: { trialId: "t1", stopped: true, reactionTimeMs: 200 } },
      { sequenceNo: 2, eventType: "response", clientTimeMs: 1100, payload: { trialId: "t2", stopped: false, reactionTimeMs: 250 } },
    ];
    const result = computeMetrics(events, 5);
    expect(result.commissionErrors).toBe(1); // t2: failed to stop
  });

  it("handles quick match style responses", () => {
    const events: RawEvent[] = [
      { sequenceNo: 1, eventType: "response", clientTimeMs: 1000, payload: { trialId: "t1", selectedOption: "A", correctOption: "A", reactionTimeMs: 500 } },
      { sequenceNo: 2, eventType: "response", clientTimeMs: 1100, payload: { trialId: "t2", selectedOption: "B", correctOption: "A", reactionTimeMs: 600 } },
    ];
    const result = computeMetrics(events, 5);
    expect(result.accuracy).toBeCloseTo(0.5);
    expect(result.commissionErrors).toBe(1);
  });
});

// ── checkResponseQuality ──────────────────────────────────

describe("checkResponseQuality", () => {
  it("returns valid for normal response", () => {
    const result = checkResponseQuality("response", { trialId: "t1", reactionTimeMs: 500 }, new Map());
    expect(result.valid).toBe(true);
    expect(result.flags).toEqual([]);
  });

  it("flags too-fast response", () => {
    const result = checkResponseQuality("response", { trialId: "t1", reactionTimeMs: 50 }, new Map());
    expect(result.valid).toBe(false);
    expect(result.flags.some((f) => f.code === "TOO_FAST_RESPONSE")).toBe(true);
  });

  it("flags too-slow response", () => {
    const result = checkResponseQuality("response", { trialId: "t1", reactionTimeMs: 35000 }, new Map());
    expect(result.valid).toBe(false);
    expect(result.flags.some((f) => f.code === "TOO_SLOW_RESPONSE")).toBe(true);
  });

  it("flags duplicate response", () => {
    const previous = new Map([["t1", 1]]);
    const result = checkResponseQuality("response", { trialId: "t1", reactionTimeMs: 500 }, previous);
    expect(result.valid).toBe(false);
    expect(result.flags.some((f) => f.code === "DUPLICATE_RESPONSE")).toBe(true);
  });

  it("ignores non-response events", () => {
    const result = checkResponseQuality("trial_started", { trialId: "t1" }, new Map());
    expect(result.valid).toBe(true);
    expect(result.flags).toEqual([]);
  });
});

// ── checkSessionQuality ───────────────────────────────────

describe("checkSessionQuality", () => {
  it("returns empty flags for normal session", () => {
    const events: RawEvent[] = [
      { sequenceNo: 1, eventType: "trial_started", clientTimeMs: 1000, payload: {} },
      { sequenceNo: 2, eventType: "response", clientTimeMs: 2000, payload: {} },
      { sequenceNo: 3, eventType: "trial_started", clientTimeMs: 3000, payload: {} },
    ];
    const flags = checkSessionQuality(events);
    expect(flags).toEqual([]);
  });

  it("detects clock anomalies", () => {
    const events: RawEvent[] = [
      { sequenceNo: 1, eventType: "trial_started", clientTimeMs: 5000, payload: {} },
      { sequenceNo: 2, eventType: "response", clientTimeMs: 1000, payload: {} }, // went backward
    ];
    const flags = checkSessionQuality(events);
    expect(flags.some((f) => f.code === "DEVICE_CLOCK_ANOMALY")).toBe(true);
  });

  it("detects very short sessions", () => {
    const events: RawEvent[] = [
      { sequenceNo: 1, eventType: "trial_started", clientTimeMs: 1000, payload: {} },
    ];
    const flags = checkSessionQuality(events);
    expect(flags.some((f) => f.code === "VISIBILITY_INTERRUPTION")).toBe(true);
  });

  it("allows normal tolerance for timestamp reordering", () => {
    const events: RawEvent[] = [
      { sequenceNo: 1, eventType: "trial_started", clientTimeMs: 5000, payload: {} },
      { sequenceNo: 2, eventType: "response", clientTimeMs: 4950, payload: {} }, // 50ms backward, within tolerance
    ];
    const flags = checkSessionQuality(events);
    expect(flags.some((f) => f.code === "DEVICE_CLOCK_ANOMALY")).toBe(false);
  });
});
