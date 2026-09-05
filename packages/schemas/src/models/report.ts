import { z } from "zod";
import { UUID, ISODateTime, JsonObject } from "../types.js";
import { ReportStatus } from "../enums.js";

export const Report = z.object({
  id: UUID,
  childId: UUID,
  periodStart: ISODateTime,
  periodEnd: ISODateTime,
  reportVersion: z.string(),
  summaryJson: JsonObject,
  status: ReportStatus,
  createdAt: ISODateTime,
});
export type Report = z.infer<typeof Report>;
