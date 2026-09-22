import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import CategoryGrid from "@/components/CategoryGrid";
import CategoryIcon from "@/components/CategoryIcon";
import { CheckIcon } from "@/components/UiIcon";
import ProviderCard from "@/components/ProviderCard";
import { CATEGORIES, POPULAR_SERVICES } from "@/lib/categories";
import { LOCATIONS } from "@/lib/locations";
import { getApprovedProviders } from "@/lib/providers";
import { stringifyJsonLd } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Khojau — Find Trusted Local Services Near You",
  description:
    "Discover electricians, plumbers, repair technicians, tutors, photographers and other local service providers across Nepal.",
  alternates: { canonical: "/" },
};

const EXAMPLE_SEARCHES = ["Plumber", "Electrician", "AC repair", "Photographer", "Tutor", "Home cleaning"];

export default async function HomePage() {
  // Single bounded fetch; sections derive from it (no duplicate queries).
  const all = await getApprovedProviders({ limit: 12 });
  const featured = all.filter((p) => p.plan === "featured" || p.plan === "premium");
  const latest = all.filter((p) => p.plan !== "featured" && p.plan !== "premium").slice(0, 6);
  const popular = CATEGORIES.filter((c) => POPULAR_SERVICES.includes(c.slug));

  return (
    <div className="space-y-12 pt-6">
      <section aria-labelledby="hero-heading" className="rounded-2xl border border-black/10 bg-[#FFFFFF] p-6 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#111111]">Nepal&rsquo;s local services directory</p>
        <h1 id="hero-heading" className="mt-2 max-w-xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          Find the right local service in Nepal.
          <span className="mt-2 block text-lg font-normal leading-snug text-[#6B7280]">Verified local providers. Direct contact. No middlemen.</span>
        </h1>
        <p className="mt-3 max-w-xl text-base text-[#6B7280]">
          Discover electricians, plumbers, repair technicians, tutors, photographers and other local service
          providers across Nepal. Call them directly or send a service request.
        </p>
        <div className="mt-6"><Suspense><SearchBar /></Suspense></div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-[#6B7280]">Try:</span>
          {EXAMPLE_SEARCHES.map((s) => (
            <Link key={s} href={`/search?q=${encodeURIComponent(s)}`} className="rounded-full border border-black/15 bg-white px-3 py-1 hover:border-[#111111]">
              {s}
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="popular-services">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="popular-services" className="text-xl font-bold">Popular services</h2>
          <Link href="/services" className="text-sm font-semibold text-[#111111] hover:underline">View all categories</Link>
        </div>
        <ul className="flex flex-wrap gap-2">
          {popular.map((c) => (
            <li key={c.slug}>
              <Link href={`/services/${c.slug}`} className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-[#FFFFFF] px-4 py-2 text-sm font-medium text-[#0A0A0A] transition-colors hover:border-[#111111]/50 hover:text-[#111111]">
                <CategoryIcon slug={c.slug} className="h-4 w-4 text-[#111111]" />
                {c.name}
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
        <div className="mb-4 flex items-center justify-between">
          <h2 id="popular-locations" className="text-xl font-bold">Popular locations</h2>
          <Link href="/locations" className="text-sm font-semibold text-[#111111] hover:underline">View all</Link>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {LOCATIONS.slice(0, 8).map((l) => (
            <li key={l.slug}>
              <Link href={`/locations/${l.slug}`} className="block rounded-xl border border-black/10 bg-[#FFFFFF] p-4 font-semibold hover:border-[#111111]">
                {l.city}
                <span className="block text-xs font-normal text-[#6B7280]">{l.areas.slice(0, 3).join(" · ")}</span>
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
      {all.length === 0 && (
        <section aria-label="Get started" className="rounded-2xl border border-black/10 bg-[#FFFFFF] p-6 text-center shadow-sm sm:p-10">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[#111111]/10 text-[#111111]">
            <CategoryIcon slug="other" className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Be the first business on Khojau</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#6B7280]">
            Khojau is a new directory for trusted local services in Nepal. List your business for free and get discovered by customers nearby.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href="/add-business" className="rounded-lg bg-[#111111] px-5 py-3 font-semibold text-white">List your business — it&apos;s free</Link>
            <Link href="/request-service" className="rounded-lg border border-black/15 px-5 py-3 font-semibold">Request a service</Link>
          </div>
        </section>
      )}

      <section aria-labelledby="how" className="rounded-2xl bg-[#FFFFFF] p-6 sm:p-8">
        <h2 id="how" className="text-xl font-bold">How Khojau works</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          <li><p className="font-semibold">1. Search</p><p className="text-sm text-[#6B7280]">Enter a service and location, or browse categories.</p></li>
          <li><p className="font-semibold">2. Compare</p><p className="text-sm text-[#6B7280]">Open profiles with services, prices, hours, and contact details.</p></li>
          <li><p className="font-semibold">3. Contact</p><p className="text-sm text-[#6B7280]">Call, message on WhatsApp, get directions, or send a service request.</p></li>
        </ol>
        <p className="mt-4 text-sm"><Link href="/how-it-works" className="font-semibold text-[#111111] hover:underline">Learn more about how Khojau works →</Link></p>
      </section>

      <section aria-labelledby="for-providers" className="rounded-2xl border border-[#111111]/25 bg-[#111111]/5 p-6 sm:p-8">
        <h2 id="for-providers" className="text-xl font-bold">For service providers</h2>
        <ul className="mt-3 grid gap-3 text-[15px] sm:grid-cols-2">
          {["List your business for free", "Show your services and prices", "Receive service requests directly", "Grow your local visibility"].map((t) => (
            <li key={t} className="flex items-start gap-2">
              <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#111111]" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5">
          <Link href="/add-business" className="inline-block rounded-lg bg-[#111111] px-5 py-3 font-semibold text-white">Add your business</Link>
        </div>
      </section>

      <section aria-labelledby="trust" className="rounded-2xl bg-[#FFFFFF] p-6 sm:p-8">
        <h2 id="trust" className="text-xl font-bold">Why trust Khojau listings?</h2>
        <ul className="mt-3 max-w-2xl space-y-2 text-[15px] text-[#0A0A0A]/85">
          <li><strong>Reviewed listings.</strong> Every business is reviewed by our team before it appears publicly.</li>
          <li><strong>Verified badge.</strong> Verified businesses have passed Khojau&apos;s current verification checks — currently contact and business-detail confirmation.</li>
          <li><strong>Direct contact.</strong> Phone numbers and addresses are shown as submitted, so you can verify details yourself before hiring.</li>
          <li><strong>Report problems.</strong> Wrong number or closed business? Every provider page has a report link our team reviews.</li>
        </ul>
        <p className="mt-3 text-sm text-[#6B7280]">Khojau does not display ratings or reviews yet — and never invents them.</p>
      </section>

      <section aria-label="Get started" className="flex flex-col items-center gap-3 rounded-2xl bg-[#0A0A0A] p-8 text-center sm:flex-row sm:justify-center sm:gap-4">
        <Link href="/search" className="w-full rounded-lg bg-[#111111] px-6 py-3 font-semibold text-white sm:w-auto">Find a service</Link>
        <Link href="/add-business" className="w-full rounded-lg border border-white/30 px-6 py-3 font-semibold text-white sm:w-auto">List your business</Link>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: stringifyJsonLd({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Khojau",
            url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
            potentialAction: { "@type": "SearchAction", target: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/search?q={query}`, "query-input": "required name=query" },
          }),
        }}
      />
    </div>
  );
}
