import "server-only";

/**
 * Minimal in-memory token-bucket rate limiter, keyed by IP + action.
 *
 * NOTE: This lives in process memory and is per-instance only. It is acceptable
 * for an MVP but MUST be moved to a durable, shared store (e.g. Upstash Redis)
 * before running on multiple serverless instances in production.
 */

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();

interface RateLimitConfig {
  /** Max tokens (burst capacity). */
  capacity: number;
  /** Tokens refilled per second. */
  refillPerSecond: number;
}

const DEFAULTS: RateLimitConfig = {
  capacity: 5,
  refillPerSecond: 5 / 60, // ~5 attempts per minute
};

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until at least one token is available (when blocked). */
  retryAfterSeconds: number;
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig = DEFAULTS,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key) ?? {
    tokens: config.capacity,
    lastRefill: now,
  };

  const elapsedSeconds = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(
    config.capacity,
    bucket.tokens + elapsedSeconds * config.refillPerSecond,
  );
  bucket.lastRefill = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    buckets.set(key, bucket);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  buckets.set(key, bucket);
  const deficit = 1 - bucket.tokens;
  return {
    allowed: false,
    retryAfterSeconds: Math.ceil(deficit / config.refillPerSecond),
  };
}
