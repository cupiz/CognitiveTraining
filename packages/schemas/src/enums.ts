import { z } from "zod";

// ── Accounts ──────────────────────────────────────────────

export const UserRole = z.enum(["parent", "admin", "researcher"]);
export type UserRole = z.infer<typeof UserRole>;

// ── Child Profile ─────────────────────────────────────────

export const ChildStatus = z.enum(["active", "archived", "deleted"]);
export type ChildStatus = z.infer<typeof ChildStatus>;

// ── Consent ───────────────────────────────────────────────

export const ConsentType = z.enum(["training", "assessment", "analytics", "research"]);
export type ConsentType = z.infer<typeof ConsentType>;

export const ConsentSource = z.enum(["parent_portal", "api", "migration"]);
export type ConsentSource = z.infer<typeof ConsentSource>;

// ── Cognitive Domains ─────────────────────────────────────

export const CognitiveDomain = z.enum([
  "working_memory",
  "sustained_attention",
  "processing_speed",
  "inhibitory_control",
  "cognitive_flexibility",
  "visual_spatial",
]);
export type CognitiveDomain = z.infer<typeof CognitiveDomain>;

// ── Assessment ────────────────────────────────────────────

export const AssessmentStatus = z.enum([
  "pending",
  "in_progress",
  "completed",
  "interrupted",
  "abandoned",
]);
export type AssessmentStatus = z.infer<typeof AssessmentStatus>;

// ── Training ──────────────────────────────────────────────

export const TrainingSessionStatus = z.enum([
  "pending",
  "in_progress",
  "completed",
  "interrupted",
  "abandoned",
]);
export type TrainingSessionStatus = z.infer<typeof TrainingSessionStatus>;

// ── Game Run ──────────────────────────────────────────────

export const GameKey = z.enum([
  "memory_matrix",
  "target_watch",
  "quick_match",
  "stop_signal",
  "rule_switch",
  "spice_stall",
  "red_light",
  "courier_map",
  "lighthouse_keeper",
  "sushi_express",
  "crystal_palace",
]);
export type GameKey = z.infer<typeof GameKey>;

export const GameRunStatus = z.enum([
  "pending",
  "in_progress",
  "completed",
  "interrupted",
]);
export type GameRunStatus = z.infer<typeof GameRunStatus>;

// ── Telemetry ─────────────────────────────────────────────

export const TelemetryEventType = z.enum([
  "trial_started",
  "stimulus_hidden",
  "stimulus_shown",
  "response",
  "timeout",
  "quality_flag",
  "session_paused",
  "session_resumed",
  "session_ended",
]);
export type TelemetryEventType = z.infer<typeof TelemetryEventType>;

export const QualityFlagCode = z.enum([
  "TAB_HIDDEN_DURING_TRIAL",
  "IMPOSSIBLE_RT",
  "DUPLICATE_RESPONSE",
  "NETWORK_RECOVERED",
  "DEVICE_CLOCK_ANOMALY",
  "VISIBILITY_INTERRUPTION",
  "TOO_FAST_RESPONSE",
  "TOO_SLOW_RESPONSE",
]);
export type QualityFlagCode = z.infer<typeof QualityFlagCode>;

// ── Report ────────────────────────────────────────────────

export const ReportStatus = z.enum(["generating", "ready", "failed"]);
export type ReportStatus = z.infer<typeof ReportStatus>;
