// ── Primitives ────────────────────────────────────────────
export { createRng, shuffle, sample, pick } from "./seed.js";
export { now, elapsed, toMs } from "./timing.js";
export {
  captureDeviceContext,
  detectInputModality,
  type DeviceContext,
} from "./device.js";

// ── Context ───────────────────────────────────────────────
export {
  type GamePhase,
  type GameContext,
  type TelemetrySender,
  type TelemetryBatch,
  type RawTelemetryEvent,
  type TelemetrySendResult,
} from "./context.js";

// ── Event Builder ─────────────────────────────────────────
export { EventBuilder, type BuiltEvent } from "./event-builder.js";

// ── Event Buffer ──────────────────────────────────────────
export { LocalEventBuffer, type EventBufferOptions } from "./event-buffer.js";

// ── Game Contract ─────────────────────────────────────────
export { type CognitiveGame, type GameSummary, type TrialClock } from "./game.js";

// ── Game Runner ───────────────────────────────────────────
export { GameRunner } from "./runner.js";

// ── Trial Tracking ────────────────────────────────────────
export { TrialTracker, type TrialRecord } from "./trial-tracker.js";

// ── Summary helpers ───────────────────────────────────────
export { median, mean, stdDev, buildSummary, type BuildSummaryOptions } from "./summary.js";

// ── Base Game ─────────────────────────────────────────────
export { BaseGame } from "./base-game.js";
