import { z } from "zod";
import { UUID, ISODateTime, PerformanceIndex } from "../types.js";
import { CognitiveDomain } from "../enums.js";

export const DomainPerformance = z.object({
  id: UUID,
  childId: UUID,
  domain: CognitiveDomain,
  score: PerformanceIndex,
  confidence: z.number().min(0).max(1),
  windowStart: ISODateTime,
  windowEnd: ISODateTime,
  algorithmVersion: z.string(),
  sourceRunCount: z.number().int().min(0),
  createdAt: ISODateTime,
});
export type DomainPerformance = z.infer<typeof DomainPerformance>;
