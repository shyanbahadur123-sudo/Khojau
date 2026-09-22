import type { Metadata } from "next";
import { Suspense } from "react";
import SearchBar, { SearchBarSkeleton } from "@/components/SearchBar";
import ProviderCard from "@/components/ProviderCard";
import { getApprovedProviders } from "@/lib/providers";
import { filterProviders, rankProviders } from "@/lib/search";
import { CATEGORIES, categoryBySlug } from "@/lib/categories";

export const metadata: Metadata = { title: "Search services", alternates: { canonical: "/search" } };

const PAGE_SIZE = 12;
const MAX_PAGE = 50;

// Directory freshness: search results revalidate with the data cache.
export const revalidate = 60;

export default async function SearchPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  // Per-field parsing with independent fallbacks: one malformed parameter
  // must never reset the rest of the query (e.g. page=abc keeps q intact).
  const str = (k: string, max = 100) => (typeof searchParams[k] === "string" ? (searchParams[k] as string).slice(0, max) : "");
  const num = (k: string) => {
    const n = Number.parseInt(str(k, 10), 10);
    return Number.isFinite(n) ? n : NaN;
  };

  // Canonical `q`, legacy `service` fallback. Validated + length-capped.
  const query = (str("q") || str("service")).trim().slice(0, 100);
  const location = str("location").trim().slice(0, 100);
  // Category must be a known slug; unknown values are ignored, never queried raw.
  const rawCategory = str("category", 60);
  const categorySlug = CATEGORIES.some((c) => c.slug === rawCategory)
    ? rawCategory
    : categoryBySlug(query)?.slug ?? "";
  const verifiedRaw = str("verified", 10);
  const verifiedOnly = verifiedRaw === "1" || verifiedRaw.toLowerCase() === "true";
  const rawPlan = str("plan", 20);
  const plan = ["free", "featured", "premium"].includes(rawPlan) ? rawPlan : "";
  const rawPage = num("page");
  const page = Math.min(MAX_PAGE, Math.max(1, Number.isFinite(rawPage) ? rawPage : 1));
  const rawMin = Number(str("minPrice", 20));
  const rawMax = Number(str("maxPrice", 20));
  const minPrice = Number.isFinite(rawMin) && rawMin >= 0 ? rawMin : undefined;
  const maxPrice = Number.isFinite(rawMax) && rawMax >= 0 ? rawMax : undefined;
  const rawSort = str("sort", 20);
  const sort = ["price_asc", "price_desc"].includes(rawSort) ? rawSort : "relevance";
  const verifiedParam = verifiedOnly ? "1" : "";
  const hasActiveFilter = Boolean(query || location || categorySlug || plan || verifiedOnly || minPrice != null || maxPrice != null);

  let providers = await getApprovedProviders({ search: query, location, categorySlug: categorySlug || undefined, limit: 60 });
  providers = filterProviders(providers, { verifiedOnly, plan: plan || undefined, minPrice, maxPrice });
  providers = rankProviders(providers, query, location);
  // Explicit sort overrides relevance ranking. Unknown values fall back to relevance (validated above).
  if (sort === "price_asc") {
    providers = [...providers].sort((a, b) => (a.price_min ?? Number.MAX_SAFE_INTEGER) - (b.price_min ?? Number.MAX_SAFE_INTEGER));
  } else if (sort === "price_desc") {
    providers = [...providers].sort((a, b) => (b.price_max ?? b.price_min ?? -1) - (a.price_max ?? a.price_min ?? -1));
  }
  const total = providers.length;
  const paged = providers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const buildHref = (next: Record<string, string>) => {
    const p = new URLSearchParams();
    const base: Record<string, string> = { q: query, location, category: categorySlug, plan, verified: verifiedParam, sort: sort === "relevance" ? "" : sort };
    const merged = { ...base, ...next };
    for (const [k, val] of Object.entries(merged)) if (val) p.set(k, val);
    return `/search?${p.toString()}`;
  };

  return (
    <div className="space-y-6 pt-6">
      <h1 className="text-2xl font-bold">Search services</h1>
      <Suspense fallback={<SearchBarSkeleton />}><SearchBar compact /></Suspense>
      <form method="get" className="flex flex-wrap gap-2 text-sm" aria-label="Filters">
        <input type="hidden" name="q" value={query} />
        <input type="hidden" name="location" value={location} />
        <label className="flex items-center gap-1 rounded-full bg-black/5 px-3 py-2">
          <input type="checkbox" name="verified" value="1" defaultChecked={verifiedOnly} /> Verified only
        </label>
        <select name="plan" defaultValue={plan} className="rounded-full bg-black/5 px-3 py-2" aria-label="Plan filter">
          <option value="">All plans</option>
          <option value="free">Free</option>
          <option value="featured">Featured</option>
          <option value="premium">Premium</option>
        </select>
        <input
          type="number"
          name="minPrice"
          min={0}
          defaultValue={minPrice ?? ""}
          placeholder="Min Rs."
          aria-label="Minimum price"
          className="w-28 rounded-full bg-black/5 px-3 py-2"
        />
        <input
          type="number"
          name="maxPrice"
          min={0}
          defaultValue={maxPrice ?? ""}
          placeholder="Max Rs."
          aria-label="Maximum price"
          className="w-28 rounded-full bg-black/5 px-3 py-2"
        />
        <select name="sort" defaultValue={sort} className="rounded-full bg-black/5 px-3 py-2" aria-label="Sort results">
          <option value="relevance">Best match</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
        <button type="submit" className="rounded-full bg-[#C9A227] px-4 py-2 font-semibold text-black">Apply</button>
        {hasActiveFilter && <a href="/search" className="rounded-full bg-black/5 px-4 py-2 transition-colors hover:bg-black/10">Clear</a>}
      </form>
      <p className="text-sm text-[#6B7280]" role="status">
        {total === 0 ? "No providers found." : `${total} provider${total === 1 ? "" : "s"} found`}
        {query && <> for <strong>{query}</strong></>}
        {location && <> in <strong>{location}</strong></>}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {paged.map((p) => <ProviderCard key={p.id} provider={p} />)}
      </div>
      {total === 0 && (
        <div className="rounded-xl bg-[#FFFFFF] p-6 text-sm">
          <p className="font-semibold">Nothing matched your search.</p>
          <p className="mt-1 text-[#6B7280]">Try a broader service (e.g. “repair”) or a nearby area. Or <a className="underline" href="/request-service">request the service</a> and we’ll help match you.</p>
        </div>
      )}
      {total > PAGE_SIZE && (
        <nav className="flex gap-2" aria-label="Pagination">
          {page > 1 && <a href={buildHref({ page: String(page - 1) })} className="rounded-lg border px-4 py-2">Previous</a>}
          {(page * PAGE_SIZE < total) && <a href={buildHref({ page: String(page + 1) })} className="rounded-lg border px-4 py-2">Next</a>}
        </nav>
      )}
    </div>
  );
}
