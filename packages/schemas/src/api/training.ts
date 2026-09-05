import { z } from "zod";
import { UUID, Difficulty } from "../types.js";
import { GameKey } from "../enums.js";
import { DataEnvelope } from "./envelope.js";
import { TrainingSession } from "../models/training-session.js";

// ── POST /training/sessions ───────────────────────────────

export const CreateSessionRequest = z.object({
  childId: UUID,
});
export type CreateSessionRequest = z.infer<typeof CreateSessionRequest>;

export const TrainingItem = z.object({
  gameKey: GameKey,
  gameVersion: z.string(),
  difficulty: Difficulty,
});
export type TrainingItem = z.infer<typeof TrainingItem>;

export const CreateSessionResponse = DataEnvelope(
  z.object({
    sessionId: UUID,
    plannerVersion: z.string(),
    items: z.array(TrainingItem),
  }),
);
export type CreateSessionResponse = z.infer<typeof CreateSessionResponse>;

// ── POST /training/sessions/{id}/complete ─────────────────

export const CompleteSessionResponse = DataEnvelope(TrainingSession);
export type CompleteSessionResponse = z.infer<typeof CompleteSessionResponse>;

// ── Route params ──────────────────────────────────────────

export const SessionIdParam = z.object({
  id: UUID,
});
export type SessionIdParam = z.infer<typeof SessionIdParam>;
