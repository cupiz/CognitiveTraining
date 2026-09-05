import { z } from "zod";
import { UUID } from "../types.js";
import { ChildStatus } from "../enums.js";
import { DataEnvelope, PaginatedEnvelope } from "./envelope.js";
import { ChildProfile } from "../models/child-profile.js";

// ── POST /children ────────────────────────────────────────

/** Birth years are bounded to [2000, current year] — a future year is a typo. */
const maxBirthYear = new Date().getFullYear();

export const CreateChildRequest = z.object({
  displayName: z.string().min(1).max(100),
  birthYear: z.number().int().min(2000).max(maxBirthYear),
  birthMonth: z.number().int().min(1).max(12),
  locale: z.string().default("en"),
  accessibilityJson: z.record(z.unknown()).default({}),
});
export type CreateChildRequest = z.infer<typeof CreateChildRequest>;

export const CreateChildResponse = DataEnvelope(ChildProfile);
export type CreateChildResponse = z.infer<typeof CreateChildResponse>;

// ── GET /children ─────────────────────────────────────────

export const ListChildrenResponse = PaginatedEnvelope(ChildProfile);
export type ListChildrenResponse = z.infer<typeof ListChildrenResponse>;

// ── GET /children/{childId} ───────────────────────────────

export const GetChildResponse = DataEnvelope(ChildProfile);
export type GetChildResponse = z.infer<typeof GetChildResponse>;

// ── PATCH /children/{childId} ─────────────────────────────

export const UpdateChildRequest = z.object({
  displayName: z.string().min(1).max(100).optional(),
  birthYear: z.number().int().min(2000).max(maxBirthYear).optional(),
  birthMonth: z.number().int().min(1).max(12).optional(),
  locale: z.string().optional(),
  accessibilityJson: z.record(z.unknown()).optional(),
  status: ChildStatus.optional(),
});
export type UpdateChildRequest = z.infer<typeof UpdateChildRequest>;

export const UpdateChildResponse = DataEnvelope(ChildProfile);
export type UpdateChildResponse = z.infer<typeof UpdateChildResponse>;

// ── DELETE /children/{childId} ────────────────────────────

export const DeleteChildResponse = DataEnvelope(z.literal(true));
export type DeleteChildResponse = z.infer<typeof DeleteChildResponse>;

// ── Route params ──────────────────────────────────────────

export const ChildIdParam = z.object({
  childId: UUID,
});
export type ChildIdParam = z.infer<typeof ChildIdParam>;
