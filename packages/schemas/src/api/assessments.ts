import { z } from "zod";
import { UUID, JsonObject } from "../types.js";
import { CognitiveDomain } from "../enums.js";
import { DataEnvelope } from "./envelope.js";
import { Assessment } from "../models/assessment.js";

// ── POST /assessments ─────────────────────────────────────

export const CreateAssessmentRequest = z.object({
  childId: UUID,
  assessmentVersion: z.string().default("mvp-1"),
});
export type CreateAssessmentRequest = z.infer<typeof CreateAssessmentRequest>;

export const AssessmentBlockResponse = z.object({
  blockId: UUID,
  domain: CognitiveDomain,
  gameKey: z.string(),
  gameVersion: z.string(),
  config: JsonObject,
});
export type AssessmentBlockResponse = z.infer<typeof AssessmentBlockResponse>;

export const CreateAssessmentResponse = DataEnvelope(
  z.object({
    assessmentId: UUID,
    blocks: z.array(AssessmentBlockResponse),
  }),
);
export type CreateAssessmentResponse = z.infer<typeof CreateAssessmentResponse>;

// ── POST /assessments/{id}/complete ───────────────────────

export const CompleteAssessmentResponse = DataEnvelope(Assessment);
export type CompleteAssessmentResponse = z.infer<typeof CompleteAssessmentResponse>;

// ── Route params ──────────────────────────────────────────

export const AssessmentIdParam = z.object({
  id: UUID,
});
export type AssessmentIdParam = z.infer<typeof AssessmentIdParam>;
