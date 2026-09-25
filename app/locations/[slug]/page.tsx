import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SavedProviderBatch } from "@/components/SavedProviderBatch";
import ProviderCard from "@/components/ProviderCard";
import { LOCATIONS, locationBySlug } from "@/lib/locations";
import { getApprovedProvidersResult } from "@/lib/providers";
import { rankProviders } from "@/lib/search";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const l = locationBySlug(params.slug);
  if (!l) return { title: "Location not found" };
  return {
    title: `Local services in ${l.city}`,
    description: `Find electricians, plumbers, repair technicians and more in ${l.city}, Nepal.`,
    alternates: { canonical: `/locations/${l.slug}` },
  };
}

export const revalidate = 60;

export default async function LocationDetailPage({ params }: { params: { slug: string } }) {
  const l = locationBySlug(params.slug);
  if (!l) notFound();
  const fetched = await getApprovedProvidersResult({ location: l.city, limit: 48 });
  const providers = rankProviders(fetched.providers, "", l.city);
  const fetchFailed = fetched.error;
  const related = LOCATIONS.filter((x) => x.slug !== l.slug).slice(0, 8);
  return (
    <div className="space-y-6 pt-6">
      <nav className="text-sm text-[#6B7280]" aria-label="Breadcrumb">
        <Link href="/" className="hover:underline">Home</Link> / <Link href="/locations" className="hover:underline">Locations</Link> / <span aria-current="page">{l.city}</span>
      </nav>
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Local services in {l.city}</h1>
        {fetchFailed ? (
          <div role="alert" className="mt-2 rounded-xl bg-red-500/10 p-4 text-sm text-[#6B7280]">
            <span className="font-semibold text-red-700">Couldn’t load listings.</span>{" "}
            Try again shortly, or <a className="underline" href="/request-service">request help directly</a>.
          </div>
        ) : (
          <p className="mt-2 text-sm text-[#6B7280]" role="status">
            {providers.length === 0
              ? `No approved listings in ${l.city} yet — pick an area below or be the first to list.`
              : `${providers.length} approved provider${providers.length === 1 ? "" : "s"} · sorted by relevance`}
          </p>
        )}
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#6B7280]">Areas in {l.city}</p>
        <div className="flex flex-wrap gap-2">
          {l.areas.map((a) => (
            <Link key={a} href={`/search?location=${encodeURIComponent(`${a}, ${l.city}`)}`} className="rounded-full bg-black/5 px-3 py-1.5 text-sm transition-colors hover:bg-black/10">
              {a}
            </Link>
          ))}
        </div>
      </div>
      {providers.length === 0 ? (
        <div className="rounded-2xl border border-black/10 bg-[#FFFFFF] p-8 text-center shadow-sm">
          <p className="text-lg font-bold tracking-tight">No listings in {l.city} yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-[#6B7280]">List your {l.city} business for free, or send a request and we&rsquo;ll help match you.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link href="/add-business" className="rounded-lg bg-[#C9A227] px-5 py-2.5 font-semibold text-black transition-colors hover:bg-[#B8941F]">Add your business</Link>
            <Link href="/request-service" className="rounded-lg border border-black/15 px-5 py-2.5 font-semibold transition-colors hover:bg-black/5">Request this service</Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SavedProviderBatch>
            {providers.map((p) => <ProviderCard key={p.id} provider={p} />)}
          </SavedProviderBatch>
        </div>
      )}
      <section aria-labelledby="nearby">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="nearby" className="text-lg font-bold tracking-tight">Nearby cities</h2>
          <Link href="/locations" className="text-sm font-semibold text-[#0A0A0A] hover:underline">View all</Link>
        </div>
        <ul className="flex flex-wrap gap-2">
          {related.map((r) => (
            <li key={r.slug}>
              <Link href={`/locations/${r.slug}`} className="inline-block rounded-full bg-black/5 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/10">
                {r.city}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
