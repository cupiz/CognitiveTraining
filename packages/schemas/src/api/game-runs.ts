import { z } from "zod";
import { UUID, Difficulty } from "../types.js";
import { GameKey } from "../enums.js";
import { DataEnvelope } from "./envelope.js";
import { GameRun } from "../models/game-run.js";

// ── POST /game-runs ───────────────────────────────────────

export const CreateGameRunRequest = z.object({
  sessionId: UUID,
  gameKey: GameKey,
  gameVersion: z.string(),
  configuration: z.object({
    difficulty: Difficulty,
  }),
});
export type CreateGameRunRequest = z.infer<typeof CreateGameRunRequest>;

export const CreateGameRunResponse = DataEnvelope(GameRun);
export type CreateGameRunResponse = z.infer<typeof CreateGameRunResponse>;

// ── POST /game-runs/{id}/start ────────────────────────────

export const StartGameRunResponse = DataEnvelope(GameRun);
export type StartGameRunResponse = z.infer<typeof StartGameRunResponse>;

// ── POST /game-runs/{id}/finish ───────────────────────────

export const FinishGameRunRequest = z.object({
  status: z.enum(["completed", "interrupted"]),
});
export type FinishGameRunRequest = z.infer<typeof FinishGameRunRequest>;

export const FinishGameRunResponse = DataEnvelope(GameRun);
export type FinishGameRunResponse = z.infer<typeof FinishGameRunResponse>;

// ── Route params ──────────────────────────────────────────

export const GameRunIdParam = z.object({
  id: UUID,
});
export type GameRunIdParam = z.infer<typeof GameRunIdParam>;
