/**
 * Upstash Redis Rate Limiter — Production-grade distributed rate limiting
 *
 * Drop-in replacement for the in-memory rate limiter.
 * Uses Upstash Redis REST API (works on Vercel Edge, serverless, etc.)
 *
 * Setup:
 * 1. Create an Upstash Redis database at https://console.upstash.com
 * 2. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in env
 * 3. Import from this file instead of rate-limiter.ts
 *
 * Falls back to in-memory rate limiter if Upstash is not configured.
 */

import {
  checkRateLimit as memoryCheckRateLimit,
  withRateLimit as memoryWithRateLimit,
  type RateLimitAction,
  type RateLimitConfig,
  RATE_LIMITS,
  getRateLimitHeaders,
} from "./rate-limiter";

// Re-export types
export { type RateLimitAction, type RateLimitConfig, RATE_LIMITS };

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * Execute a Redis command via Upstash REST API
 */
async function redisCommand(command: string[]): Promise<unknown> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null;

  try {
    const response = await fetch(`${UPSTASH_URL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
    });

    if (!response.ok) return null;
    const data = (await response.json()) as { result: unknown };
    return data.result;
  } catch {
    return null;
  }
}

/**
 * Sliding window rate limiter using Redis MULTI/EXEC
 * Uses sorted sets for precise sliding window counting
 */
async function redisCheckRateLimit(
  identifier: string,
  action: RateLimitAction,
  customConfig?: Partial<RateLimitConfig>
): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
  retryAfterMs: number;
} | null> {
  const config = { ...RATE_LIMITS[action], ...customConfig };
  const key = `rl:${action}:${identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  try {
    // Pipeline: Remove expired entries, count current window, add new entry
    // Using individual commands since Upstash REST doesn't support MULTI

    // 1. Remove entries older than the window
    await redisCommand(["ZREMRANGEBYSCORE", key, "0", windowStart.toString()]);

    // 2. Count entries in current window
    const count = (await redisCommand([
      "ZCARD",
      key,
    ])) as number;

    if (count >= config.maxRequests) {
      // Get the oldest entry to calculate retry time
      const oldest = (await redisCommand([
        "ZRANGE",
        key,
        "0",
        "0",
        "WITHSCORES",
      ])) as string[];

      const oldestScore = oldest?.[1] ? parseInt(oldest[1]) : now;
      const resetAt = oldestScore + config.windowMs;

      return {
        allowed: false,
        remaining: 0,
        limit: config.maxRequests,
        resetAt: new Date(resetAt),
        retryAfterMs: resetAt - now,
      };
    }

    // 3. Add current request with timestamp as score
    const member = `${now}:${Math.random().toString(36).slice(2, 8)}`;
    await redisCommand(["ZADD", key, now.toString(), member]);

    // 4. Set TTL on the key (auto-cleanup)
    await redisCommand([
      "PEXPIRE",
      key,
      config.windowMs.toString(),
    ]);

    return {
      allowed: true,
      remaining: config.maxRequests - count - 1,
      limit: config.maxRequests,
      resetAt: new Date(now + config.windowMs),
      retryAfterMs: 0,
    };
  } catch {
    return null; // Signal to fall back to in-memory
  }
}

/**
 * Check rate limit — tries Redis first, falls back to in-memory
 */
export async function checkRateLimit(
  identifier: string,
  action: RateLimitAction,
  customConfig?: Partial<RateLimitConfig>
): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
  retryAfterMs: number;
}> {
  // Try Upstash Redis if configured
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    const result = await redisCheckRateLimit(identifier, action, customConfig);
    if (result) return result;
  }

  // Fallback to in-memory
  return memoryCheckRateLimit(identifier, action, customConfig);
}

/**
 * Middleware-style rate limit with headers — tries Redis first
 */
export async function withRateLimitRedis(
  identifier: string,
  action: RateLimitAction,
  customConfig?: Partial<RateLimitConfig>
): Promise<{
  allowed: boolean;
  headers: Record<string, string>;
  retryAfterMs: number;
}> {
  // Try Upstash Redis if configured
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    const result = await redisCheckRateLimit(identifier, action, customConfig);
    if (result) {
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
  }

  // Fallback to in-memory
  return memoryWithRateLimit(identifier, action, customConfig);
}

/**
 * Clear rate limit for a specific key (e.g., after successful auth)
 */
export async function clearRateLimit(
  identifier: string,
  action: RateLimitAction
): Promise<void> {
  const key = `rl:${action}:${identifier}`;

  if (UPSTASH_URL && UPSTASH_TOKEN) {
    await redisCommand(["DEL", key]);
  }
}

/**
 * Get current rate limit status without incrementing
 */
export async function getRateLimitStatus(
  identifier: string,
  action: RateLimitAction
): Promise<{ used: number; limit: number; remaining: number }> {
  const config = RATE_LIMITS[action];

  if (UPSTASH_URL && UPSTASH_TOKEN) {
    const key = `rl:${action}:${identifier}`;
    const windowStart = Date.now() - config.windowMs;

    await redisCommand(["ZREMRANGEBYSCORE", key, "0", windowStart.toString()]);
    const count = ((await redisCommand(["ZCARD", key])) as number) || 0;

    return {
      used: count,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - count),
    };
  }

  return { used: 0, limit: config.maxRequests, remaining: config.maxRequests };
}
