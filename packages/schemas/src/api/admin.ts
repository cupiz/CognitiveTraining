import { z } from "zod";
import { ISODateTime } from "../types.js";
import { GameKey, CognitiveDomain } from "../enums.js";
import { DataEnvelope, PaginatedEnvelope } from "./envelope.js";

// ── GET /admin/games ──────────────────────────────────────

export const GameInfo = z.object({
  key: GameKey,
  version: z.string(),
  domain: CognitiveDomain,
  enabled: z.boolean(),
});
export type GameInfo = z.infer<typeof GameInfo>;

export const AdminGamesResponse = PaginatedEnvelope(GameInfo);
export type AdminGamesResponse = z.infer<typeof AdminGamesResponse>;

// ── GET /admin/game-runs ──────────────────────────────────

export const AdminGameRunQuery = z.object({
  gameKey: GameKey.optional(),
  from: ISODateTime.optional(),
  to: ISODateTime.optional(),
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});
export type AdminGameRunQuery = z.infer<typeof AdminGameRunQuery>;

// ── GET /admin/metric-quality ─────────────────────────────

export const MetricQualityEntry = z.object({
  gameKey: GameKey,
  gameVersion: z.string(),
  totalRuns: z.number().int(),
  validRuns: z.number().int(),
  flaggedRuns: z.number().int(),
  medianAccuracy: z.number(),
  medianRtMs: z.number(),
});
export type MetricQualityEntry = z.infer<typeof MetricQualityEntry>;

export const AdminMetricQualityResponse = DataEnvelope(
  z.array(MetricQualityEntry),
);
export type AdminMetricQualityResponse = z.infer<typeof AdminMetricQualityResponse>;

// ── GET /admin/algorithm-versions ─────────────────────────

export const AlgorithmVersionEntry = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string(),
  deployedAt: ISODateTime,
  deprecatedAt: ISODateTime.nullable(),
});
export type AlgorithmVersionEntry = z.infer<typeof AlgorithmVersionEntry>;

export const AdminAlgorithmVersionsResponse = DataEnvelope(
  z.array(AlgorithmVersionEntry),
);
export type AdminAlgorithmVersionsResponse = z.infer<typeof AdminAlgorithmVersionsResponse>;
