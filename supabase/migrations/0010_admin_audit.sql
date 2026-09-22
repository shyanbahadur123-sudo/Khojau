-- Khojau admin migration 0010: append-only audit log for moderation actions.
-- Why: service_role writes bypass RLS and leave no trace. The events table
-- records customer analytics, not administrator actions. This table records
-- who did what to which record, without storing any secrets.
-- RLS is enabled with NO policies: only service_role (server-side admin
-- paths) can insert or read. No UPDATE/DELETE is ever performed by the app.

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  target_type text not null,
  target_id text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_target_idx
  on public.admin_audit_log(target_type, target_id);
create index if not exists admin_audit_log_created_idx
  on public.admin_audit_log(created_at desc);

alter table public.admin_audit_log enable row level security;
