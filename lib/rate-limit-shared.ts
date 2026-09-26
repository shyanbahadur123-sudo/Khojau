import "server-only";

import { rateLimit } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase";

// Shared sliding-window rate limiter backed by Postgres
// (supabase/migrations/0017_rate_limits.sql), with the in-memory limiter as
// fallback. Use this in anonymous-write API routes instead of calling
// rateLimit() directly: per-instance counters under-count abuse on Vercel's
// multi-instance serverless runtime.
//
// Fail-closed behavior: when the service-role key is missing (local dev
// without env) or the table is unreachable/missing, the check falls back to
// the process-local limiter rather than blocking all traffic or allowing
// unlimited traffic. Every fallback path still enforces *a* limit.
export const RATE_LIMIT_RETENTION_MS = 60 * 60 * 1000; // widest window used anywhere

export async function rateLimitAuto(key: string, limit: number, windowMs: number): Promise<boolean> {
  let admin: NonNullable<ReturnType<typeof supabaseAdmin>>;
  try {
    const client = supabaseAdmin();
    if (!client) return rateLimit(key, limit, windowMs);
    admin = client;
  } catch {
    return rateLimit(key, limit, windowMs);
  }
  try {
    const now = Date.now();
    const since = new Date(now - windowMs).toISOString();
    // Best-effort prune of rows older than any window; a failure here must
    // never block the request path.
    await admin.from("rate_limit_hits").delete().lt("hit_at", new Date(now - RATE_LIMIT_RETENTION_MS).toISOString());
    const { count, error: countErr } = await admin
      .from("rate_limit_hits")
      .select("hit_at", { count: "exact", head: true })
      .eq("key", key)
      .gte("hit_at", since);
    if (countErr) return rateLimit(key, limit, windowMs);
    if ((count ?? 0) >= limit) return false;
    const { error: insErr } = await admin.from("rate_limit_hits").insert({ key });
    if (insErr) return rateLimit(key, limit, windowMs);
    return true;
  } catch {
    return rateLimit(key, limit, windowMs);
  }
}
