import { z } from "zod";
import { UUID, ISODateTime } from "../types.js";
import { ConsentType, ConsentSource } from "../enums.js";

export const ConsentRecord = z.object({
  id: UUID,
  childId: UUID,
  consentType: ConsentType,
  documentVersion: z.string(),
  grantedAt: ISODateTime,
  revokedAt: ISODateTime.nullable(),
  source: ConsentSource,
});
export type ConsentRecord = z.infer<typeof ConsentRecord>;
