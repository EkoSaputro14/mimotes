// ============================================================
// Endpoint Rate Limiter
// ============================================================
// IP-based rate limiting for sensitive endpoints (auth, invitations, workspace).
// Separated from workspace-level rate limiting since these endpoints
// may not have workspace context.

import { logger } from "@/lib/logger";

// ============================================================
// Types
// ============================================================

export interface EndpointRateLimitConfig {
  /** Maximum requests per window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
  /** Human-readable name for logging */
  name: string;
}

export interface EndpointRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

// ============================================================
// Predefined Configurations
// ============================================================

export const RATE_LIMIT_CONFIGS = {
  /** Auth endpoints: login, register */
  auth: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    name: "auth",
  } satisfies EndpointRateLimitConfig,

  /** Invitation creation: prevent spam invites */
  invitationCreate: {
    maxRequests: 20,
    windowMs: 60 * 60 * 1000, // 1 hour
    name: "invitation_create",
  } satisfies EndpointRateLimitConfig,

  /** Invitation accept: prevent token brute-force */
  invitationAccept: {
    maxRequests: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
    name: "invitation_accept",
  } satisfies EndpointRateLimitConfig,

  /** Workspace switching: prevent abuse */
  workspaceSwitch: {
    maxRequests: 30,
    windowMs: 60 * 60 * 1000, // 1 hour
    name: "workspace_switch",
  } satisfies EndpointRateLimitConfig,

  /** General API: per-IP fallback */
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    name: "api",
  } satisfies EndpointRateLimitConfig,
} as const;

// ============================================================
// In-Memory Store
// ============================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// ============================================================
// Core Rate Limiter
// ============================================================

/**
 * Check rate limit for an IP + endpoint combination.
 * Returns whether the request is allowed.
 */
export function checkEndpointRateLimit(
  ip: string,
  config: EndpointRateLimitConfig
): EndpointRateLimitResult {
  const key = `${config.name}:${ip}`;
  const now = Date.now();

  let entry = store.get(key);

  // Create or reset expired window
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + config.windowMs };
    store.set(key, entry);
  }

  // Check limit
  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    logger.warn("SECURITY", `Rate limit exceeded for ${config.name}`, {
      meta: { ip, endpoint: config.name, count: entry.count, limit: config.maxRequests },
    });
    return {
      allowed: false,
      remaining: 0,
      resetAt: Math.ceil(entry.resetAt / 1000),
      retryAfter,
    };
  }

  // Increment
  entry.count++;

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: Math.ceil(entry.resetAt / 1000),
  };
}

/**
 * Get rate limit headers for HTTP response.
 */
export function getRateLimitHeaders(
  result: EndpointRateLimitResult,
  config: EndpointRateLimitConfig
): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(config.maxRequests),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.resetAt),
  };

  if (!result.allowed && result.retryAfter) {
    headers["Retry-After"] = String(result.retryAfter);
  }

  return headers;
}

/**
 * Extract client IP from request headers.
 */
export function getClientIp(request: Request): string {
  // Check forwarded headers (for reverse proxies)
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

// ============================================================
// Cleanup
// ============================================================

/** Clean up expired entries (call periodically). */
export function cleanupEndpointRateLimits() {
  const now = Date.now();
  const entries = Array.from(store.entries());
  for (const [key, entry] of entries) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

// Auto-cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupEndpointRateLimits, 5 * 60 * 1000);
}
