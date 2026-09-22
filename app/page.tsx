import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import CategoryGrid from "@/components/CategoryGrid";
import CategoryIcon from "@/components/CategoryIcon";
import { CheckIcon } from "@/components/UiIcon";
import ProviderCard from "@/components/ProviderCard";
import { CATEGORIES } from "@/lib/categories";
import { LOCATIONS } from "@/lib/locations";
import { getApprovedProviders } from "@/lib/providers";
import { getTrendingProviders, getUrgentNeeds } from "@/lib/discovery";
import { stringifyJsonLd } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Khojau — Find Trusted Local Services Near You",
  description:
    "Discover electricians, plumbers, repair technicians, tutors, photographers and other local service providers across Nepal.",
  alternates: { canonical: "/" },
};

const EXAMPLE_SEARCHES = ["Plumber", "Electrician", "AC repair", "Photographer", "Tutor", "Home cleaning"];

function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (!Number.isFinite(mins)) return "recently";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

export default async function HomePage() {
  // Single bounded fetch; sections derive from it (no duplicate queries).
  // Discovery sections are independently fail-safe: no key, no events, or no
  // open requests each yield [] and the section hides — never fake content.
  const all = await getApprovedProviders({ limit: 12 });
  const [trending, urgent] = await Promise.all([getTrendingProviders(6), getUrgentNeeds(6)]);
  const featured = all.filter((p) => p.plan === "featured" || p.plan === "premium");
  const latest = all.filter((p) => p.plan !== "featured" && p.plan !== "premium").slice(0, 6);

  return (
    <div className="space-y-8 pt-6 sm:space-y-12">
      <section aria-labelledby="hero-heading" className="rounded-2xl border border-black/10 border-t-2 border-t-[#C9A227] bg-[#FFFFFF] p-5 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#7A5C00] sm:tracking-[0.14em]">Nepal&rsquo;s local services directory</p>
        <h1 id="hero-heading" className="mt-2 max-w-xl text-[27px] font-bold leading-[1.15] tracking-tight sm:text-4xl">
          Find the right local service in Nepal.
          <span className="mt-1.5 block text-base font-normal leading-snug text-[#6B7280] sm:text-lg">Verified local providers. Direct contact. No middlemen.</span>
        </h1>
        <div className="mt-4"><Suspense><SearchBar /></Suspense></div>
        <div className="mt-2.5 flex items-center gap-2 text-[13px]">
          <span className="shrink-0 text-[#6B7280]">Try:</span>
          <div className="flex flex-1 gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {EXAMPLE_SEARCHES.map((s) => (
            <Link key={s} href={`/search?q=${encodeURIComponent(s)}`} className="shrink-0 whitespace-nowrap rounded-full bg-black/5 px-3 py-1 transition-colors hover:bg-black/10">
              {s}
            </Link>
          ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="browse-categories">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="browse-categories" className="text-xl font-bold tracking-tight">Browse categories</h2>
          <Link href="/services" className="text-sm font-semibold text-[#0A0A0A] hover:underline">View all</Link>
        </div>
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
              <Link href={`/locations/${l.slug}`} className="block rounded-xl bg-black/5 p-4 font-semibold transition-colors hover:bg-black/10">
                {l.city}
                <span className="block text-xs font-normal text-[#6B7280]">{l.areas.slice(0, 3).join(" · ")}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {featured.length > 0 && (
        <section aria-labelledby="featured">
          <h2 id="featured" className="mb-4 text-xl font-bold tracking-tight">Featured providers</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => <ProviderCard key={p.id} provider={p} />)}
          </div>
        </section>
      )}

      {trending.length > 0 && (
        <section aria-labelledby="trending">
          <div className="mb-1 flex items-center justify-between">
            <h2 id="trending" className="text-xl font-bold tracking-tight">Trending this week</h2>
            <Link href="/search" className="text-sm font-semibold text-[#0A0A0A] hover:underline">Search all</Link>
          </div>
          <p className="mb-4 text-sm text-[#6B7280]">Ranked by real visits and contact taps in the last 14 days.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {trending.map((p) => <ProviderCard key={p.id} provider={p} />)}
          </div>
        </section>
      )}

      {urgent.length > 0 && (
        <section aria-labelledby="urgent">
          <div className="mb-1 flex items-center justify-between">
            <h2 id="urgent" className="text-xl font-bold tracking-tight">Needs help now</h2>
            <Link href="/add-business" className="text-sm font-semibold text-[#0A0A0A] hover:underline">Offer a service</Link>
          </div>
          <p className="mb-4 text-sm text-[#6B7280]">Open customer requests. Contact details stay private.</p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {urgent.map((u) => (
              <li key={u.id} className="rounded-xl border border-black/10 bg-[#FFFFFF] p-4 shadow-sm">
                <p className="font-semibold leading-snug">{u.service}</p>
                <p className="mt-1 text-sm text-[#6B7280]">{u.location} · {timeAgo(u.created_at)}</p>
                <Link href="/add-business" className="mt-3 inline-block rounded-lg bg-[#C9A227] px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#B8941F]">
                  I offer this service
                </Link>
              </li>
            ))}
          </ul>
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
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[#C9A227]/15 text-[#7A5C00]">
            <CategoryIcon slug="other" className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Be the first business on Khojau</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#6B7280]">
            Khojau is a new directory for trusted local services in Nepal. List your business for free and get discovered by customers nearby.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href="/add-business" className="rounded-lg bg-[#C9A227] px-5 py-3 font-semibold text-black">List your business — it&apos;s free</Link>
            <Link href="/request-service" className="rounded-lg border border-black/15 px-5 py-3 font-semibold">Request a service</Link>
          </div>
        </section>
      )}

      <section aria-labelledby="how" className="rounded-2xl bg-[#FFFFFF] p-6 sm:p-8">
        <h2 id="how" className="text-xl font-bold tracking-tight">How Khojau works</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            ["1", "Search", "Enter a service and location, or browse categories."],
            ["2", "Compare", "Open profiles with services, prices, hours, and contact details."],
            ["3", "Contact", "Call, message on WhatsApp, get directions, or send a service request."],
          ].map(([n, t, d]) => (
            <li key={n} className="flex items-start gap-3">
              <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#C9A227]/15 text-sm font-bold text-[#7A5C00]">{n}</span>
              <span>
                <span className="block font-semibold">{t}</span>
                <span className="mt-0.5 block text-sm text-[#6B7280]">{d}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm"><Link href="/how-it-works" className="font-semibold text-[#111111] hover:underline">Learn more about how Khojau works →</Link></p>
      </section>

      <section aria-labelledby="for-providers" className="rounded-2xl border border-[#C9A227]/40 bg-[#C9A227]/10 p-6 sm:p-8">
        <h2 id="for-providers" className="text-xl font-bold">For service providers</h2>
        <ul className="mt-3 grid gap-3 text-[15px] sm:grid-cols-2">
          {["List your business for free", "Show your services and prices", "Receive service requests directly", "Grow your local visibility"].map((t) => (
            <li key={t} className="flex items-start gap-2">
              <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#7A5C00]" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5">
          <Link href="/add-business" className="inline-block rounded-lg bg-[#C9A227] px-5 py-3 font-semibold text-black">Add your business</Link>
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
        <Link href="/search" className="w-full rounded-lg bg-[#C9A227] px-6 py-3 font-semibold text-black sm:w-auto">Find a service</Link>
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
