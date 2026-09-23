-- Khojau storage migration 0014: case-insensitive image extension check.
-- The 0011 filename guard used case-sensitive `~`, so a legitimate
-- `PHOTO.JPG` would be rejected by policy while the application only ever
-- generates lowercase extensions (extForType). MIME allowlisting is
-- unchanged and still enforced. This only widens the filename check to
-- match what the MIME rule already permits; security posture identical.
drop policy if exists "owners upload own provider images" on storage.objects;
create policy "owners upload own provider images"
on storage.objects for insert
with check (
  bucket_id = 'provider-images'
  and (storage.foldername(name))[1] is not null
  and name ~* '\.(jpg|jpeg|png|webp)$'
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
  and name ~* '\.(jpg|jpeg|png|webp)$'
  and exists (
    select 1 from public.providers p
    where p.id::text = (storage.foldername(name))[1]
      and p.owner_id = auth.uid()
      and p.status = 'approved'
  )
  and (metadata ->> 'mimetype') in ('image/jpeg', 'image/png', 'image/webp')
);
