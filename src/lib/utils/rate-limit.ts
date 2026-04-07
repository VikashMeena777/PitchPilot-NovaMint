import { NextRequest, NextResponse } from "next/server";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

// In-memory store (works for single-instance deployments)
// For multi-instance, swap this with Upstash Redis
const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

export type RateLimitConfig = {
  maxRequests: number;     // Max requests per window
  windowMs: number;        // Window in milliseconds
  keyPrefix?: string;      // Prefix for grouping limits
};

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 60,
  windowMs: 60 * 1000, // 60 requests per minute
};

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function rateLimit(
  req: NextRequest,
  config: Partial<RateLimitConfig> = {}
): { success: boolean; remaining: number; resetAt: number } {
  const { maxRequests, windowMs, keyPrefix } = { ...DEFAULT_CONFIG, ...config };

  const ip = getClientIp(req);
  const key = keyPrefix ? `${keyPrefix}:${ip}` : ip;
  const now = Date.now();

  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // New window
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { success: true, remaining: maxRequests - 1, resetAt };
  }

  if (entry.count >= maxRequests) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { success: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

export function rateLimitResponse(resetAt: number): NextResponse {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Reset": new Date(resetAt).toISOString(),
      },
    }
  );
}

// Pre-configured limiters for different endpoints
export const RATE_LIMITS = {
  api: { maxRequests: 60, windowMs: 60 * 1000, keyPrefix: "api" },
  auth: { maxRequests: 10, windowMs: 15 * 60 * 1000, keyPrefix: "auth" },
  email: { maxRequests: 5, windowMs: 60 * 1000, keyPrefix: "email" },
  ai: { maxRequests: 20, windowMs: 60 * 1000, keyPrefix: "ai" },
  webhook: { maxRequests: 100, windowMs: 60 * 1000, keyPrefix: "webhook" },
  export: { maxRequests: 5, windowMs: 5 * 60 * 1000, keyPrefix: "export" },
} as const;
