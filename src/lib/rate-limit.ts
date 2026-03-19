// Simple in-memory rate limiter (works per-instance, good enough for internal app)

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

/**
 * Check if a request is allowed under the rate limit.
 * @param key - Unique key for the rate limit bucket (e.g. "backup:userId")
 * @param maxRequests - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns true if allowed, false if rate limited
 */
export function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = store.get(key);

  // If no entry or window has expired, start a new window
  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  // Within the window - check if under limit
  if (entry.count < maxRequests) {
    entry.count += 1;
    return true;
  }

  // Rate limited
  return false;
}

const RATE_LIMIT_MESSAGE = "Zu viele Anfragen. Bitte später erneut versuchen.";

/**
 * Returns a 429 Response for rate-limited requests.
 */
export function rateLimitResponse(): Response {
  return Response.json({ error: RATE_LIMIT_MESSAGE }, { status: 429 });
}
