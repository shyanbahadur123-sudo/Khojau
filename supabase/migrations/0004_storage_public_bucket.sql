-- Khojau storage migration 0004: serve approved images over the public endpoint.
-- The /object/public/ endpoint only serves buckets flagged public=true.
-- Row Level Security on storage.objects STILL applies: the SELECT policy from
-- 0003 ("public read approved provider images") keeps gating every read, so
-- only objects under APPROVED providers' folders are reachable. Verified by
-- tests E (approved -> 200) and F (pending -> denied) after applying.
update storage.buckets set public = true where id = 'provider-images';
