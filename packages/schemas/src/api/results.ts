import { z } from "zod";
import { ISODateTime, PerformanceIndex } from "../types.js";
import { CognitiveDomain } from "../enums.js";
import { DataEnvelope, PaginatedEnvelope } from "./envelope.js";
import { TrainingSession } from "../models/training-session.js";
import { Report } from "../models/report.js";

// ── GET /children/{childId}/performance ───────────────────

export const PerformanceQuery = z.object({
  from: ISODateTime.optional(),
  to: ISODateTime.optional(),
});
export type PerformanceQuery = z.infer<typeof PerformanceQuery>;

export const DomainPerformanceSummary = z.object({
  domain: CognitiveDomain,
  score: PerformanceIndex,
  confidence: z.number().min(0).max(1),
  trend: z.number(),
  algorithmVersion: z.string(),
});
export type DomainPerformanceSummary = z.infer<typeof DomainPerformanceSummary>;

export const PerformanceResponse = DataEnvelope(
  z.object({
    domains: z.array(DomainPerformanceSummary),
  }),
);
export type PerformanceResponse = z.infer<typeof PerformanceResponse>;

// ── GET /children/{childId}/sessions ──────────────────────

export const SessionsQuery = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});
export type SessionsQuery = z.infer<typeof SessionsQuery>;

export const SessionsResponse = PaginatedEnvelope(TrainingSession);
export type SessionsResponse = z.infer<typeof SessionsResponse>;

// ── GET /children/{childId}/reports ───────────────────────

export const ReportsQuery = z.object({
  limit: z.number().int().min(1).max(50).default(10),
  cursor: z.string().optional(),
});
export type ReportsQuery = z.infer<typeof ReportsQuery>;

export const ReportsResponse = PaginatedEnvelope(Report);
export type ReportsResponse = z.infer<typeof ReportsResponse>;
