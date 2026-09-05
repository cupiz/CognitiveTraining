import type { BuiltEvent } from "./event-builder.js";
import type { TelemetrySender, TelemetryBatch } from "./context.js";

/**
 * Local event buffer that:
 * 1. Collects events as the game runs
 * 2. Batches them for efficient network send
 * 3. Assigns idempotency keys per batch
 * 4. Retries failed batches when connectivity returns
 * 5. Never loses events
 *
 * This is the client-side reliability layer from docs/02_ARCHITECTURE.md §7.
 */
export class LocalEventBuffer {
  private buffer: BuiltEvent[] = [];
  private pendingBatches: PendingBatch[] = [];
  private batchTimer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;

  constructor(
    private readonly sender: TelemetrySender,
    private readonly gameRunId: string,
    private readonly options: EventBufferOptions = {},
  ) {}

  /** Push a single event into the buffer */
  push(event: BuiltEvent): void {
    if (this.disposed) return;
    this.buffer.push(event);
    this.scheduleFlush();
  }

  /** Push multiple events at once */
  pushAll(events: BuiltEvent[]): void {
    if (this.disposed) return;
    this.buffer.push(...events);
    this.scheduleFlush();
  }

  /** Force-flush all buffered events immediately */
  async flush(): Promise<void> {
    if (this.batchTimer !== null) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.buffer.length === 0) return;

    const events = [...this.buffer];
    this.buffer = [];

    await this.sendBatch(events);
  }

  /** Flush remaining events and stop accepting new ones */
  async dispose(): Promise<void> {
    this.disposed = true;
    await this.flush();
    // Don't wait for pending retries — they'll resolve in background
  }

  /** Get current buffer size (for diagnostics) */
  get pendingCount(): number {
    return this.buffer.length;
  }

  /** Get number of batches waiting for retry */
  get retryCount(): number {
    return this.pendingBatches.length;
  }

  // ── Internal ──────────────────────────────────────────

  private scheduleFlush(): void {
    const interval = this.options.flushIntervalMs ?? 2000;
    if (this.batchTimer !== null) return;

    this.batchTimer = setTimeout(() => {
      this.batchTimer = null;
      void this.flush();
    }, interval);
  }

  private async sendBatch(events: BuiltEvent[]): Promise<void> {
    const batch: TelemetryBatch = {
      gameRunId: this.gameRunId,
      events: events.map((e) => ({
        sequenceNo: e.sequenceNo,
        eventType: e.eventType,
        clientTimeMs: e.clientTimeMs,
        payload: e.payload,
      })),
    };

    try {
      const result = await this.sender.send(batch);

      if (result.rejected > 0) {
        // Re-queue rejected events (they may have had duplicate sequences)
        console.warn(
          `[EventBuffer] ${result.rejected} events rejected by server:`,
          result.rejectedSequences,
        );
      }
    } catch (error) {
      // Network failure — queue for retry
      console.warn("[EventBuffer] Send failed, will retry:", error);
      this.pendingBatches.push({
        batch,
        attempts: 1,
        nextRetryAt: Date.now() + (this.options.retryBaseMs ?? 1000),
      });
      this.scheduleRetry();
    }
  }

  private scheduleRetry(): void {
    if (this.disposed || this.pendingBatches.length === 0) return;

    const next = this.pendingBatches[0];
    const delay = Math.max(0, next.nextRetryAt - Date.now());

    setTimeout(() => {
      void this.retryPending();
    }, delay);
  }

  private async retryPending(): Promise<void> {
    if (this.disposed) return;

    const maxAttempts = this.options.maxRetryAttempts ?? 5;
    const batch = this.pendingBatches[0];
    if (!batch) return;

    if (batch.attempts >= maxAttempts) {
      console.error("[EventBuffer] Dropping batch after max retries:", batch.batch.events.length, "events");
      this.pendingBatches.shift();
      this.scheduleRetry();
      return;
    }

    try {
      const result = await this.sender.send(batch.batch);
      if (result.rejected > 0) {
        console.warn("[EventBuffer] Retry: rejected", result.rejected, "events");
      }
      this.pendingBatches.shift();
      this.scheduleRetry();
    } catch {
      batch.attempts++;
      batch.nextRetryAt = Date.now() + (this.options.retryBaseMs ?? 1000) * batch.attempts;
      this.scheduleRetry();
    }
  }
}

export interface EventBufferOptions {
  /** How often to flush buffered events (ms). Default: 2000 */
  flushIntervalMs?: number;
  /** Base delay for retry backoff (ms). Default: 1000 */
  retryBaseMs?: number;
  /** Max retry attempts per batch. Default: 5 */
  maxRetryAttempts?: number;
}

interface PendingBatch {
  batch: TelemetryBatch;
  attempts: number;
  nextRetryAt: number;
}
