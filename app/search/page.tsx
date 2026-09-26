import type { Metadata } from "next";
import { Suspense } from "react";
import SearchBar, { SearchBarSkeleton } from "@/components/SearchBar";
import ProviderCard from "@/components/ProviderCard";
import { SavedProviderBatch } from "@/components/SavedProviderBatch";
import { PageHeader } from "@/components/PageHeader";
import { InlineAlert } from "@/components/InlineAlert";
import { EmptyPanel } from "@/components/EmptyPanel";
import { getApprovedProvidersResult } from "@/lib/providers";
import { filterProviders, rankProviders } from "@/lib/search";
import { CATEGORIES, categoryBySlug } from "@/lib/categories";

export const metadata: Metadata = { title: "Search services", alternates: { canonical: "/search" } };

const PAGE_SIZE = 12;
// Source rows are capped at 60, so pages past 5 would always be empty.
const MAX_PAGE = 5;

// Directory freshness: search results revalidate with the data cache.
export const revalidate = 60;

export default async function SearchPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const str = (k: string, max = 100) => (typeof searchParams[k] === "string" ? (searchParams[k] as string).slice(0, max) : "");
  const num = (k: string) => {
    const n = Number.parseInt(str(k, 10), 10);
    return Number.isFinite(n) ? n : NaN;
  };
  const query = (str("q") || str("service")).trim().slice(0, 100);
  const location = str("location").trim().slice(0, 100);
  const rawCategory = str("category", 60);
  const categorySlug = CATEGORIES.some((c) => c.slug === rawCategory)
    ? rawCategory
    : categoryBySlug(query)?.slug ?? "";
  const verifiedOnly = ["1", "true"].includes(str("verified", 10).toLowerCase());
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

  const { providers: found, error: fetchFailed } = await getApprovedProvidersResult({
    search: query,
    location,
    categorySlug: categorySlug || undefined,
    limit: 60,
  });

  let providers = found;
  if (fetchFailed) {
    return (
      <div className="space-y-6 pt-4 sm:pt-6">
        <PageHeader
          eyebrow="Search"
          title="Find local services"
          hint="Search trusted providers across Nepal"
          actions={<a href="/search" className="rounded-full border border-black/15 px-4 py-2">Retry</a>}
        />
        <InlineAlert
          title="Search is temporarily unavailable"
          note={<>This is on our side — your search is safe. <a href="/search" className="underline underline-offset-2">Try again</a> or <a className="underline" href="/request-service">request the service directly</a>.</>}
        />
      </div>
    );
  }

  providers = filterProviders(providers, { verifiedOnly, plan: plan || undefined, minPrice, maxPrice });
  providers = rankProviders(providers, query, location);
  if (sort === "price_asc") {
    providers = [...providers].sort((a, b) => (a.price_min ?? Number.MAX_SAFE_INTEGER) - (b.price_min ?? Number.MAX_SAFE_INTEGER));
  } else if (sort === "price_desc") {
    providers = [...providers].sort((a, b) => (b.price_max ?? b.price_min ?? -1) - (a.price_max ?? a.price_min ?? -1));
  }
  const total = providers.length;
  const paged = providers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const buildHref = (next: Record<string, string>) => {
    const p = new URLSearchParams();
    const base: Record<string, string> = { q: query, location, category: categorySlug, plan, verified: verifiedParam, sort: sort === "relevance" ? "" : sort, minPrice: minPrice != null ? String(minPrice) : "", maxPrice: maxPrice != null ? String(maxPrice) : "" };
    const merged = { ...base, ...next };
    for (const [k, val] of Object.entries(merged)) if (val) p.set(k, val);
    return `/search?${p.toString()}`;
  };

  const chips: { label: string; href: string }[] = [];
  if (query) chips.push({ label: query, href: buildHref({ q: "" }) });
  if (location) chips.push({ label: location, href: buildHref({ location: "" }) });
  if (categorySlug && categorySlug.toLowerCase() !== query.toLowerCase()) chips.push({ label: categorySlug, href: buildHref({ category: "" }) });
  if (verifiedOnly) chips.push({ label: "Verified", href: buildHref({ verified: "" }) });
  if (plan) chips.push({ label: plan, href: buildHref({ plan: "" }) });
  if (minPrice != null) chips.push({ label: `Min Rs.${minPrice}`, href: buildHref({ minPrice: "" }) });
  if (maxPrice != null) chips.push({ label: `Max Rs.${maxPrice}`, href: buildHref({ maxPrice: "" }) });

  return (
    <div className="space-y-5 pt-4 sm:pt-6">
      <PageHeader
        eyebrow="Search"
        title={query || location ? `${query || "Services"}${location ? ` in ${location}` : ""}` : "Find local services"}
        hint="Search trusted providers across Nepal"
      />
      <div className="sticky top-14 z-20 -mx-1 rounded-2xl border border-black/10 bg-[#FAFAFA]/95 px-2 py-2 backdrop-blur-md dark:bg-[#0A0A0A]/95 lg:top-4">
        <Suspense fallback={<SearchBarSkeleton />}><SearchBar /></Suspense>
      </div>
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
          {chips.map((c) => (
            <a key={c.label} href={c.href} className="inline-flex min-h-[36px] items-center gap-1 rounded-full bg-black/5 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/10" title={`Remove ${c.label}`}>
              {c.label} <span aria-hidden="true">×</span>
            </a>
          ))}
          <a href="/search" className="inline-flex min-h-[36px] items-center rounded-full px-3 py-1.5 text-sm font-semibold underline underline-offset-2">Clear all</a>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#6B7280]" role="status">
          {total === 0 ? "No providers found." : `${total} provider${total === 1 ? "" : "s"} found`}
          {query && <> for <strong>{query}</strong></>}
          {location && <> in <strong>{location}</strong></>}
        </p>
        <form method="get" className="flex flex-wrap items-center gap-2 text-sm" aria-label="Filters">
          <input type="hidden" name="q" value={query} />
          <input type="hidden" name="location" value={location} />
          <input type="hidden" name="category" value={categorySlug} />
          <label className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-black/5 px-3 py-1.5">
            <input type="checkbox" name="verified" value="1" defaultChecked={verifiedOnly} className="h-4 w-4" /> Verified
          </label>
          <select name="plan" defaultValue={plan} className="min-h-[36px] rounded-full bg-black/5 px-3 py-1.5" aria-label="Plan filter">
            <option value="">All plans</option>
            <option value="free">Free</option>
            <option value="featured">Featured</option>
            <option value="premium">Premium</option>
          </select>
          <label className="sr-only" htmlFor="minPrice">Minimum price</label>
          <input id="minPrice" type="number" name="minPrice" min={0} defaultValue={minPrice ?? ""} placeholder="Min Rs." className="h-[36px] w-24 rounded-full bg-black/5 px-3" />
          <label className="sr-only" htmlFor="maxPrice">Maximum price</label>
          <input id="maxPrice" type="number" name="maxPrice" min={0} defaultValue={maxPrice ?? ""} placeholder="Max Rs." className="h-[36px] w-24 rounded-full bg-black/5 px-3" />
          <select name="sort" defaultValue={sort} className="min-h-[36px] rounded-full bg-black/5 px-3 py-1.5" aria-label="Sort results">
            <option value="relevance">Best match</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
          <button type="submit" className="min-h-[36px] rounded-full bg-[#C9A227] px-4 py-1.5 font-semibold text-black">Apply</button>
        </form>
      </div>
      {total > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SavedProviderBatch>
            {paged.map((p) => <ProviderCard key={p.id} provider={p} />)}
          </SavedProviderBatch>
        </div>
      ) : (
        <EmptyPanel
          title="Nothing matched that search"
          note={<span>Try a broader service term or a nearby area.</span>}
        >
          <a href="/search" className="rounded-full bg-[#C9A227] px-4 py-2 font-semibold text-black">Clear filters</a>
          <a href="/services" className="rounded-full border border-black/15 px-4 py-2">Browse categories</a>
        </EmptyPanel>
      )}
      {total > PAGE_SIZE && (
        <nav aria-label="Search results pages" className="flex items-center justify-center gap-2 text-sm">
          {page > 1 && <a href={buildHref({ page: String(page - 1) })} aria-label="Go to previous results page" className="inline-flex min-h-[44px] items-center rounded-full border px-4 py-2">Previous</a>}
          <span className="px-1 text-[13px] font-medium text-[#6B7280]" aria-hidden="true">
            Page {page} of {Math.ceil(total / PAGE_SIZE)}
          </span>
          {(page * PAGE_SIZE < total) && <a href={buildHref({ page: String(page + 1) })} aria-label="Go to next results page" className="inline-flex min-h-[44px] items-center rounded-full border px-4 py-2">Next</a>}
        </nav>
      )}
    </div>
  );
}
