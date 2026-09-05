import { describe, it, expect } from "vitest";
import { EventBuilder } from "./event-builder.js";

describe("EventBuilder", () => {
  it("assigns monotonically increasing sequence numbers", () => {
    const eb = new EventBuilder();
    const e1 = eb.trialStarted("t1");
    const e2 = eb.response("t1", { correct: true });
    const e3 = eb.sessionEnded();

    expect(e1.sequenceNo).toBe(1);
    expect(e2.sequenceNo).toBe(2);
    expect(e3.sequenceNo).toBe(3);
  });

  it("resets sequence counter", () => {
    const eb = new EventBuilder();
    eb.trialStarted("t1");
    eb.trialStarted("t2");
    expect(eb.currentSequence).toBe(2);

    eb.reset();
    expect(eb.currentSequence).toBe(0);

    const e = eb.trialStarted("t3");
    expect(e.sequenceNo).toBe(1);
  });

  it("creates trial_started with correct eventType", () => {
    const eb = new EventBuilder();
    const event = eb.trialStarted("t001", { gridRows: 4, targetCount: 5 });
    expect(event.eventType).toBe("trial_started");
    expect(event.payload.trialId).toBe("t001");
    expect(event.payload.gridRows).toBe(4);
    expect(event.payload.targetCount).toBe(5);
  });

  it("creates response with correct payload", () => {
    const eb = new EventBuilder();
    const event = eb.response("t001", {
      correct: true,
      reactionTimeMs: 653,
      selectedCells: [0, 2, 7],
    });
    expect(event.eventType).toBe("response");
    expect(event.payload.trialId).toBe("t001");
    expect(event.payload.correct).toBe(true);
    expect(event.payload.reactionTimeMs).toBe(653);
  });

  it("creates quality_flag with code", () => {
    const eb = new EventBuilder();
    const event = eb.qualityFlag("TAB_HIDDEN_DURING_TRIAL", { trialId: "t1" });
    expect(event.eventType).toBe("quality_flag");
    expect(event.payload.code).toBe("TAB_HIDDEN_DURING_TRIAL");
  });

  it("creates session lifecycle events", () => {
    const eb = new EventBuilder();
    expect(eb.sessionPaused().eventType).toBe("session_paused");
    expect(eb.sessionResumed().eventType).toBe("session_resumed");
    expect(eb.sessionEnded().eventType).toBe("session_ended");
  });

  it("creates custom events", () => {
    const eb = new EventBuilder();
    const event = eb.custom("memory_cell_selected", { cellIndex: 5 });
    expect(event.eventType).toBe("memory_cell_selected");
    expect(event.payload.cellIndex).toBe(5);
  });

  it("sets clientTimeMs to a non-negative number", () => {
    const eb = new EventBuilder();
    const event = eb.trialStarted("t1");
    expect(event.clientTimeMs).toBeGreaterThanOrEqual(0);
    expect(typeof event.clientTimeMs).toBe("number");
  });
});
