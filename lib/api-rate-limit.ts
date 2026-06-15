// ============================================================
// API Rate Limiter (per-workspace, in-memory)
// ============================================================

interface RateLimitEntry {
  minute: { count: number; resetAt: number };
  day: { count: number; resetAt: number };
}

const store = new Map<string, RateLimitEntry>();

// Default limits (overridden per plan)
const DEFAULT_LIMITS = {
  requestsPerMinute: 60,
  requestsPerDay: 10000,
};

const PLAN_LIMITS: Record<string, typeof DEFAULT_LIMITS> = {
  free: { requestsPerMinute: 10, requestsPerDay: 100 },
  pro: { requestsPerMinute: 60, requestsPerDay: 10000 },
  enterprise: { requestsPerMinute: 600, requestsPerDay: 100000 },
};

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

/**
 * Check rate limit for a workspace.
 * Returns whether the request is allowed and rate limit headers.
 */
export function checkRateLimit(
  workspaceId: string,
  planName: string = "free"
): RateLimitResult {
  const limits = PLAN_LIMITS[planName] || DEFAULT_LIMITS;
  const now = Date.now();
  const minuteWindow = 60 * 1000;
  const dayWindow = 24 * 60 * 60 * 1000;

  let entry = store.get(workspaceId);
  if (!entry) {
    entry = {
      minute: { count: 0, resetAt: now + minuteWindow },
      day: { count: 0, resetAt: now + dayWindow },
    };
    store.set(workspaceId, entry);
  }

  // Reset minute window
  if (now > entry.minute.resetAt) {
    entry.minute = { count: 0, resetAt: now + minuteWindow };
  }

  // Reset day window
  if (now > entry.day.resetAt) {
    entry.day = { count: 0, resetAt: now + dayWindow };
  }

  // Check minute limit
  if (entry.minute.count >= limits.requestsPerMinute) {
    return {
      allowed: false,
      limit: limits.requestsPerMinute,
      remaining: 0,
      resetAt: Math.ceil(entry.minute.resetAt / 1000),
      retryAfter: Math.ceil((entry.minute.resetAt - now) / 1000),
    };
  }

  // Check day limit
  if (entry.day.count >= limits.requestsPerDay) {
    return {
      allowed: false,
      limit: limits.requestsPerDay,
      remaining: 0,
      resetAt: Math.ceil(entry.day.resetAt / 1000),
      retryAfter: Math.ceil((entry.day.resetAt - now) / 1000),
    };
  }

  // Increment counters
  entry.minute.count++;
  entry.day.count++;

  return {
    allowed: true,
    limit: limits.requestsPerMinute,
    remaining: limits.requestsPerMinute - entry.minute.count,
    resetAt: Math.ceil(entry.minute.resetAt / 1000),
  };
}

/**
 * Get current rate limit status without incrementing.
 */
export function getRateLimitStatus(
  workspaceId: string,
  planName: string = "free"
): RateLimitResult {
  const limits = PLAN_LIMITS[planName] || DEFAULT_LIMITS;
  const now = Date.now();
  const minuteWindow = 60 * 1000;

  const entry = store.get(workspaceId);
  if (!entry) {
    return {
      allowed: true,
      limit: limits.requestsPerMinute,
      remaining: limits.requestsPerMinute,
      resetAt: Math.ceil((now + minuteWindow) / 1000),
    };
  }

  const minuteCount = now > entry.minute.resetAt ? 0 : entry.minute.count;
  const remaining = Math.max(0, limits.requestsPerMinute - minuteCount);

  return {
    allowed: remaining > 0,
    limit: limits.requestsPerMinute,
    remaining,
    resetAt: Math.ceil((now > entry.minute.resetAt ? now + minuteWindow : entry.minute.resetAt) / 1000),
  };
}

/**
 * Clean up expired entries (call periodically).
 */
export function cleanupRateLimits() {
  const now = Date.now();
  const entries = Array.from(store.entries());
  for (const [key, entry] of entries) {
    if (now > entry.day.resetAt) {
      store.delete(key);
    }
  }
}

// Cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupRateLimits, 5 * 60 * 1000);
}
