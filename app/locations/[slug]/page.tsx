import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProviderCard from "@/components/ProviderCard";
import { LOCATIONS, locationBySlug } from "@/lib/locations";
import { getApprovedProviders } from "@/lib/providers";
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

export default async function LocationDetailPage({ params }: { params: { slug: string } }) {
  const l = locationBySlug(params.slug);
  if (!l) notFound();
  const providers = rankProviders(await getApprovedProviders({ search: l.city, limit: 48 }), "", l.city);
  return (
    <div className="space-y-6 pt-6">
      <nav className="text-sm text-[#66706E]" aria-label="Breadcrumb">
        <Link href="/" className="hover:underline">Home</Link> / <Link href="/locations" className="hover:underline">Locations</Link> / <span aria-current="page">{l.city}</span>
      </nav>
      <h1 className="text-2xl font-bold">Local services in {l.city}</h1>
      <div className="flex flex-wrap gap-2">
        {l.areas.map((a) => (
          <Link key={a} href={`/search?location=${encodeURIComponent(`${a}, ${l.city}`)}`} className="rounded-full border border-black/15 bg-white px-3 py-1.5 text-sm hover:border-[#0B7168]">
            {a}
          </Link>
        ))}
      </div>
      {providers.length === 0 ? (
        <p className="rounded-xl bg-[#FFFDF8] p-6 text-sm text-[#66706E]">No approved listings in {l.city} yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((p) => <ProviderCard key={p.id} provider={p} />)}
        </div>
      )}
    </div>
  );
}
