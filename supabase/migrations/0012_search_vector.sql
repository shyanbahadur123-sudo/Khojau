-- Khojau search migration 0012: queryable full-text search vector.
-- Why: 0001 created a GIN index on a to_tsvector EXPRESSION, which PostgREST
-- cannot reference, so application search fell back to ILIKE scans. A
-- GENERATED STORED tsvector column exposes the same document through a real
-- column that `.textSearch()` can use, keeping PostgreSQL as the MVP search
-- engine (no external service). The redundant expression index is dropped so
-- writes maintain a single search index.

alter table public.providers
  add column if not exists search_tsv tsvector
  generated always as (
    to_tsvector('english',
      coalesce(business_name, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(city, '') || ' ' ||
      coalesce(area, '') || ' ' ||
      coalesce(address, '')
    )
  ) stored;

create index if not exists providers_search_tsv_idx
  on public.providers using gin (search_tsv);

drop index if exists public.providers_search_idx;
