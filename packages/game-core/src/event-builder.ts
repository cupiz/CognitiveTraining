import type { QualityFlagCode } from "@cog/schemas";
import { now } from "./timing.js";

/**
 * Raw telemetry event ready for buffering.
 * Sequence number is assigned by EventBuilder.
 */
export interface BuiltEvent {
  sequenceNo: number;
  eventType: string;
  clientTimeMs: number;
  payload: Record<string, unknown>;
}

/**
 * Builds telemetry events with monotonic sequence numbers.
 * Never assigns sequence numbers manually — use this builder.
 */
export class EventBuilder {
  private sequence = 0;

  /** Get the current sequence counter (for inspection) */
  get currentSequence(): number {
    return this.sequence;
  }

  /** Reset sequence (for new game run) */
  reset(): void {
    this.sequence = 0;
  }

  /** Build a trial_started event */
  trialStarted(trialId: string, params: Record<string, unknown> = {}): BuiltEvent {
    return this.build("trial_started", {
      trialId,
      ...params,
    });
  }

  /** Build a stimulus_hidden event */
  stimulusHidden(trialId: string): BuiltEvent {
    return this.build("stimulus_hidden", { trialId });
  }

  /** Build a stimulus_shown event */
  stimulusShown(trialId: string): BuiltEvent {
    return this.build("stimulus_shown", { trialId });
  }

  /** Build a response event */
  response(trialId: string, params: Record<string, unknown> = {}): BuiltEvent {
    return this.build("response", {
      trialId,
      ...params,
    });
  }

  /** Build a timeout event */
  timeout(trialId: string): BuiltEvent {
    return this.build("timeout", { trialId });
  }

  /** Build a quality_flag event */
  qualityFlag(code: QualityFlagCode, params: Record<string, unknown> = {}): BuiltEvent {
    return this.build("quality_flag", {
      code,
      ...params,
    });
  }

  /** Build a session_paused event */
  sessionPaused(): BuiltEvent {
    return this.build("session_paused", {});
  }

  /** Build a session_resumed event */
  sessionResumed(): BuiltEvent {
    return this.build("session_resumed", {});
  }

  /** Build a session_ended event */
  sessionEnded(): BuiltEvent {
    return this.build("session_ended", {});
  }

  /** Build a custom event (for game-specific events) */
  custom(eventType: string, payload: Record<string, unknown>): BuiltEvent {
    return this.build(eventType, payload);
  }

  // ── Internal ──────────────────────────────────────────

  private build(eventType: string, payload: Record<string, unknown>): BuiltEvent {
    this.sequence++;
    return {
      sequenceNo: this.sequence,
      eventType,
      clientTimeMs: Math.round(now()),
      payload,
    };
  }
}
