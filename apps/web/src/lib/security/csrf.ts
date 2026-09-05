/**
 * CSRF protection — token-based CSRF defense for state-changing requests.
 *
 * Uses double-submit cookie pattern:
 * 1. Generate random token
 * 2. Set in cookie (httpOnly: false for JS access)
 * 3. Client sends token in header
 * 4. Server validates token matches cookie
 *
 * @see docs/09_SECURITY_PRIVACY.md §4
 */

// ── Constants ────────────────────────────────────────────

const CSRF_COOKIE_NAME = "cog_csrf";
const CSRF_HEADER_NAME = "x-csrf-token";
const TOKEN_LENGTH = 32;
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// ── Token Generation ─────────────────────────────────────

/**
 * Generate a new CSRF token.
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(TOKEN_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Set CSRF token in response cookie.
 */
export function setCsrfCookie(response: Response, token: string): Response {
  response.headers.append(
    "Set-Cookie",
    `${CSRF_COOKIE_NAME}=${token}; Path=/; HttpOnly=false; SameSite=Strict; Max-Age=${TOKEN_EXPIRY_MS / 1000}`,
  );
  return response;
}

// ── Token Validation ─────────────────────────────────────

/**
 * Validate CSRF token from request.
 */
export function validateCsrfToken(request: Request): boolean {
  // Get token from header
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (!headerToken) {
    return false;
  }

  // Get token from cookie
  const cookies = request.headers.get("cookie") ?? "";
  const cookieMatch = cookies.match(new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`));
  const cookieToken = cookieMatch?.[1];

  if (!cookieToken) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(headerToken, cookieToken);
}

// ── Middleware Helper ─────────────────────────────────────

/**
 * Check CSRF for state-changing requests (POST, PUT, PATCH, DELETE).
 * Returns null if valid, Response if invalid.
 */
export function checkCsrf(request: Request): Response | null {
  const method = request.method.toUpperCase();

  // Only check state-changing methods
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return null;
  }

  // Skip CSRF for auth endpoints (they use session cookie)
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/auth/")) {
    return null;
  }

  // Skip CSRF for telemetry (uses idempotency key)
  if (url.pathname === "/api/telemetry/batch") {
    return null;
  }

  // Validate CSRF token
  if (!validateCsrfToken(request)) {
    return Response.json(
      {
        error: {
          code: "CSRF_INVALID",
          message: "Invalid or missing CSRF token",
        },
        requestId: crypto.randomUUID(),
      },
      { status: 403 },
    );
  }

  return null;
}

// ── Helpers ──────────────────────────────────────────────

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}
