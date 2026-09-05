/**
 * Rate limiting — in-memory rate limiter for API endpoints.
 *
 * Uses sliding window counter algorithm.
 * For production, replace with Redis-based implementation.
 *
 * @see docs/09_SECURITY_PRIVACY.md §4
 */

// ── Types ────────────────────────────────────────────────

export interface RateLimitConfig {
  /** Window size in milliseconds */
  windowMs: number;
  /** Maximum requests per window */
  maxRequests: number;
  /** Optional key generator (default: IP) */
  keyGenerator?: (request: Request) => string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

// ── Store ────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

// ── Rate Limiters ────────────────────────────────────────

/**
 * E2E/local test runs sign up dozens of users per minute from one IP. NODE_ENV
 * is "development" under `next dev` (playwright.config also pins production
 * runs explicitly), so the limiter is only relaxed where there is no real
 * abuse surface. Production defaults stay untouched.
 */
const e2eRelaxed = process.env.NODE_ENV === "development" || process.env.E2E === "1";

/** Auth endpoints: 10 requests per minute (120/min under local e2e) */
export const authRateLimit: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: e2eRelaxed ? 120 : 10,
};

/** Telemetry endpoint: 100 requests per minute */
export const telemetryRateLimit: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 100,
};

/** General API: 60 requests per minute */
export const apiRateLimit: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 60,
};

/** Game runs: 30 requests per minute */
export const gameRunRateLimit: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 30,
};

// ── Main Function ────────────────────────────────────────

/**
 * Check rate limit for a request.
 */
export function checkRateLimit(
  request: Request,
  config: RateLimitConfig,
): RateLimitResult {
  const keyGenerator = config.keyGenerator ?? getDefaultKey;
  const key = keyGenerator(request);
  const now = Date.now();

  // Get or create entry
  let entry = store.get(key);

  // If entry is outside window or doesn't exist, create new
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    };
    store.set(key, entry);
  }

  // Increment count
  entry.count++;

  // Check if over limit
  const allowed = entry.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);

  return {
    allowed,
    remaining,
    resetAt: entry.resetAt,
  };
}

/**
 * Create rate limit response headers.
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.remaining + (result.allowed ? 1 : 0)),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}

/**
 * Create rate limit exceeded response.
 */
export function rateLimitExceededResponse(): Response {
  return Response.json(
    {
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Please try again later.",
      },
      requestId: crypto.randomUUID(),
    },
    {
      status: 429,
      headers: {
        "Retry-After": "60",
      },
    },
  );
}

// ── Helpers ──────────────────────────────────────────────

function getDefaultKey(request: Request): string {
  // Try to get real IP from headers
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "unknown";
}
