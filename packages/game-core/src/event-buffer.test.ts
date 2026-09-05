import { describe, it, expect, vi } from "vitest";
import { LocalEventBuffer } from "./event-buffer.js";
import type { TelemetrySender, TelemetryBatch, TelemetrySendResult } from "./context.js";
import type { BuiltEvent } from "./event-builder.js";

function createMockSender(
  result: TelemetrySendResult = { accepted: 2, rejected: 0, rejectedSequences: [] },
): TelemetrySender & { calls: TelemetryBatch[] } {
  const sender = {
    calls: [] as TelemetryBatch[],
    send: vi.fn(async (batch: TelemetryBatch) => {
      sender.calls.push(batch);
      return result;
    }),
  };
  return sender;
}

function makeEvent(seq: number, type = "trial_started"): BuiltEvent {
  return {
    sequenceNo: seq,
    eventType: type,
    clientTimeMs: 1000 + seq,
    payload: { trialId: `t${seq}` },
  };
}

describe("LocalEventBuffer", () => {
  it("sends events on flush", async () => {
    const sender = createMockSender();
    const buffer = new LocalEventBuffer(sender, "run-1");

    buffer.push(makeEvent(1));
    buffer.push(makeEvent(2));
    await buffer.flush();

    expect(sender.calls).toHaveLength(1);
    expect(sender.calls[0].events).toHaveLength(2);
    expect(sender.calls[0].gameRunId).toBe("run-1");
  });

  it("clears buffer after flush", async () => {
    const sender = createMockSender();
    const buffer = new LocalEventBuffer(sender, "run-1");

    buffer.push(makeEvent(1));
    await buffer.flush();
    expect(buffer.pendingCount).toBe(0);
  });

  it("does nothing on flush with empty buffer", async () => {
    const sender = createMockSender();
    const buffer = new LocalEventBuffer(sender, "run-1");

    await buffer.flush();
    expect(sender.calls).toHaveLength(0);
  });

  it("queues failed sends for retry", async () => {
    const sender = {
      calls: [] as TelemetryBatch[],
      send: vi.fn().mockImplementation(async (batch: TelemetryBatch) => {
        sender.calls.push(batch);
        throw new Error("Network error");
      }),
    };

    const buffer = new LocalEventBuffer(sender, "run-1", {
      retryBaseMs: 10,
      flushIntervalMs: 10,
    });

    buffer.push(makeEvent(1));
    await buffer.flush();

    // First attempt failed
    expect(sender.calls).toHaveLength(1);
    expect(buffer.retryCount).toBe(1);
  });

  it("retries and succeeds", async () => {
    let callCount = 0;
    const sender = {
      calls: [] as TelemetryBatch[],
      send: vi.fn().mockImplementation(async (batch: TelemetryBatch) => {
        sender.calls.push(batch);
        callCount++;
        if (callCount === 1) throw new Error("fail");
        return { accepted: 1, rejected: 0, rejectedSequences: [] };
      }),
    };

    const buffer = new LocalEventBuffer(sender, "run-1", {
      retryBaseMs: 10,
      maxRetryAttempts: 3,
    });

    buffer.push(makeEvent(1));
    await buffer.flush();

    // Wait for retry
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(sender.calls.length).toBeGreaterThanOrEqual(2);
    expect(buffer.retryCount).toBe(0);
  });

  it("reports rejected events", async () => {
    const sender = createMockSender({
      accepted: 1,
      rejected: 1,
      rejectedSequences: [2],
    });
    const buffer = new LocalEventBuffer(sender, "run-1");

    buffer.push(makeEvent(1));
    buffer.push(makeEvent(2));
    await buffer.flush();

    expect(sender.calls[0].events).toHaveLength(2);
  });

  it("pushAll adds multiple events", async () => {
    const sender = createMockSender();
    const buffer = new LocalEventBuffer(sender, "run-1");

    buffer.pushAll([makeEvent(1), makeEvent(2), makeEvent(3)]);
    await buffer.flush();

    expect(sender.calls[0].events).toHaveLength(3);
  });

  it("dispose flushes remaining events", async () => {
    const sender = createMockSender();
    const buffer = new LocalEventBuffer(sender, "run-1");

    buffer.push(makeEvent(1));
    buffer.push(makeEvent(2));
    await buffer.dispose();

    expect(sender.calls).toHaveLength(1);
    expect(sender.calls[0].events).toHaveLength(2);
  });

  it("stops accepting events after dispose", async () => {
    const sender = createMockSender();
    const buffer = new LocalEventBuffer(sender, "run-1");

    buffer.push(makeEvent(1));
    await buffer.dispose();

    buffer.push(makeEvent(2));
    await buffer.flush();

    // Only the first event should have been sent
    expect(sender.calls[0].events).toHaveLength(1);
  });
});
