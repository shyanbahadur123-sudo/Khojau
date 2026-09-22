-- Khojau self-management migration 0007: owner-scoped RLS for services + hours.
-- Ownership is always verified through providers.owner_id = auth.uid(); a
-- provider_id supplied by the browser is never trusted on its own.
-- Public read policies (approved providers only) are untouched.
-- No SECURITY DEFINER functions; moderation/updated_at triggers untouched.

-- ── services: owners fully manage rows of their own providers ──
drop policy if exists "owners manage own services" on public.services;
create policy "owners manage own services"
on public.services for all
using (
  exists (
    select 1 from public.providers p
    where p.id = services.provider_id
      and p.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.providers p
    where p.id = services.provider_id
      and p.owner_id = auth.uid()
  )
);

-- ── provider_hours: owners fully manage rows of their own providers ──
drop policy if exists "owners manage own hours" on public.provider_hours;
create policy "owners manage own hours"
on public.provider_hours for all
using (
  exists (
    select 1 from public.providers p
    where p.id = provider_hours.provider_id
      and p.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.providers p
    where p.id = provider_hours.provider_id
      and p.owner_id = auth.uid()
  )
);
