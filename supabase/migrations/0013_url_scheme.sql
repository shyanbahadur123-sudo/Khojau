-- Khojau hardening migration 0013: database-level URL scheme enforcement.
-- The application validates website/facebook/instagram as http(s)-only, but
-- direct API writes bypass application code. This CHECK enforces the same
-- invariant in the database: NULL (unset) or an absolute http(s) URL with an
-- authority section and no whitespace. Dangerous schemes (javascript:, data:,
-- vbscript:, file:, about:) and schemeless values are rejected.
alter table public.providers
  add constraint providers_url_scheme check (
    (website is null or website ~* '^https?://[^[:space:]]+$')
    and (facebook is null or facebook ~* '^https?://[^[:space:]]+$')
    and (instagram is null or instagram ~* '^https?://[^[:space:]]+$')
  );
