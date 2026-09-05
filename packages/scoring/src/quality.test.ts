import { describe, it, expect } from "vitest";
import { checkEventQuality, checkBatchQuality, checkSessionQualityDetailed } from "./quality.js";
import type { RawEvent } from "./scoring.js";

function makeEvent(overrides: Partial<RawEvent> = {}): RawEvent {
  return {
    sequenceNo: 1,
    eventType: "response",
    clientTimeMs: 1000,
    payload: { trialId: "t1", correct: true, reactionTimeMs: 500 },
    ...overrides,
  };
}

describe("checkEventQuality", () => {
  it("returns no flags for valid event", () => {
    const event = makeEvent();
    const flags = checkEventQuality(event, []);
    expect(flags.length).toBe(0);
  });

  it("detects impossible RT (too fast)", () => {
    const event = makeEvent({
      payload: { trialId: "t1", correct: true, reactionTimeMs: 50 },
    });
    const flags = checkEventQuality(event, []);
    expect(flags.some((f) => f.code === "IMPOSSIBLE_RT")).toBe(true);
  });

  it("detects impossible RT (too slow)", () => {
    const event = makeEvent({
      payload: { trialId: "t1", correct: true, reactionTimeMs: 35000 },
    });
    const flags = checkEventQuality(event, []);
    expect(flags.some((f) => f.code === "IMPOSSIBLE_RT")).toBe(true);
  });

  it("detects duplicate response", () => {
    const prev = makeEvent({ payload: { trialId: "t1", correct: true, reactionTimeMs: 500 } });
    const dup = makeEvent({ payload: { trialId: "t1", correct: true, reactionTimeMs: 600 } });
    const flags = checkEventQuality(dup, [prev]);
    expect(flags.some((f) => f.code === "DUPLICATE_RESPONSE")).toBe(true);
  });

  it("detects clock anomaly", () => {
    const prev = makeEvent({ clientTimeMs: 2000 });
    const event = makeEvent({ clientTimeMs: 1000 }); // Going backward
    const flags = checkEventQuality(event, [prev]);
    expect(flags.some((f) => f.code === "DEVICE_CLOCK_ANOMALY")).toBe(true);
  });

  it("allows 100ms tolerance for clock", () => {
    const prev = makeEvent({ clientTimeMs: 2000 });
    const event = makeEvent({ clientTimeMs: 1950 }); // 50ms back - OK
    const flags = checkEventQuality(event, [prev]);
    expect(flags.some((f) => f.code === "DEVICE_CLOCK_ANOMALY")).toBe(false);
  });
});

describe("checkBatchQuality", () => {
  it("returns excellent score for clean data", () => {
    const events = Array.from({ length: 20 }, (_, i) =>
      makeEvent({
        sequenceNo: i + 1,
        clientTimeMs: 1000 + i * 1000,
        payload: { trialId: `t${i + 1}`, correct: true, reactionTimeMs: 500 + Math.random() * 200 },
      }),
    );
    const report = checkBatchQuality(events);
    expect(report.level).toBe("excellent");
    expect(report.score).toBeGreaterThanOrEqual(0.9);
  });

  it("detects multiple quality issues", () => {
    const events = [
      makeEvent({ sequenceNo: 1, payload: { trialId: "t1", correct: true, reactionTimeMs: 50 } }), // Too fast
      makeEvent({ sequenceNo: 2, payload: { trialId: "t1", correct: true, reactionTimeMs: 600 } }), // Duplicate
      makeEvent({ sequenceNo: 3, clientTimeMs: 500, payload: { trialId: "t2", correct: true, reactionTimeMs: 500 } }), // Clock anomaly
    ];
    const report = checkBatchQuality(events);
    expect(report.flagCount).toBeGreaterThan(0);
    expect(report.score).toBeLessThan(1);
  });

  it("returns recommendations based on flags", () => {
    const events = [
      makeEvent({ payload: { trialId: "t1", correct: true, reactionTimeMs: 50 } }),
    ];
    const report = checkBatchQuality(events);
    expect(report.recommendations.length).toBeGreaterThan(0);
  });

  it("categorizes flags correctly", () => {
    const events = [
      makeEvent({ payload: { trialId: "t1", correct: true, reactionTimeMs: 50 } }),
      makeEvent({ payload: { trialId: "t1", correct: true, reactionTimeMs: 600 } }),
    ];
    const report = checkBatchQuality(events);
    expect(Object.keys(report.flagsByCategory).length).toBeGreaterThan(0);
  });

  it("handles empty events", () => {
    const report = checkBatchQuality([]);
    expect(report.score).toBe(0);
    expect(report.flagCount).toBe(0);
  });
});

describe("checkSessionQualityDetailed", () => {
  it("returns session metrics", () => {
    const events = Array.from({ length: 10 }, (_, i) =>
      makeEvent({
        sequenceNo: i + 1,
        clientTimeMs: 1000 + i * 1000,
      }),
    );
    const check = checkSessionQualityDetailed(events);
    expect(check.durationMs).toBe(9000);
    expect(check.responseCount).toBe(10);
    expect(check.responseRate).toBeGreaterThan(0);
  });

  it("detects short session", () => {
    const events = [
      makeEvent({ sequenceNo: 1, clientTimeMs: 1000 }),
      makeEvent({ sequenceNo: 2, clientTimeMs: 2000 }),
    ];
    const check = checkSessionQualityDetailed(events);
    expect(check.flags.some((f) => f.code === "SHORT_SESSION")).toBe(true);
  });

  it("detects suspicious response rate", () => {
    const events = Array.from({ length: 100 }, (_, i) =>
      makeEvent({
        sequenceNo: i + 1,
        clientTimeMs: 1000 + i * 100, // 10 responses/sec
      }),
    );
    const check = checkSessionQualityDetailed(events);
    expect(check.flags.some((f) => f.code === "SUSPICIOUS_RESPONSE_RATE")).toBe(true);
  });

  it("handles empty events", () => {
    const check = checkSessionQualityDetailed([]);
    expect(check.durationMs).toBe(0);
    expect(check.responseCount).toBe(0);
  });
});
