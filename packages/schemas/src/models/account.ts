import { z } from "zod";
import { UUID, Email, ISODateTime } from "../types.js";
import { UserRole } from "../enums.js";

export const Account = z.object({
  id: UUID,
  email: Email,
  passwordHash: z.string(),
  authProviderId: z.string().nullable().optional(),
  role: UserRole,
  locale: z.string().default("en"),
  createdAt: ISODateTime,
  updatedAt: ISODateTime,
});
export type Account = z.infer<typeof Account>;

export const AccountPublic = Account.omit({
  passwordHash: true,
  authProviderId: true,
});
export type AccountPublic = z.infer<typeof AccountPublic>;
