-- Khojau saved-providers migration 0015: owner-scoped favorites.
-- Why: the app needs persistent Saved providers without faking state.
-- Smallest normalized design: one row per (user, provider), no mutable
-- columns (so no UPDATE policy — least privilege), cascade deletes on
-- both sides so removals never orphan.
create table if not exists public.saved_providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, provider_id)
);

create index if not exists saved_providers_user_idx on public.saved_providers(user_id);

alter table public.saved_providers enable row level security;

-- Owners manage only their own rows. No anonymous access at all:
-- auth.uid() is null for anon, which never equals a real user_id.
drop policy if exists "owners read own saved" on public.saved_providers;
create policy "owners read own saved"
on public.saved_providers for select
using (auth.uid() = user_id);

drop policy if exists "owners save providers" on public.saved_providers;
create policy "owners save providers"
on public.saved_providers for insert
with check (auth.uid() = user_id);

drop policy if exists "owners unsave providers" on public.saved_providers;
create policy "owners unsave providers"
on public.saved_providers for delete
using (auth.uid() = user_id);
