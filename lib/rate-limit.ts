// Minimal in-memory sliding-window rate limiter for anonymous-write endpoints.
// MVP tradeoff: no shared store, so limits apply per server instance. That is
// sufficient for a single-instance deployment and adds zero infrastructure.
// If Khojau ever runs multiple instances or faces sustained abuse, move to a
// shared counter (Supabase table / Upstash) or add Cloudflare Turnstile.

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
