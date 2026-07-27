/**
 * Sliding Window Rate Limiter & Anti-Spam Throttler
 * Protects Payment Webhooks, Mass Invoicing, and NIM Generation endpoints
 */

interface RateLimitTracker {
  timestamps: number[];
}

const trackerMap = new Map<string, RateLimitTracker>();

export interface RateLimitCheckResult {
  allowed: boolean;
  currentRequests: number;
  maxLimit: number;
  remaining: number;
  resetInSeconds: number;
}

export function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000
): RateLimitCheckResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  let tracker = trackerMap.get(identifier);
  if (!tracker) {
    tracker = { timestamps: [] };
    trackerMap.set(identifier, tracker);
  }

  // Filter timestamps within sliding window
  tracker.timestamps = tracker.timestamps.filter((ts) => ts > windowStart);

  const currentRequests = tracker.timestamps.length;

  if (currentRequests >= limit) {
    const oldestTimestamp = tracker.timestamps[0] || now;
    const resetInSeconds = Math.ceil((oldestTimestamp + windowMs - now) / 1000);

    console.warn(
      `[Rate Limiter BOCKED] '${identifier}' exceeded limit ${limit}/${windowMs}ms. Reset in ${resetInSeconds}s.`
    );

    return {
      allowed: false,
      currentRequests,
      maxLimit: limit,
      remaining: 0,
      resetInSeconds,
    };
  }

  // Add current request timestamp
  tracker.timestamps.push(now);

  return {
    allowed: true,
    currentRequests: currentRequests + 1,
    maxLimit: limit,
    remaining: limit - (currentRequests + 1),
    resetInSeconds: Math.ceil(windowMs / 1000),
  };
}

export function resetRateLimit(identifier: string): void {
  trackerMap.delete(identifier);
}
