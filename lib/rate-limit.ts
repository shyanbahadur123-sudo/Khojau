// Minimal sliding-window rate limiter for anonymous-write endpoints.
// Two layers:
// - rateLimit() below: process-local counters (this file). Zero
//   infrastructure; used directly in unit tests and as the fallback.
// - rateLimitAuto() in lib/rate-limit-shared.ts: Postgres-backed shared
//   counter (supabase/migrations/0017_rate_limits.sql) with fallback to this
//   file. API routes must use rateLimitAuto — per-instance counters alone
//   under-count abuse on multi-instance hosting.

const buckets = new Map<string, number[]>();

function prune(now: number, windowMs: number) {
  if (buckets.size > 5000) {
    buckets.forEach((stamps, k) => {
      if (stamps.length === 0 || now - stamps[stamps.length - 1] > windowMs) buckets.delete(k);
    });
  }
}

/** Returns true when the call is allowed, false when the caller is rate-limited. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  prune(now, windowMs);
  const stamps = buckets.get(key) ?? [];
  const fresh = stamps.filter((t) => now - t < windowMs);
  if (fresh.length >= limit) {
    buckets.set(key, fresh);
    return false;
  }
  fresh.push(now);
  buckets.set(key, fresh);
  return true;
}

export function clientIp(req: Request): string {
  // Prefer the platform-verified client IP when present (Vercel sets
  // x-real-ip and it cannot be spoofed through the platform edge).
  // x-forwarded-for is client-influenced: use only its leftmost entry as
  // a fallback, never the full chain.
  const real = req.headers.get("x-real-ip");
  if (real && real.trim()) return real.trim().slice(0, 64);
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim().slice(0, 64);
  return "unknown";
}
