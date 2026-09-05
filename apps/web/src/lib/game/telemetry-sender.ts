import type { TelemetrySender, TelemetryBatch, TelemetrySendResult } from "@cog/game-core";

/**
 * Sends telemetry batches to the server via HTTP.
 * The LocalEventBuffer in game-core handles buffering and retry.
 */
export class HttpTelemetrySender implements TelemetrySender {
  async send(batch: TelemetryBatch): Promise<TelemetrySendResult> {
    // Server stores this in a @db.Uuid column and validates it as a UUID —
    // nanoid() would be rejected, so use a real v4 UUID.
    const idempotencyKey = crypto.randomUUID();

    const res = await fetch("/api/telemetry/batch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        gameRunId: batch.gameRunId,
        events: batch.events,
      }),
    });

    if (!res.ok) {
      throw new Error(`Telemetry send failed: ${res.status}`);
    }

    const json = await res.json();
    return json.data ?? { accepted: 0, rejected: 0, rejectedSequences: [] };
  }
}
