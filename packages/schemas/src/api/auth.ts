import { z } from "zod";
import { Email } from "../types.js";
import { DataEnvelope } from "./envelope.js";
import { AccountPublic } from "../models/account.js";

// ── POST /auth/signup ─────────────────────────────────────

export const SignupRequest = z.object({
  email: Email,
  password: z.string().min(8).max(128),
});
export type SignupRequest = z.infer<typeof SignupRequest>;

export const SignupResponse = DataEnvelope(AccountPublic);
export type SignupResponse = z.infer<typeof SignupResponse>;

// ── POST /auth/login ──────────────────────────────────────

export const LoginRequest = z.object({
  email: Email,
  password: z.string(),
});
export type LoginRequest = z.infer<typeof LoginRequest>;

export const LoginResponse = DataEnvelope(AccountPublic);
export type LoginResponse = z.infer<typeof LoginResponse>;

// ── POST /auth/logout ─────────────────────────────────────

export const LogoutResponse = DataEnvelope(z.literal(true));
export type LogoutResponse = z.infer<typeof LogoutResponse>;

// ── POST /auth/password-reset ─────────────────────────────

export const PasswordResetRequest = z.object({
  email: Email,
});
export type PasswordResetRequest = z.infer<typeof PasswordResetRequest>;

export const PasswordResetResponse = DataEnvelope(z.literal(true));
export type PasswordResetResponse = z.infer<typeof PasswordResetResponse>;

// ── POST /auth/password-reset/confirm ─────────────────────

export const PasswordResetConfirmRequest = z.object({
  token: z.string(),
  password: z.string().min(8).max(128),
});
export type PasswordResetConfirmRequest = z.infer<typeof PasswordResetConfirmRequest>;

// ── POST /auth/verify-email ───────────────────────────────

export const VerifyEmailRequest = z.object({
  token: z.string(),
});
export type VerifyEmailRequest = z.infer<typeof VerifyEmailRequest>;
