import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProviderCard from "@/components/ProviderCard";
import SearchBar, { SearchBarSkeleton } from "@/components/SearchBar";
import CategoryIcon from "@/components/CategoryIcon";
import { CATEGORIES, categoryBySlug } from "@/lib/categories";
import { getApprovedProviders } from "@/lib/providers";
import { rankProviders } from "@/lib/search";
import { stringifyJsonLd } from "@/lib/validation";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const c = categoryBySlug(params.slug);
  if (!c) return { title: "Service not found" };
  return {
    title: `${c.name} in Nepal`,
    description: `Find trusted ${c.name.toLowerCase()} providers across Nepal. ${c.description ?? ""}`,
    alternates: { canonical: `/services/${c.slug}` },
  };
}

export const revalidate = 60;

export default async function ServiceDetailPage({ params }: { params: { slug: string } }) {
  const c = categoryBySlug(params.slug);
  if (!c) notFound();
  const providers = rankProviders(await getApprovedProviders({ categorySlug: c.slug, limit: 48 }), c.name, "");
  const related = CATEGORIES.filter((x) => x.slug !== c.slug).slice(0, 8);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return (
    <div className="space-y-6 pt-6">
      <nav className="text-sm text-[#6B7280]" aria-label="Breadcrumb">
        <Link href="/" className="hover:underline">Home</Link> / <Link href="/services" className="hover:underline">Services</Link> / <span aria-current="page">{c.name}</span>
      </nav>
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight sm:text-3xl"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#C9A227]/15 text-[#7A5C00]"><CategoryIcon slug={c.slug} className="h-5 w-5" /></span>{c.name} in Nepal</h1>
        {c.description && <p className="mt-2 max-w-2xl text-[#6B7280]">{c.description}</p>}
        <p className="mt-2 text-sm text-[#6B7280]" role="status">
          {providers.length === 0
            ? "No approved listings yet — be the first, or request this service below."
            : `${providers.length} approved provider${providers.length === 1 ? "" : "s"} · sorted by relevance`}
        </p>
      </div>
      <Suspense fallback={<SearchBarSkeleton />}><SearchBar compact /></Suspense>
      {providers.length === 0 ? (
        <div className="rounded-2xl border border-black/10 bg-[#FFFFFF] p-8 text-center shadow-sm">
          <p className="text-lg font-bold tracking-tight">No {c.name.toLowerCase()} listings yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-[#6B7280]">List your {c.name.toLowerCase()} business for free, or send a request and we&rsquo;ll help match you.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link href="/add-business" className="rounded-lg bg-[#C9A227] px-5 py-2.5 font-semibold text-black transition-colors hover:bg-[#B8941F]">Add your business</Link>
            <Link href="/request-service" className="rounded-lg border border-black/15 px-5 py-2.5 font-semibold transition-colors hover:bg-black/5">Request this service</Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((p) => <ProviderCard key={p.id} provider={p} />)}
        </div>
      )}
      <section aria-labelledby="related">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="related" className="text-lg font-bold tracking-tight">Related services</h2>
          <Link href="/services" className="text-sm font-semibold text-[#0A0A0A] hover:underline">View all</Link>
        </div>
        <ul className="flex flex-wrap gap-2">
          {related.map((r) => (
            <li key={r.slug}>
              <Link href={`/services/${r.slug}`} className="inline-flex items-center gap-2 rounded-full bg-black/5 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/10">
                <CategoryIcon slug={r.slug} className="h-4 w-4 text-[#7A5C00]" />
                {r.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: stringifyJsonLd({ "@context": "https://schema.org", "@type": "CollectionPage", name: `${c.name} in Nepal`, ...(providers.length > 0 ? { mainEntity: { "@type": "ItemList", itemListElement: providers.slice(0, 20).map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${siteUrl}/provider/${p.slug}`, name: p.business_name })) } } : {}) }) }} />
    </div>
  );
}
