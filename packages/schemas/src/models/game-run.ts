import { z } from "zod";
import { UUID, ISODateTime, JsonObject } from "../types.js";
import { GameKey, GameRunStatus } from "../enums.js";

export const GameRun = z.object({
  id: UUID,
  sessionId: UUID,
  gameKey: GameKey,
  gameVersion: z.string(),
  configurationJson: JsonObject,
  startedAt: ISODateTime.nullable(),
  endedAt: ISODateTime.nullable(),
  status: GameRunStatus,
});
export type GameRun = z.infer<typeof GameRun>;
