/**
 * Email sending utility — sends verification and password reset emails.
 *
 * Uses configurable provider:
 * - console: Logs to console (development/staging)
 * - smtp: SMTP server (production)
 * - resend: Resend API (production)
 *
 * @see docs/09_SECURITY_PRIVACY.md §4
 */

// ── Types ────────────────────────────────────────────────

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export type EmailProvider = "console" | "smtp" | "resend";

// ── Configuration ────────────────────────────────────────

const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER ?? "console") as EmailProvider;

// ── Main Function ────────────────────────────────────────

/**
 * Send an email using the configured provider.
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    switch (EMAIL_PROVIDER) {
      case "console":
        return sendConsoleEmail(options);
      case "smtp":
        return sendSmtpEmail(options);
      case "resend":
        return sendResendEmail(options);
      default:
        console.error(`Unknown email provider: ${EMAIL_PROVIDER}`);
        return false;
    }
  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
}

// ── Console Provider (Development/Staging) ───────────────

function sendConsoleEmail(options: EmailOptions): boolean {
  console.log("═══════════════════════════════════════════════════");
  console.log("📧 EMAIL SENT (Console Mode)");
  console.log("═══════════════════════════════════════════════════");
  console.log(`To: ${options.to}`);
  console.log(`Subject: ${options.subject}`);
  console.log("───────────────────────────────────────────────────");
  console.log(options.text ?? options.html.replace(/<[^>]*>/g, ""));
  console.log("═══════════════════════════════════════════════════");
  return true;
}

// ── SMTP Provider (Production) ───────────────────────────

async function sendSmtpEmail(options: EmailOptions): Promise<boolean> {
  // TODO: Implement SMTP sending with nodemailer
  // Example:
  // import nodemailer from "nodemailer";
  // const transporter = nodemailer.createTransport({
  //   host: process.env.SMTP_HOST,
  //   port: Number(process.env.SMTP_PORT),
  //   secure: true,
  //   auth: {
  //     user: process.env.SMTP_USER,
  //     pass: process.env.SMTP_PASS,
  //   },
  // });
  // await transporter.sendMail({
  //   from: process.env.EMAIL_FROM,
  //   to: options.to,
  //   subject: options.subject,
  //   html: options.html,
  //   text: options.text,
  // });

  console.log(`[SMTP] Would send email to ${options.to}: ${options.subject}`);
  return true;
}

// ── Resend Provider (Production) ─────────────────────────

async function sendResendEmail(options: EmailOptions): Promise<boolean> {
  // TODO: Implement Resend API sending
  // Example:
  // import { Resend } from "resend";
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: process.env.EMAIL_FROM,
  //   to: options.to,
  //   subject: options.subject,
  //   html: options.html,
  // });

  console.log(`[Resend] Would send email to ${options.to}: ${options.subject}`);
  return true;
}

// ── Email Templates ──────────────────────────────────────

/**
 * Generate verification email HTML.
 */
export function getVerificationEmailHtml(token: string, baseUrl: string): string {
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Verify Your Email Address</h2>
        <p>Thank you for signing up for the Cognitive Training Platform!</p>
        <p>Please click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Verify Email
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          If the button doesn't work, copy and paste this link into your browser:
          <br>
          <a href="${verifyUrl}">${verifyUrl}</a>
        </p>
        <p style="color: #666; font-size: 14px;">
          This link will expire in 24 hours.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">
          If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate password reset email HTML.
 */
export function getPasswordResetEmailHtml(token: string, baseUrl: string): string {
  const resetUrl = `${baseUrl}/api/auth/password-reset/confirm?token=${token}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #dc2626;">Reset Your Password</h2>
        <p>We received a request to reset your password.</p>
        <p>Please click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          If the button doesn't work, copy and paste this link into your browser:
          <br>
          <a href="${resetUrl}">${resetUrl}</a>
        </p>
        <p style="color: #666; font-size: 14px;">
          This link will expire in 1 hour.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">
          If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
        </p>
      </div>
    </body>
    </html>
  `;
}
