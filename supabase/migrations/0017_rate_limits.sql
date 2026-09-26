-- Khojau migration 0017: shared rate-limit counters for anonymous-write endpoints.
-- Why: lib/rate-limit.ts keeps counters in a process-local Map, so limits
-- apply per server instance. On Vercel the app runs on many instances (and
-- instances recycle), so a per-instance limiter under-counts sustained abuse.
-- This table backs the shared sliding-window counter in
-- lib/rate-limit-shared.ts: each check counts recent hits for the key and
-- records the current hit. The in-memory limiter remains as a fail-closed
-- fallback when the service-role key is missing or the table is unreachable.
-- RLS is enabled with NO policies: only service_role (server-side rate-limit
-- checks) can read or write. No UPDATE is ever performed; rows older than
-- the widest window are deleted by the check itself. Non-destructive: new
-- table only, no existing tables, policies, or data touched.

create table if not exists public.rate_limit_hits (
  key text not null,
  hit_at timestamptz not null default now()
);

create index if not exists rate_limit_hits_key_hit_idx
  on public.rate_limit_hits(key, hit_at);

alter table public.rate_limit_hits enable row level security;
