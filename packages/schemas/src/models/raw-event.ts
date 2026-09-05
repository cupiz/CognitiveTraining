import { z } from "zod";
import { UUID, ISODateTime, JsonObject } from "../types.js";
import { TelemetryEventType } from "../enums.js";

export const RawEvent = z.object({
  id: UUID,
  gameRunId: UUID,
  sequenceNo: z.number().int().min(1),
  eventType: TelemetryEventType,
  clientTimeMs: z.number().int().min(0),
  payloadJson: JsonObject,
  receivedAt: ISODateTime,
  idempotencyKey: UUID,
});
export type RawEvent = z.infer<typeof RawEvent>;

/** Composite unique: (gameRunId, sequenceNo) — enforced at DB level */
export const RawEventUnique = z.object({
  gameRunId: UUID,
  sequenceNo: z.number().int().min(1),
});
