import type { GameKey } from "@cog/schemas";
import type { DeviceContext } from "./device.js";

/**
 * Phase of a game session.
 */
export type GamePhase =
  | "idle"
  | "practice"
  | "countdown"
  | "playing"
  | "paused"
  | "finished";

/**
 * Immutable context provided to a game on start.
 * Contains all IDs and configuration the game needs.
 */
export interface GameContext {
  /** Training session ID */
  sessionId: string;
  /** Game run ID (unique per run within a session) */
  gameRunId: string;
  /** Which game family this is */
  gameKey: GameKey;
  /** Semantic version of the game implementation */
  gameVersion: string;
  /** Current difficulty level (1–10) */
  difficulty: number;
  /** Deterministic seed (use Date.now() in prod, fixed seed for tests) */
  seed: number;
  /** Whether this is a practice (non-scored) run */
  isPractice: boolean;
  /** Max number of trials (undefined = game decides) */
  maxTrials?: number;
  /** Number of practice trials before scored trials begin */
  practiceTrials: number;
  /** Device and browser context */
  deviceContext: DeviceContext;
  /** Game-specific extra configuration */
  extra: Record<string, unknown>;
  /** Start timestamp (performance.now()) */
  startedAt: number;
  /** Callback to send telemetry batch to server */
  sendTelemetry: TelemetrySender;
}

/**
 * Abstraction for sending telemetry to the server.
 * The game core calls this; the shell implements the actual HTTP call.
 */
export interface TelemetrySender {
  /**
   * Send a batch of events. Returns a promise that resolves when accepted.
   * The implementation should buffer locally if offline and retry.
   */
  send(events: TelemetryBatch): Promise<TelemetrySendResult>;
}

export interface TelemetryBatch {
  gameRunId: string;
  events: RawTelemetryEvent[];
}

export interface RawTelemetryEvent {
  sequenceNo: number;
  eventType: string;
  clientTimeMs: number;
  payload: Record<string, unknown>;
}

export interface TelemetrySendResult {
  accepted: number;
  rejected: number;
  rejectedSequences: number[];
}
