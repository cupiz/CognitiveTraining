/**
 * Audit logging — records sensitive operations for security review.
 *
 * Logs:
 * - Authentication events (login, logout, failed attempts)
 * - Authorization events (access denied)
 * - Data mutations (create, update, delete)
 * - Consent changes
 * - Admin operations
 *
 * @see docs/09_SECURITY_PRIVACY.md §7
 */

// ── Types ────────────────────────────────────────────────

export type AuditAction =
  | "auth.login"
  | "auth.login_failed"
  | "auth.logout"
  | "auth.signup"
  | "auth.password_reset"
  | "auth.email_verify"
  | "child.create"
  | "child.update"
  | "child.delete"
  | "consent.grant"
  | "consent.revoke"
  | "assessment.create"
  | "assessment.complete"
  | "session.create"
  | "session.start"
  | "session.complete"
  | "game_run.create"
  | "game_run.start"
  | "game_run.finish"
  | "telemetry.batch"
  | "data.export"
  | "data.delete"
  | "admin.game_visibility"
  | "admin.user_create"
  | "admin.user_role_change"
  | "admin.user_delete"
  | "admin.child_status"
  | "access.denied";

export interface AuditEntry {
  timestamp: string;
  action: AuditAction;
  accountId?: string;
  childId?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

// ── In-Memory Store (for MVP) ────────────────────────────

const auditLog: AuditEntry[] = [];
const MAX_ENTRIES = 10_000;

// ── Main Functions ───────────────────────────────────────

/**
 * Log an audit event.
 */
export function logAudit(entry: Omit<AuditEntry, "timestamp">): void {
  const fullEntry: AuditEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };

  auditLog.push(fullEntry);

  // Trim if too large
  if (auditLog.length > MAX_ENTRIES) {
    auditLog.splice(0, auditLog.length - MAX_ENTRIES);
  }

  // In production, send to external logging service
  if (process.env.NODE_ENV === "production") {
    // TODO: Send to logging service (e.g., Datadog, CloudWatch)
    console.log("[AUDIT]", JSON.stringify(fullEntry));
  }
}

/**
 * Get audit log entries (admin only).
 */
export function getAuditLog(options: {
  accountId?: string;
  childId?: string;
  action?: AuditAction;
  limit?: number;
  offset?: number;
}): AuditEntry[] {
  let filtered = [...auditLog];

  if (options.accountId) {
    filtered = filtered.filter((e) => e.accountId === options.accountId);
  }
  if (options.childId) {
    filtered = filtered.filter((e) => e.childId === options.childId);
  }
  if (options.action) {
    filtered = filtered.filter((e) => e.action === options.action);
  }

  // Sort by timestamp descending
  filtered.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const offset = options.offset ?? 0;
  const limit = options.limit ?? 100;

  return filtered.slice(offset, offset + limit);
}

/**
 * Get audit log count.
 */
export function getAuditLogCount(options: {
  accountId?: string;
  childId?: string;
  action?: AuditAction;
}): number {
  let filtered = [...auditLog];

  if (options.accountId) {
    filtered = filtered.filter((e) => e.accountId === options.accountId);
  }
  if (options.childId) {
    filtered = filtered.filter((e) => e.childId === options.childId);
  }
  if (options.action) {
    filtered = filtered.filter((e) => e.action === options.action);
  }

  return filtered.length;
}

/**
 * Clear audit log (for testing only).
 */
export function clearAuditLog(): void {
  auditLog.length = 0;
}
