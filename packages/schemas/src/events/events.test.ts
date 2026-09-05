import { describe, it, expect } from "vitest";
import {
  GameEvent,
  InputEvent,
  TrialEvent,
  QualityFlagEvent,
} from "./index.js";

// ── GameEvent discriminated union ─────────────────────────

describe("GameEvent", () => {
  it("accepts trial_started event", () => {
    const result = GameEvent.safeParse({
      sequenceNo: 1,
      eventType: "trial_started",
      clientTimeMs: 12000,
      payload: {
        trialId: "t001",
        gridRows: 4,
        gridCols: 4,
        targetCount: 5,
        exposureMs: 1200,
        seed: 12345,
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts stimulus_hidden event", () => {
    const result = GameEvent.safeParse({
      sequenceNo: 2,
      eventType: "stimulus_hidden",
      clientTimeMs: 13210,
      payload: { trialId: "t001" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts response event with memory matrix payload", () => {
    const result = GameEvent.safeParse({
      sequenceNo: 3,
      eventType: "response",
      clientTimeMs: 15580,
      payload: {
        trialId: "t001",
        selectedCells: [0, 2, 7, 9, 15],
        correctCells: [0, 2, 7, 9, 15],
        reactionTimeMs: 2370,
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts response event with target watch payload", () => {
    const result = GameEvent.safeParse({
      sequenceNo: 3,
      eventType: "response",
      clientTimeMs: 15580,
      payload: {
        trialId: "t001",
        targetPresent: true,
        responded: true,
        reactionTimeMs: 450,
        correct: true,
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts response event with stop signal payload", () => {
    const result = GameEvent.safeParse({
      sequenceNo: 3,
      eventType: "response",
      clientTimeMs: 15580,
      payload: {
        trialId: "t001",
        stopped: true,
        stopSignalDelayMs: 300,
        reactionTimeMs: 520,
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts response event with rule switch payload", () => {
    const result = GameEvent.safeParse({
      sequenceNo: 3,
      eventType: "response",
      clientTimeMs: 15580,
      payload: {
        trialId: "t001",
        currentRule: "color",
        previousRule: "shape",
        switchTrial: true,
        correct: false,
        reactionTimeMs: 890,
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts quality_flag event", () => {
    const result = GameEvent.safeParse({
      sequenceNo: 4,
      eventType: "quality_flag",
      clientTimeMs: 16000,
      payload: { code: "TAB_HIDDEN_DURING_TRIAL" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts session_paused event", () => {
    const result = GameEvent.safeParse({
      sequenceNo: 5,
      eventType: "session_paused",
      clientTimeMs: 17000,
      payload: {},
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid eventType", () => {
    const result = GameEvent.safeParse({
      sequenceNo: 1,
      eventType: "unknown_event",
      clientTimeMs: 12000,
      payload: {},
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative sequenceNo", () => {
    const result = GameEvent.safeParse({
      sequenceNo: 0,
      eventType: "trial_started",
      clientTimeMs: 12000,
      payload: { trialId: "t1" },
    });
    expect(result.success).toBe(false);
  });
});

// ── InputEvent ────────────────────────────────────────────

describe("InputEvent", () => {
  it("accepts pointer_down", () => {
    const result = InputEvent.safeParse({
      type: "pointer_down",
      x: 100,
      y: 200,
      tClient: performance.now(),
    });
    expect(result.success).toBe(true);
  });

  it("accepts pointer_up", () => {
    const result = InputEvent.safeParse({
      type: "pointer_up",
      x: 100,
      y: 200,
      tClient: performance.now(),
    });
    expect(result.success).toBe(true);
  });

  it("accepts key_down", () => {
    const result = InputEvent.safeParse({
      type: "key_down",
      key: "Space",
      tClient: performance.now(),
    });
    expect(result.success).toBe(true);
  });

  it("accepts touch", () => {
    const result = InputEvent.safeParse({
      type: "touch",
      x: 50,
      y: 75,
      tClient: performance.now(),
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid input type", () => {
    const result = InputEvent.safeParse({
      type: "swipe",
      x: 0,
      y: 0,
      tClient: 0,
    });
    expect(result.success).toBe(false);
  });
});

// ── Individual event schemas ──────────────────────────────

describe("TrialEvent", () => {
  it("validates trial_id is required", () => {
    const result = TrialEvent.safeParse({
      sequenceNo: 1,
      eventType: "trial_started",
      clientTimeMs: 1000,
      payload: {},
    });
    expect(result.success).toBe(false);
  });
});

describe("QualityFlagEvent", () => {
  it("accepts valid quality flag", () => {
    const result = QualityFlagEvent.safeParse({
      sequenceNo: 1,
      eventType: "quality_flag",
      clientTimeMs: 1000,
      payload: {
        code: "IMPOSSIBLE_RT",
        trialId: "t1",
        details: "RT was 10ms",
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid quality code", () => {
    const result = QualityFlagEvent.safeParse({
      sequenceNo: 1,
      eventType: "quality_flag",
      clientTimeMs: 1000,
      payload: { code: "SOME_NEW_FLAG" },
    });
    expect(result.success).toBe(false);
  });
});
