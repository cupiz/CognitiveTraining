import { z } from "zod";
import { TelemetryEventType, QualityFlagCode } from "../enums.js";

// ── Base Event ────────────────────────────────────────────

export const BaseEvent = z.object({
  sequenceNo: z.number().int().min(1),
  eventType: TelemetryEventType,
  clientTimeMs: z.number().int().min(0),
});
export type BaseEvent = z.infer<typeof BaseEvent>;

// ── Trial Event ───────────────────────────────────────────

export const TrialEvent = BaseEvent.extend({
  eventType: z.literal("trial_started"),
  payload: z.object({
    trialId: z.string(),
    gridRows: z.number().int().optional(),
    gridCols: z.number().int().optional(),
    targetCount: z.number().int().optional(),
    exposureMs: z.number().int().optional(),
    seed: z.number().int().optional(),
  }),
});
export type TrialEvent = z.infer<typeof TrialEvent>;

// ── Stimulus Event ────────────────────────────────────────

export const StimulusHiddenEvent = BaseEvent.extend({
  eventType: z.literal("stimulus_hidden"),
  payload: z.object({
    trialId: z.string(),
  }),
});
export type StimulusHiddenEvent = z.infer<typeof StimulusHiddenEvent>;

export const StimulusShownEvent = BaseEvent.extend({
  eventType: z.literal("stimulus_shown"),
  payload: z.object({
    trialId: z.string(),
  }),
});
export type StimulusShownEvent = z.infer<typeof StimulusShownEvent>;

// ── Response Event ────────────────────────────────────────

export const ResponseEvent = BaseEvent.extend({
  eventType: z.literal("response"),
  payload: z.object({
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
  }),
});
export type ResponseEvent = z.infer<typeof ResponseEvent>;

// ── Timeout Event ─────────────────────────────────────────

export const TimeoutEvent = BaseEvent.extend({
  eventType: z.literal("timeout"),
  payload: z.object({
    trialId: z.string(),
  }),
});
export type TimeoutEvent = z.infer<typeof TimeoutEvent>;

// ── Quality Flag Event ────────────────────────────────────

export const QualityFlagEvent = BaseEvent.extend({
  eventType: z.literal("quality_flag"),
  payload: z.object({
    code: QualityFlagCode,
    trialId: z.string().optional(),
    details: z.string().optional(),
  }),
});
export type QualityFlagEvent = z.infer<typeof QualityFlagEvent>;

// ── Session Lifecycle Events ──────────────────────────────

export const SessionPausedEvent = BaseEvent.extend({
  eventType: z.literal("session_paused"),
  payload: z.object({}).default({}),
});
export type SessionPausedEvent = z.infer<typeof SessionPausedEvent>;

export const SessionResumedEvent = BaseEvent.extend({
  eventType: z.literal("session_resumed"),
  payload: z.object({}).default({}),
});
export type SessionResumedEvent = z.infer<typeof SessionResumedEvent>;

export const SessionEndedEvent = BaseEvent.extend({
  eventType: z.literal("session_ended"),
  payload: z.object({}).default({}),
});
export type SessionEndedEvent = z.infer<typeof SessionEndedEvent>;

// ── Discriminated Union ───────────────────────────────────

export const GameEvent = z.discriminatedUnion("eventType", [
  TrialEvent,
  StimulusHiddenEvent,
  StimulusShownEvent,
  ResponseEvent,
  TimeoutEvent,
  QualityFlagEvent,
  SessionPausedEvent,
  SessionResumedEvent,
  SessionEndedEvent,
]);
export type GameEvent = z.infer<typeof GameEvent>;

// ── Input Events (client-side) ────────────────────────────

export const PointerDownEvent = z.object({
  type: z.literal("pointer_down"),
  x: z.number(),
  y: z.number(),
  tClient: z.number(),
});
export type PointerDownEvent = z.infer<typeof PointerDownEvent>;

export const PointerUpEvent = z.object({
  type: z.literal("pointer_up"),
  x: z.number(),
  y: z.number(),
  tClient: z.number(),
});
export type PointerUpEvent = z.infer<typeof PointerUpEvent>;

export const KeyDownEvent = z.object({
  type: z.literal("key_down"),
  key: z.string(),
  tClient: z.number(),
});
export type KeyDownEvent = z.infer<typeof KeyDownEvent>;

export const TouchEvent = z.object({
  type: z.literal("touch"),
  x: z.number(),
  y: z.number(),
  tClient: z.number(),
});
export type TouchEvent = z.infer<typeof TouchEvent>;

export const InputEvent = z.discriminatedUnion("type", [
  PointerDownEvent,
  PointerUpEvent,
  KeyDownEvent,
  TouchEvent,
]);
export type InputEvent = z.infer<typeof InputEvent>;
