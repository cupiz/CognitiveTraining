import { z } from "zod";
import { UUID } from "../types.js";
import { ConsentType } from "../enums.js";
import { DataEnvelope } from "./envelope.js";
import { ConsentRecord } from "../models/consent-record.js";

// ── POST /children/{childId}/consent ──────────────────────

export const GrantConsentRequest = z.object({
  consentType: ConsentType,
  documentVersion: z.string(),
});
export type GrantConsentRequest = z.infer<typeof GrantConsentRequest>;

export const GrantConsentResponse = DataEnvelope(ConsentRecord);
export type GrantConsentResponse = z.infer<typeof GrantConsentResponse>;

// ── POST /children/{childId}/consent/revoke ───────────────

export const RevokeConsentRequest = z.object({
  consentType: ConsentType,
});
export type RevokeConsentRequest = z.infer<typeof RevokeConsentRequest>;

export const RevokeConsentResponse = DataEnvelope(ConsentRecord);
export type RevokeConsentResponse = z.infer<typeof RevokeConsentResponse>;

// ── Route params ──────────────────────────────────────────

export const ConsentChildIdParam = z.object({
  childId: UUID,
});
export type ConsentChildIdParam = z.infer<typeof ConsentChildIdParam>;
