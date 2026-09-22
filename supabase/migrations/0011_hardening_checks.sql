-- Khojau hardening migration 0011: database-level input bounds + storage extension check.
-- Why: several write paths accept direct anon/authenticated API calls (RLS, not
-- the Next.js route), so Zod validation in the app is not the only boundary.
-- These CHECKs mirror (or stay looser than) the application schemas and only
-- reject abusive/oversized input. All target tables are empty in production,
-- so adding constraints is safe.

-- providers: bound free-text contact/location fields (name/description already bounded in 0001)
alter table public.providers add constraint providers_phone_length check (char_length(phone) between 5 and 30);
alter table public.providers add constraint providers_email_length check (email is null or char_length(email) <= 254);
alter table public.providers add constraint providers_url_length check (
  (website is null or char_length(website) <= 500)
  and (facebook is null or char_length(facebook) <= 500)
  and (instagram is null or char_length(instagram) <= 500)
);
alter table public.providers add constraint providers_place_length check (
  char_length(city) between 1 and 80
  and (area is null or char_length(area) <= 200)
  and (address is null or char_length(address) <= 200)
);

-- services: name was unbounded
alter table public.services add constraint services_name_length check (char_length(name) between 1 and 120);

-- service_requests: mirror the application schema bounds
alter table public.service_requests add constraint service_requests_text_length check (
  char_length(service) between 1 and 120
  and char_length(location) between 1 and 120
  and char_length(description) between 10 and 2000
  and char_length(phone) between 5 and 30
  and (preferred_time is null or char_length(preferred_time) <= 120)
);

-- reports: contact was unbounded
alter table public.reports add constraint reports_contact_length check (contact is null or char_length(contact) <= 50);

-- provider_images metadata: bound caption/url (RLS cannot check lengths)
alter table public.provider_images add constraint provider_images_meta_length check (
  (caption is null or char_length(caption) <= 200)
  and char_length(url) <= 500
);

-- events analytics: bound event name, path, and payload size (anonymous writes)
alter table public.events add constraint events_payload_length check (
  char_length(event) between 1 and 60
  and (path is null or char_length(path) <= 200)
  and pg_column_size(meta) <= 4096
);

-- storage: object names must end in an allowed image extension. Upload paths
-- built by the app derive the extension from the validated MIME type, so
-- legitimate uploads are unaffected; direct-API uploads cannot smuggle
-- executable/script filenames past the MIME allowlist.
drop policy if exists "owners upload own provider images" on storage.objects;
create policy "owners upload own provider images"
on storage.objects for insert
with check (
  bucket_id = 'provider-images'
  and (storage.foldername(name))[1] is not null
  and name ~ '\.(jpg|jpeg|png|webp)$'
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
  and name ~ '\.(jpg|jpeg|png|webp)$'
  and exists (
    select 1 from public.providers p
    where p.id::text = (storage.foldername(name))[1]
      and p.owner_id = auth.uid()
      and p.status = 'approved'
  )
  and (metadata ->> 'mimetype') in ('image/jpeg', 'image/png', 'image/webp')
);
