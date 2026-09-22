-- Khojau storage migration 0005: gate public-bucket writes on approval.
-- Finding: the /object/public/ file server does not evaluate storage RLS, so
-- anything inside a public bucket is fetchable by URL. Protection must be
-- structural: a public-bucket object for a non-approved provider must never
-- EXIST. Owners may therefore write into provider-images/ only while their
-- provider is APPROVED (pending providers add photos after approval).
-- Deletes stay owner-scoped (removal is always safe). Reads already require
-- approval via policy (defense in depth for API reads).

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
      and p.status = 'approved'
  )
  and (metadata ->> 'mimetype') in ('image/jpeg', 'image/png', 'image/webp')
);

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
      and p.status = 'approved'
  )
  and (metadata ->> 'mimetype') in ('image/jpeg', 'image/png', 'image/webp')
);

-- Gallery metadata must reference our own bucket objects (no external URLs
-- smuggled past the bucket's type rules). Public read policy unchanged.
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
  and provider_images.url like '%/storage/v1/object/public/provider-images/%'
);
