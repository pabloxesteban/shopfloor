/**
 * Fixed-size sliding window per key, kept in memory. Best effort only: it
 * resets on restart and is not shared between server instances. It exists to
 * stop one visitor from burning through the API quota by accident.
 */
export interface RateLimiter {
  check(key: string, now?: number): { allowed: boolean; retryAfterMs: number };
}

export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }): RateLimiter {
  const hits = new Map<string, number[]>();
  return {
    check(key, now = Date.now()) {
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        const oldest = recent[0] ?? now;
        return { allowed: false, retryAfterMs: windowMs - (now - oldest) };
      }
      recent.push(now);
      hits.set(key, recent);
      return { allowed: true, retryAfterMs: 0 };
    },
  };
}
