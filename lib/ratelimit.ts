import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// In-memory rate limiter fallback when Upstash is not configured
class InMemoryRateLimit {
  private requests: Map<string, number[]> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  async limit(identifier: string): Promise<{ success: boolean; remaining: number }> {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    const timestamps = this.requests.get(identifier) || [];
    const validTimestamps = timestamps.filter((t) => t > windowStart);

    if (validTimestamps.length >= this.maxRequests) {
      this.requests.set(identifier, validTimestamps);
      return { success: false, remaining: 0 };
    }

    validTimestamps.push(now);
    this.requests.set(identifier, validTimestamps);
    return { success: true, remaining: this.maxRequests - validTimestamps.length };
  }
}

function createRateLimiter() {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    const redis = new Redis({
      url: upstashUrl,
      token: upstashToken,
    });

    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 m"),
      analytics: true,
      prefix: "mimotes",
    });
  }

  // Fallback to in-memory rate limiting
  console.warn(
    "Upstash Redis not configured. Using in-memory rate limiting. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for production."
  );
  return new InMemoryRateLimit(60 * 1000, 20);
}

export const ratelimit = createRateLimiter();
