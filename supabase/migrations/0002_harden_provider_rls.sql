-- Khojau hardening migration 0002.
-- Fixes the provider self-approval vulnerability from 0001:
-- provider-owned INSERT/UPDATE operations can no longer set or change
-- status / verification_status / plan. Only service_role (admin) can.
-- RLS is only tightened, never weakened.
-- Also adds provider_images(provider_id) index and auto-touch of providers.updated_at.

-- ── 1. Owner INSERT: new rows must be pending / unverified / free ──
drop policy if exists "owners insert own" on public.providers;
create policy "owners insert own" on public.providers for insert
with check (
  auth.uid() = owner_id
  and status = 'pending'
  and verification_status = 'unverified'
  and plan = 'free'
);

-- ── 2. Trigger: non-service_role writes may not touch moderation columns ──
-- RLS WITH CHECK only sees the NEW row, so it cannot tell "keep approved"
-- (legit owner edit) from "escalate to approved" (attack). This trigger
-- compares OLD vs NEW and blocks any change to moderation columns unless
-- the write comes from service_role (admin). No SECURITY DEFINER needed:
-- the function only raises exceptions, it never bypasses RLS.
create or replace function public.prevent_provider_moderation_escalation()
returns trigger
language plpgsql
as $$
begin
  if auth.role() <> 'service_role' then
    if tg_op = 'INSERT' then
      if new.status <> 'pending'
        or new.verification_status <> 'unverified'
        or new.plan <> 'free' then
        raise exception 'Providers can only create pending, unverified, free listings.';
      end if;
    elsif tg_op = 'UPDATE' then
      if new.status is distinct from old.status
        or new.verification_status is distinct from old.verification_status
        or new.plan is distinct from old.plan then
        raise exception 'Only administrators can change listing status, verification, or plan.';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_provider_moderation_escalation on public.providers;
create trigger trg_prevent_provider_moderation_escalation
  before insert or update on public.providers
  for each row execute function public.prevent_provider_moderation_escalation();

-- ── 3. Index for provider image lookups ──
create index if not exists provider_images_provider_idx on public.provider_images(provider_id);

-- ── 4. Auto-touch providers.updated_at on every update ──
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_providers_updated_at on public.providers;
create trigger trg_providers_updated_at
  before update on public.providers
  for each row execute function public.set_updated_at();
