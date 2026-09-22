-- Khojau storage migration 0003: provider-images bucket + RLS + gallery metadata writes.
-- Bucket is PRIVATE: public reads are granted solely through storage RLS and
-- only for objects under an APPROVED provider's folder (<provider_uuid>/...).
-- Owners can insert/update/delete only inside their own provider's folder.
-- Gallery metadata (public.provider_images) gains owner-scoped write access;
-- existing public read policies are untouched (RLS only ever tightened here).

-- ── 1. Bucket (private) ──
insert into storage.buckets (id, name, public)
values ('provider-images', 'provider-images', false)
on conflict (id) do update set public = excluded.public;

-- ── 2. Public read: approved providers' folders only ──
drop policy if exists "public read approved provider images" on storage.objects;
create policy "public read approved provider images"
on storage.objects for select
using (
  bucket_id = 'provider-images'
  and exists (
    select 1 from public.providers p
    where p.id::text = (storage.foldername(name))[1]
      and p.status = 'approved'
  )
);

-- ── 3. Owner insert: own provider folder + images only ──
drop policy if exists "owners upload own provider images" on storage.objects;
create policy "owners upload own provider images"
on storage.objects for insert
with check (
  bucket_id = 'provider-images'
  and (storage.foldername(name))[1] is not null
  and exists (
    select 1 from public.providers p
    where p.id::text = (storage.foldername(name))[1]
      and p.owner_id = auth.uid()
  )
  and (metadata ->> 'mimetype') in ('image/jpeg', 'image/png', 'image/webp')
);

-- ── 4. Owner update (in-place overwrite) ──
drop policy if exists "owners update own provider images" on storage.objects;
create policy "owners update own provider images"
on storage.objects for update
using (
  bucket_id = 'provider-images'
  and exists (
    select 1 from public.providers p
    where p.id::text = (storage.foldername(name))[1]
      and p.owner_id = auth.uid()
  )
)
with check (
  bucket_id = 'provider-images'
  and exists (
    select 1 from public.providers p
    where p.id::text = (storage.foldername(name))[1]
      and p.owner_id = auth.uid()
  )
  and (metadata ->> 'mimetype') in ('image/jpeg', 'image/png', 'image/webp')
);

-- ── 5. Owner delete ──
drop policy if exists "owners delete own provider images" on storage.objects;
create policy "owners delete own provider images"
on storage.objects for delete
using (
  bucket_id = 'provider-images'
  and exists (
    select 1 from public.providers p
    where p.id::text = (storage.foldername(name))[1]
      and p.owner_id = auth.uid()
  )
);

-- ── 6. Gallery metadata: owner-scoped writes (public read policy unchanged) ──
drop policy if exists "owners manage own image metadata" on public.provider_images;
create policy "owners manage own image metadata"
on public.provider_images for all
using (
  exists (
    select 1 from public.providers p
    where p.id = provider_images.provider_id
      and p.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.providers p
    where p.id = provider_images.provider_id
      and p.owner_id = auth.uid()
  )
);
