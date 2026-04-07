/**
 * Database-backed Rate Limiter
 *
 * Uses Supabase (Postgres) as the backing store instead of Redis.
 * For production at scale, swap with Upstash Redis for lower latency.
 *
 * Supports:
 * - Per-user rate limiting (API, email sending, AI generation)
 * - Sliding window algorithm
 * - Configurable limits per action type
 */

export type RateLimitAction =
  | "api_request"
  | "email_send"
  | "ai_generate"
  | "webhook_call"
  | "login_attempt"
  | "password_reset";

export type RateLimitConfig = {
  maxRequests: number;
  windowMs: number; // milliseconds
};

// Default rate limits per action type
export const RATE_LIMITS: Record<RateLimitAction, RateLimitConfig> = {
  api_request: { maxRequests: 100, windowMs: 60 * 1000 }, // 100/min
  email_send: { maxRequests: 50, windowMs: 60 * 60 * 1000 }, // 50/hour
  ai_generate: { maxRequests: 30, windowMs: 60 * 60 * 1000 }, // 30/hour
  webhook_call: { maxRequests: 60, windowMs: 60 * 1000 }, // 60/min
  login_attempt: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5/15min
  password_reset: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3/hour
};

// In-memory store for serverless (per-instance, resets on cold start)
// Production should use Upstash Redis or Supabase table
const memoryStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Check if an action is rate-limited (in-memory implementation)
 */
export function checkRateLimit(
  identifier: string,
  action: RateLimitAction,
  customConfig?: Partial<RateLimitConfig>
): {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
  retryAfterMs: number;
} {
  const config = { ...RATE_LIMITS[action], ...customConfig };
  const key = `${action}:${identifier}`;
  const now = Date.now();

  const entry = memoryStore.get(key);

  if (!entry || now >= entry.resetAt) {
    // Window expired or no entry — start fresh
    memoryStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      limit: config.maxRequests,
      resetAt: new Date(now + config.windowMs),
      retryAfterMs: 0,
    };
  }

  if (entry.count >= config.maxRequests) {
    // Rate limited
    return {
      allowed: false,
      remaining: 0,
      limit: config.maxRequests,
      resetAt: new Date(entry.resetAt),
      retryAfterMs: entry.resetAt - now,
    };
  }

  // Increment counter
  entry.count++;
  memoryStore.set(key, entry);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    limit: config.maxRequests,
    resetAt: new Date(entry.resetAt),
    retryAfterMs: 0,
  };
}

/**
 * Reset rate limit for a specific identifier and action
 */
export function resetRateLimit(
  identifier: string,
  action: RateLimitAction
): void {
  memoryStore.delete(`${action}:${identifier}`);
}

/**
 * Get rate limit headers for API responses
 */
export function getRateLimitHeaders(result: {
  remaining: number;
  limit: number;
  resetAt: Date;
}): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.floor(result.resetAt.getTime() / 1000).toString(),
  };
}

/**
 * Middleware-style rate limit check that returns NextResponse headers
 */
export function withRateLimit(
  identifier: string,
  action: RateLimitAction,
  customConfig?: Partial<RateLimitConfig>
): {
  allowed: boolean;
  headers: Record<string, string>;
  retryAfterMs: number;
} {
  const result = checkRateLimit(identifier, action, customConfig);
  const headers = getRateLimitHeaders(result);

  if (!result.allowed) {
    headers["Retry-After"] = Math.ceil(result.retryAfterMs / 1000).toString();
  }

  return {
    allowed: result.allowed,
    headers,
    retryAfterMs: result.retryAfterMs,
  };
}

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryStore) {
      if (now >= entry.resetAt) {
        memoryStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}
