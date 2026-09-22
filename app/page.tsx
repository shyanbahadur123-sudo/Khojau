import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import CategoryGrid from "@/components/CategoryGrid";
import ProviderCard from "@/components/ProviderCard";
import { CATEGORIES, POPULAR_SERVICES } from "@/lib/categories";
import { LOCATIONS } from "@/lib/locations";
import { getApprovedProviders } from "@/lib/providers";

export const metadata: Metadata = {
  title: "Khojau — Find Trusted Local Services Near You",
  description:
    "Discover electricians, plumbers, repair technicians, tutors, photographers and other local service providers across Nepal.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const featured = (await getApprovedProviders({ limit: 6 })).filter((p) =>
    ["featured", "premium"].includes(p.plan)
  );
  const latest = await getApprovedProviders({ limit: 6 });
  const popular = CATEGORIES.filter((c) => POPULAR_SERVICES.includes(c.slug));

  return (
    <div className="space-y-12 pt-6">
      <section aria-labelledby="hero-heading" className="rounded-2xl bg-[#FFFDF8] p-6 shadow-sm sm:p-10">
        <h1 id="hero-heading" className="max-w-xl text-3xl font-bold leading-tight sm:text-4xl">
          Find trusted local services near you.
        </h1>
        <p className="mt-3 max-w-xl text-base text-[#66706E]">
          Discover electricians, plumbers, repair technicians, tutors, photographers and other local service
          providers across Nepal.
        </p>
        <div className="mt-6"><Suspense><SearchBar /></Suspense></div>
      </section>

      <section aria-labelledby="popular-services">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="popular-services" className="text-xl font-bold">Popular services</h2>
          <Link href="/services" className="text-sm font-semibold text-[#0B7168] hover:underline">View all</Link>
        </div>
        <ul className="flex flex-wrap gap-2">
          {popular.map((c) => (
            <li key={c.slug}>
              <Link href={`/services/${c.slug}`} className="inline-block rounded-full border border-black/15 bg-[#FFFDF8] px-4 py-2 text-sm font-medium hover:border-[#0B7168]">
                <span aria-hidden>{c.icon} </span>{c.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="browse-categories">
        <h2 id="browse-categories" className="mb-4 text-xl font-bold">Browse categories</h2>
        <CategoryGrid limit={8} />
      </section>

      <section aria-labelledby="popular-locations">
        <h2 id="popular-locations" className="mb-4 text-xl font-bold">Popular locations</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {LOCATIONS.slice(0, 8).map((l) => (
            <li key={l.slug}>
              <Link href={`/locations/${l.slug}`} className="block rounded-xl border border-black/10 bg-[#FFFDF8] p-4 font-semibold hover:border-[#0B7168]">
                {l.city}
                <span className="block text-xs font-normal text-[#66706E]">{l.areas.slice(0, 3).join(" · ")}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {featured.length > 0 && (
        <section aria-labelledby="featured">
          <h2 id="featured" className="mb-4 text-xl font-bold">Featured providers</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => <ProviderCard key={p.id} provider={p} />)}
          </div>
        </section>
      )}

      {latest.length > 0 && (
        <section aria-labelledby="latest">
          <h2 id="latest" className="mb-4 text-xl font-bold">Recently added</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((p) => <ProviderCard key={p.id} provider={p} />)}
          </div>
        </section>
      )}
      {latest.length === 0 && (
        <section aria-label="Getting started" className="rounded-2xl border border-dashed border-black/20 p-6 text-sm text-[#66706E]">
          No public listings yet. Connect Supabase (see README + .env.example), run{" "}
          <code>supabase/migrations/0001_init.sql</code>, then add providers from the admin dashboard.
        </section>
      )}

      <section aria-labelledby="how" className="rounded-2xl bg-[#FFFDF8] p-6 sm:p-8">
        <h2 id="how" className="text-xl font-bold">How Khojau works</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          <li><p className="font-semibold">1. Search</p><p className="text-sm text-[#66706E]">Enter a service and location.</p></li>
          <li><p className="font-semibold">2. Compare</p><p className="text-sm text-[#66706E]">Open verified profiles with contact details.</p></li>
          <li><p className="font-semibold">3. Contact</p><p className="text-sm text-[#66706E]">Call, message on WhatsApp, or get directions.</p></li>
        </ol>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/add-business" className="rounded-lg bg-[#0B7168] px-5 py-3 font-semibold text-white">List your business — it&apos;s free</Link>
          <Link href="/request-service" className="rounded-lg border border-black/15 px-5 py-3 font-semibold">Request a service</Link>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Khojau",
            url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
            potentialAction: { "@type": "SearchAction", target: "{url}/search?service={query}", "query-input": "required name=query" },
          }),
        }}
      />
    </div>
  );
}
