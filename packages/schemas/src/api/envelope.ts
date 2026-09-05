import { z } from "zod";
import { UUID } from "../types.js";

// ── Success Envelope ──────────────────────────────────────

export function DataEnvelope<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    data: dataSchema,
    requestId: UUID,
  });
}

export type DataEnvelope<T> = {
  data: T;
  requestId: string;
};

// ── Error Envelope ────────────────────────────────────────

export const ErrorCode = z.enum([
  "VALIDATION_ERROR",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "RATE_LIMITED",
  "INTERNAL_ERROR",
  "SERVICE_UNAVAILABLE",
]);
export type ErrorCode = z.infer<typeof ErrorCode>;

export const ErrorDetail = z.object({
  field: z.string().optional(),
  message: z.string(),
  code: z.string().optional(),
});
export type ErrorDetail = z.infer<typeof ErrorDetail>;

export const ErrorBody = z.object({
  code: ErrorCode,
  message: z.string(),
  details: z.array(ErrorDetail).default([]),
});
export type ErrorBody = z.infer<typeof ErrorBody>;

export const ErrorEnvelope = z.object({
  error: ErrorBody,
  requestId: UUID,
});
export type ErrorEnvelope = z.infer<typeof ErrorEnvelope>;

// ── Paginated Envelope ────────────────────────────────────

export function PaginatedEnvelope<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    total: z.number().int().min(0),
    cursor: z.string().nullable().optional(),
    requestId: UUID,
  });
}

export type PaginatedEnvelope<T> = {
  data: T[];
  total: number;
  cursor?: string | null;
  requestId: string;
};
