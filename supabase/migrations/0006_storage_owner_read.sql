-- Khojau storage migration 0006: owners can read their own folders (any status).
-- The Storage API locates objects through RLS-filtered SELECTs before acting
-- on them (e.g. remove returns success with an empty list when nothing is
-- visible, rather than an error). Without an owner-SELECT policy, owners
-- cannot see their own non-approved objects, so owner DELETE silently skips
-- them. This adds owner-scoped SELECT only; anonymous reads stay limited to
-- approved providers' folders, and nothing pending becomes publicly visible
-- (public reachability is still governed structurally by migration 0005:
-- non-approved content can never enter the public bucket).
drop policy if exists "owners read own provider images" on storage.objects;
create policy "owners read own provider images"
on storage.objects for select
using (
  bucket_id = 'provider-images'
  and exists (
    select 1 from public.providers p
    where p.id::text = (storage.foldername(name))[1]
      and p.owner_id = auth.uid()
  )
);
