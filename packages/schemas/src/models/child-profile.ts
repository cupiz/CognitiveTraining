import { z } from "zod";
import { UUID, ISODateTime, JsonObject } from "../types.js";
import { ChildStatus } from "../enums.js";

export const ChildProfile = z.object({
  id: UUID,
  accountId: UUID,
  displayName: z.string().min(1).max(100),
  birthMonth: z.number().int().min(1).max(12),
  birthYear: z.number().int().min(2000).max(2030),
  locale: z.string().default("en"),
  accessibilityJson: JsonObject.default({}),
  status: ChildStatus,
  createdAt: ISODateTime,
  updatedAt: ISODateTime,
});
export type ChildProfile = z.infer<typeof ChildProfile>;
