import { z } from "zod";
import { UUID, JsonObject } from "../types.js";
import { TelemetryEventType, QualityFlagCode } from "../enums.js";

// ── POST /telemetry/batch ─────────────────────────────────

export const TelemetryEvent = z.object({
  sequenceNo: z.number().int().min(1),
  eventType: TelemetryEventType,
  clientTimeMs: z.number().int().min(0),
  payload: JsonObject,
});
export type TelemetryEvent = z.infer<typeof TelemetryEvent>;

export const TelemetryBatchRequest = z.object({
  gameRunId: UUID,
  events: z.array(TelemetryEvent).min(1).max(500),
});
export type TelemetryBatchRequest = z.infer<typeof TelemetryBatchRequest>;

export const TelemetryBatchResponse = z.object({
  data: z.object({
    accepted: z.number().int().min(0),
    rejected: z.number().int().min(0),
    rejectedSequences: z.array(z.number().int()).default([]),
  }),
  requestId: UUID,
});
export type TelemetryBatchResponse = z.infer<typeof TelemetryBatchResponse>;

// ── Common event payloads ─────────────────────────────────

export const TrialStartedPayload = z.object({
  trialId: z.string(),
  gridRows: z.number().int().optional(),
  gridCols: z.number().int().optional(),
  targetCount: z.number().int().optional(),
  exposureMs: z.number().int().optional(),
  seed: z.number().int().optional(),
});
export type TrialStartedPayload = z.infer<typeof TrialStartedPayload>;

export const StimulusHiddenPayload = z.object({
  trialId: z.string(),
});
export type StimulusHiddenPayload = z.infer<typeof StimulusHiddenPayload>;

export const ResponsePayload = z.object({
  trialId: z.string(),
  correct: z.boolean().optional(),
  selectedCells: z.array(z.number().int()).optional(),
  correctCells: z.array(z.number().int()).optional(),
  reactionTimeMs: z.number().min(0).optional(),
  targetPresent: z.boolean().optional(),
  responded: z.boolean().optional(),
  selectedOption: z.string().optional(),
  correctOption: z.string().optional(),
  stopped: z.boolean().optional(),
  stopSignalDelayMs: z.number().min(0).optional(),
  currentRule: z.string().optional(),
  previousRule: z.string().optional(),
  switchTrial: z.boolean().optional(),
});
export type ResponsePayload = z.infer<typeof ResponsePayload>;

export const QualityFlagPayload = z.object({
  code: QualityFlagCode,
});
export type QualityFlagPayload = z.infer<typeof QualityFlagPayload>;

// ── Idempotency header ────────────────────────────────────

export const IdempotencyKeyHeader = z.object({
  "idempotency-key": UUID,
});
export type IdempotencyKeyHeader = z.infer<typeof IdempotencyKeyHeader>;
