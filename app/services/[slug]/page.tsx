import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProviderCard from "@/components/ProviderCard";
import SearchBar from "@/components/SearchBar";
import CategoryIcon from "@/components/CategoryIcon";
import { categoryBySlug } from "@/lib/categories";
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

export default async function ServiceDetailPage({ params }: { params: { slug: string } }) {
  const c = categoryBySlug(params.slug);
  if (!c) notFound();
  const providers = rankProviders(await getApprovedProviders({ categorySlug: c.slug, limit: 48 }), c.name, "");
  return (
    <div className="space-y-6 pt-6">
      <nav className="text-sm text-[#66706E]" aria-label="Breadcrumb">
        <Link href="/" className="hover:underline">Home</Link> / <Link href="/services" className="hover:underline">Services</Link> / <span aria-current="page">{c.name}</span>
      </nav>
      <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight"><span className="grid h-10 w-10 place-items-center rounded-lg bg-[#0B7168]/10 text-[#0B7168]"><CategoryIcon slug={c.slug} className="h-5 w-5" /></span>{c.name} in Nepal</h1>
      {c.description && <p className="text-[#66706E]">{c.description}</p>}
      <Suspense><SearchBar compact /></Suspense>
      {providers.length === 0 ? (
        <p className="rounded-xl bg-[#FFFDF8] p-6 text-sm text-[#66706E]">
          No approved {c.name.toLowerCase()} listings yet. <Link className="underline" href="/add-business">Add your business</Link> or <Link className="underline" href="/request-service">request this service</Link>.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((p) => <ProviderCard key={p.id} provider={p} />)}
        </div>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: stringifyJsonLd({ "@context": "https://schema.org", "@type": "CollectionPage", name: `${c.name} in Nepal` }) }} />
    </div>
  );
}
