-- Khojau requests migration 0008: link requests to providers/services/customers,
-- controlled status model, owner-scoped access, status-flow enforcement.
-- Anonymous INSERT is preserved (lead-gen must stay frictionless) but hardened:
-- provider must be approved, service must belong to that provider, status is
-- forced to 'open', and customer_id can only ever be self-or-null.

-- ── 1. Linkage + updated_at ──
alter table public.service_requests
  add column if not exists provider_id uuid references public.providers(id) on delete cascade;
alter table public.service_requests
  add column if not exists service_id uuid references public.services(id) on delete set null;
alter table public.service_requests
  add column if not exists customer_id uuid references auth.users(id) on delete set null;
alter table public.service_requests
  add column if not exists updated_at timestamptz not null default now();

create index if not exists service_requests_provider_idx on public.service_requests(provider_id);
create index if not exists service_requests_customer_idx on public.service_requests(customer_id);
create index if not exists service_requests_status_idx on public.service_requests(status);

-- ── 2. Controlled status model (migrate legacy values first; table holds no rows in prod) ──
update public.service_requests set status = 'in_progress' where status = 'matched';
update public.service_requests set status = 'completed' where status = 'closed';
alter table public.service_requests drop constraint if exists service_requests_status_check;
alter table public.service_requests
  add constraint service_requests_status_check
  check (status in ('open', 'in_progress', 'completed', 'cancelled'));

-- ── 3. Auto-touch updated_at (reuses set_updated_at from 0002) ──
drop trigger if exists trg_service_requests_updated_at on public.service_requests;
create trigger trg_service_requests_updated_at
  before update on public.service_requests
  for each row execute function public.set_updated_at();

-- ── 4. INSERT: hardened, still open to anonymous + authenticated ──
drop policy if exists "anyone can request service" on public.service_requests;
create policy "customers submit requests"
on public.service_requests for insert
with check (
  status = 'open'
  and (customer_id is null or customer_id = auth.uid())
  and (
    provider_id is null
    or exists (
      select 1 from public.providers p
      where p.id = provider_id and p.status = 'approved'
    )
  )
  and (
    service_id is null
    or exists (
      select 1 from public.services s
      join public.providers p on p.id = s.provider_id
      where s.id = service_id
        and s.provider_id = provider_id
        and p.status = 'approved'
    )
  )
);

-- ── 5. SELECT: customers read own; providers read own providers' ──
drop policy if exists "customers read own requests" on public.service_requests;
create policy "customers read own requests"
on public.service_requests for select
using (auth.uid() = customer_id);

drop policy if exists "providers read own requests" on public.service_requests;
create policy "providers read own requests"
on public.service_requests for select
using (
  exists (
    select 1 from public.providers p
    where p.id = service_requests.provider_id
      and p.owner_id = auth.uid()
  )
);

-- ── 6. UPDATE: provider-owned rows only; trigger enforces the rest ──
drop policy if exists "providers update own requests" on public.service_requests;
create policy "providers update own requests"
on public.service_requests for update
using (
  exists (
    select 1 from public.providers p
    where p.id = service_requests.provider_id
      and p.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.providers p
    where p.id = service_requests.provider_id
      and p.owner_id = auth.uid()
  )
);

-- ── 7. Status-flow trigger: only the assigned provider (or service_role)
-- may update, only the status column may change, and only along
-- open -> in_progress/cancelled, in_progress -> completed/cancelled.
-- No SECURITY DEFINER: it only raises exceptions, never bypasses RLS.
create or replace function public.enforce_request_status_flow()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'service_role' then
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

drop trigger if exists trg_enforce_request_status_flow on public.service_requests;
create trigger trg_enforce_request_status_flow
  before update on public.service_requests
  for each row execute function public.enforce_request_status_flow();
