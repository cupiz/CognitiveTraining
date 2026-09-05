import { describe, it, expect } from "vitest";
import { TrialTracker } from "./trial-tracker.js";

describe("TrialTracker", () => {
  it("tracks trial lifecycle", () => {
    const tracker = new TrialTracker();

    const trial = tracker.startTrial({ isPractice: false, exposureMs: 1200 });
    expect(tracker.hasActiveTrial).toBe(true);
    expect(trial.trialId).toBe("t001");

    tracker.markStimulusHidden();
    tracker.respond(true, { reactionTimeMs: 500 });
    tracker.endTrial();

    expect(tracker.hasActiveTrial).toBe(false);
    expect(tracker.completedTrials).toHaveLength(1);
    expect(tracker.scoredTrials).toHaveLength(1);
  });

  it("assigns sequential trial IDs", () => {
    const tracker = new TrialTracker();
    const t1 = tracker.startTrial({ isPractice: false, exposureMs: 1000 });
    tracker.endTrial();
    const t2 = tracker.startTrial({ isPractice: false, exposureMs: 1000 });
    tracker.endTrial();

    expect(t1.trialId).toBe("t001");
    expect(t2.trialId).toBe("t002");
  });

  it("separates practice and scored trials", () => {
    const tracker = new TrialTracker();

    tracker.startTrial({ isPractice: true, exposureMs: 1000 });
    tracker.endTrial();
    tracker.startTrial({ isPractice: true, exposureMs: 1000 });
    tracker.endTrial();
    tracker.startTrial({ isPractice: false, exposureMs: 1200 });
    tracker.endTrial();

    expect(tracker.practiceTrialCount).toBe(2);
    expect(tracker.scoredTrialCount).toBe(1);
    expect(tracker.totalTrials).toBe(3);
  });

  it("computes accuracy", () => {
    const tracker = new TrialTracker();

    tracker.startTrial({ isPractice: false, exposureMs: 1000 });
    tracker.respond(true);
    tracker.endTrial();

    tracker.startTrial({ isPractice: false, exposureMs: 1000 });
    tracker.respond(true);
    tracker.endTrial();

    tracker.startTrial({ isPractice: false, exposureMs: 1000 });
    tracker.respond(false);
    tracker.endTrial();

    expect(tracker.accuracy).toBeCloseTo(2 / 3);
  });

  it("counts omission and commission errors", () => {
    const tracker = new TrialTracker();

    // Correct response
    tracker.startTrial({ isPractice: false, exposureMs: 1000 });
    tracker.respond(true);
    tracker.endTrial();

    // Commission error (wrong response)
    tracker.startTrial({ isPractice: false, exposureMs: 1000 });
    tracker.respond(false);
    tracker.endTrial();

    // Omission (no response)
    tracker.startTrial({ isPractice: false, exposureMs: 1000 });
    tracker.endTrial();

    expect(tracker.commissionErrors).toBe(1);
    expect(tracker.omissionErrors).toBe(1);
  });

  it("collects quality flags", () => {
    const tracker = new TrialTracker();

    tracker.startTrial({ isPractice: false, exposureMs: 1000 });
    tracker.flagTrial("TAB_HIDDEN_DURING_TRIAL");
    tracker.endTrial();

    tracker.startTrial({ isPractice: false, exposureMs: 1000 });
    tracker.flagTrial("IMPOSSIBLE_RT");
    tracker.flagTrial("TOO_FAST_RESPONSE");
    tracker.endTrial();

    expect(tracker.allQualityFlags).toEqual([
      "TAB_HIDDEN_DURING_TRIAL",
      "IMPOSSIBLE_RT",
      "TOO_FAST_RESPONSE",
    ]);
  });

  it("computes correct reaction times", () => {
    const tracker = new TrialTracker();

    // Correct trial with RT
    tracker.startTrial({ isPractice: false, exposureMs: 1000 });
    tracker.markStimulusHidden();
    tracker.respond(true, { reactionTimeMs: 500 });
    tracker.endTrial();

    // Incorrect trial — should not be in correctRts
    tracker.startTrial({ isPractice: false, exposureMs: 1000 });
    tracker.markStimulusHidden();
    tracker.respond(false);
    tracker.endTrial();

    // Omission — should not be in correctRts
    tracker.startTrial({ isPractice: false, exposureMs: 1000 });
    tracker.endTrial();

    expect(tracker.correctRts).toHaveLength(1);
    expect(tracker.correctRts[0]).toBeGreaterThanOrEqual(0);
  });
});

describe("TrialTracker static helpers", () => {
  it("median of odd-length array", () => {
    expect(TrialTracker.median([1, 3, 2])).toBe(2);
  });

  it("median of even-length array", () => {
    expect(TrialTracker.median([1, 2, 3, 4])).toBe(2.5);
  });

  it("median of empty array", () => {
    expect(TrialTracker.median([])).toBe(0);
  });

  it("mean", () => {
    expect(TrialTracker.mean([1, 2, 3, 4])).toBe(2.5);
  });

  it("mean of empty array", () => {
    expect(TrialTracker.mean([])).toBe(0);
  });

  it("stdDev", () => {
    const values = [2, 4, 4, 4, 5, 5, 7, 9];
    // Sample stdDev: sqrt(sum((x - mean)^2) / (n-1)) = sqrt(32/7) ≈ 2.138
    expect(TrialTracker.stdDev(values)).toBeCloseTo(2.138, 2);
  });

  it("stdDev with < 2 values returns 0", () => {
    expect(TrialTracker.stdDev([5])).toBe(0);
    expect(TrialTracker.stdDev([])).toBe(0);
  });
});
