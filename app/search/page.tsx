import type { Metadata } from "next";
import { Suspense } from "react";
import SearchBar from "@/components/SearchBar";
import ProviderCard from "@/components/ProviderCard";
import { getApprovedProviders } from "@/lib/providers";
import { filterProviders, rankProviders } from "@/lib/search";
import { searchParamsSchema } from "@/lib/validation";
import { categoryBySlug } from "@/lib/categories";

export const metadata: Metadata = { title: "Search services", alternates: { canonical: "/search" } };

const PAGE_SIZE = 12;

export default async function SearchPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const parsedResult = searchParamsSchema.safeParse(searchParams);
  const q = parsedResult.success ? parsedResult.data : { service: "", location: "", category: "", verified: "", plan: "", page: 1 as number, minPrice: undefined, maxPrice: undefined };
  const service = (searchParams.service ?? "") as string;
  const location = (searchParams.location ?? "") as string;
  const category = (searchParams.category ?? "") as string;
  const verifiedOnly = searchParams.verified === "1" || searchParams.verified === "true";
  const plan = (searchParams.plan ?? "") as string;
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);

  const categorySlug = category || (categoryBySlug(service)?.slug ?? "");
  let providers = await getApprovedProviders({ search: `${service} ${location}`.trim(), categorySlug: categorySlug || undefined, limit: 100 });
  providers = filterProviders(providers, {
    verifiedOnly,
    plan: plan || undefined,
    minPrice: parsedResult.success ? parsedResult.data.minPrice : undefined,
    maxPrice: parsedResult.success ? parsedResult.data.maxPrice : undefined,
  });
  providers = rankProviders(providers, service, location);
  const total = providers.length;
  const paged = providers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const buildHref = (next: Record<string, string>) => {
    const p = new URLSearchParams();
    const base: Record<string, string> = { service, location, category, plan, verified: searchParams.verified ?? "" };
    const merged = { ...base, ...next };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    return `/search?${p.toString()}`;
  };

  return (
    <div className="space-y-6 pt-6">
      <h1 className="text-2xl font-bold">Search services</h1>
      <Suspense><SearchBar compact /></Suspense>
      <form method="get" className="flex flex-wrap gap-2 text-sm" aria-label="Filters">
        <input type="hidden" name="service" value={service} />
        <input type="hidden" name="location" value={location} />
        <label className="flex items-center gap-1 rounded-full border border-black/15 bg-white px-3 py-2">
          <input type="checkbox" name="verified" value="1" defaultChecked={verifiedOnly} /> Verified only
        </label>
        <select name="plan" defaultValue={plan} className="rounded-full border border-black/15 bg-white px-3 py-2" aria-label="Plan filter">
          <option value="">All plans</option>
          <option value="free">Free</option>
          <option value="featured">Featured</option>
          <option value="premium">Premium</option>
        </select>
        <button type="submit" className="rounded-full bg-[#0B7168] px-4 py-2 font-semibold text-white">Apply</button>
        {(service || location) && <a href="/search" className="rounded-full border border-black/15 px-4 py-2">Clear</a>}
      </form>
      <p className="text-sm text-[#66706E]" role="status">
        {total === 0 ? "No providers found." : `${total} provider${total === 1 ? "" : "s"} found`}
        {service && <> for <strong>{service}</strong></>}
        {location && <> in <strong>{location}</strong></>}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {paged.map((p) => <ProviderCard key={p.id} provider={p} />)}
      </div>
      {total === 0 && (
        <div className="rounded-xl bg-[#FFFDF8] p-6 text-sm">
          <p className="font-semibold">Nothing matched your search.</p>
          <p className="mt-1 text-[#66706E]">Try a broader service (e.g. “repair”) or a nearby area. Or <a className="underline" href="/request-service">request the service</a> and we’ll help match you.</p>
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
