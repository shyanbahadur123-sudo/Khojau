-- Khojau requests migration 0009: operator bypass for the status-flow trigger.
-- The trigger exempted only JWT service_role sessions. Database operators
-- (postgres superuser via MCP / SQL editor, or SET ROLE service_role without
-- JWT claims) were blocked, which is inconsistent with RLS itself: RLS
-- bypasses superusers. App-tier roles (anon/authenticated) are unaffected —
-- they can never be current_user postgres/service_role over the API.
-- No policy, table, or application change in this migration.
create or replace function public.enforce_request_status_flow()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'service_role'
    or current_user in ('postgres', 'service_role') then
    return new;
  end if;
  if not exists (
    select 1 from public.providers p
    where p.id = old.provider_id and p.owner_id = auth.uid()
  ) then
    raise exception 'Only the assigned provider or an administrator can update a request.';
  end if;
  if new.provider_id is distinct from old.provider_id
    or new.service_id is distinct from old.service_id
    or new.customer_id is distinct from old.customer_id
    or new.service is distinct from old.service
    or new.location is distinct from old.location
    or new.description is distinct from old.description
    or new.preferred_time is distinct from old.preferred_time
    or new.phone is distinct from old.phone then
    raise exception 'Only request status can be changed.';
  end if;
  if new.status = old.status then
    return new;
  elsif old.status = 'open' and new.status in ('in_progress', 'cancelled') then
    return new;
  elsif old.status = 'in_progress' and new.status in ('completed', 'cancelled') then
    return new;
  else
    raise exception 'Invalid status transition.';
  end if;
end;
$$;
