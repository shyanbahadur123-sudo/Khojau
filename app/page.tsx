import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import SearchBar, { SearchBarSkeleton } from "@/components/SearchBar";
import CategoryGrid from "@/components/CategoryGrid";
import { SavedProviderBatch } from "@/components/SavedProviderBatch";
import CategoryIcon from "@/components/CategoryIcon";
import { CheckIcon, SearchIcon, UserIcon } from "@/components/UiIcon";
import ProviderCard from "@/components/ProviderCard";
import { CATEGORIES } from "@/lib/categories";
import { LOCATIONS } from "@/lib/locations";
import { getApprovedProvidersResult } from "@/lib/providers";
import { getTrendingProviders, getUrgentNeeds } from "@/lib/discovery";
import { stringifyJsonLd } from "@/lib/validation";
import { supabaseServer } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Khojau — Find Trusted Local Services Near You",
  description:
    "Discover electricians, plumbers, repair technicians, tutors, photographers and other local service providers across Nepal.",
  alternates: { canonical: "/" },
};

// The directory must never serve yesterday's listings: revalidate the static
// shell AND every Supabase fetch (including supabase-js calls, which ride on
// Next's fetch cache) every 60 seconds. Approvals go live within a minute.
export const revalidate = 60;

const EXAMPLE_SEARCHES = ["Plumber", "Electrician", "AC repair", "Photographer", "Tutor", "Home cleaning"];

const QUICK_ACTIONS = [
  { href: "/search", title: "Find Services", sub: "Search by service + area", Icon: SearchIcon },
  { href: "/request-service", title: "Request Help", sub: "Describe it, get a callback", Icon: CheckIcon },
  { href: "/requests", title: "My Requests", sub: "Track status + history", Icon: CheckIcon },
  { href: "/dashboard", title: "Dashboard", sub: "Listings + profile", Icon: UserIcon },
];

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
  // Recent listings are members-only: check the session before rendering them.
  // Search / Services browsing stays public; provider detail + /recent require login (middleware).
  let loggedIn = false;
  try {
    const sb = supabaseServer();
    if (sb) {
      const { data: { user } } = await sb.auth.getUser();
      loggedIn = !!user;
    }
  } catch {
    loggedIn = false;
  }
  // Single bounded fetch; sections derive from it (no duplicate queries).
  // Discovery sections are independently fail-safe: no key, no events, or no
  // open requests each yield [] and the section hides — never fake content.
  const { providers: all, error: listingsFailed } = await getApprovedProvidersResult({ limit: 12 });
  const [trending, urgent] = await Promise.all([getTrendingProviders(6), getUrgentNeeds(6)]);
  const featured = all.filter((p) => p.plan === "featured" || p.plan === "premium");
  const latest = all.filter((p) => p.plan !== "featured" && p.plan !== "premium").slice(0, 6);

  return (
    <div className="space-y-8 pt-6 sm:space-y-10 sm:pt-8">
      {/* App console: status + search first, no marketing hero. */}
      <section aria-labelledby="app-heading" className="rounded-3xl border border-black/10 bg-[#FFFFFF] p-5 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7A5C00]">Khojau app</p>
          {loggedIn ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C9A227]/15 px-3 py-1 text-xs font-semibold text-[#7A5C00]">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#C9A227]" /> Member
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-[#6B7280]">
              Guest mode • <Link href="/login?next=/search" className="underline underline-offset-2">Log in</Link>
            </span>
          )}
        </div>
        <h1 id="app-heading" className="mt-2 text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl">
          What do you need done today?
        </h1>
        <p className="mt-2 text-[15px] text-[#6B7280]">Search verified local providers across Nepal — direct contact, no middlemen.</p>
        <div className="mt-3"><Suspense fallback={<SearchBarSkeleton />}><SearchBar /></Suspense></div>
        <div className="mt-2.5 flex items-center gap-2 text-[13px]">
          <span className="shrink-0 text-[#6B7280]">Try:</span>
          <div className="flex flex-1 gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {EXAMPLE_SEARCHES.map((s) => (
            <Link key={s} href={`/search?q=${encodeURIComponent(s)}`} className="shrink-0 whitespace-nowrap rounded-full bg-black/5 px-3 py-1.5 transition-colors hover:bg-black/10">
              {s}
            </Link>
          ))}
          </div>
        </div>
      </section>

      {/* Quick actions: task launcher. Gated routes land on login for guests. */}
      <section aria-labelledby="quick-actions">
        <h2 id="quick-actions" className="sr-only">Quick actions</h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {QUICK_ACTIONS.map(({ href, title, sub, Icon }) => (
            <li key={href + title}>
              <Link
                href={href}
                className="flex h-full min-h-[84px] items-center gap-3 rounded-2xl border border-black/10 bg-[#FFFFFF] p-4 shadow-sm transition-all hover:-translate-y-[1px] hover:shadow-md active:translate-y-0"
              >
                <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#C9A227]/15 text-[#7A5C00]">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-semibold leading-snug">{title}</span>
                  <span className="block truncate text-xs text-[#6B7280]">{sub}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {loggedIn ? (
        listingsFailed ? (
          <section aria-labelledby="latest" className="scroll-mt-20 rounded-2xl border border-red-300/60 bg-red-500/10 p-6 text-center">
            <h2 id="latest" className="text-2xl font-bold tracking-tight">Recent listings</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#6B7280]">
              We couldn’t load recent listings right now. Your account is fine — try again shortly.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link href="/" className="rounded-full bg-[#C9A227] px-5 py-2.5 font-semibold text-black transition-colors hover:bg-[#B8941F]">Refresh</Link>
            </div>
          </section>
        ) : latest.length > 0 && (
          <section aria-labelledby="latest" className="scroll-mt-20">
            <div className="mb-1 flex items-center justify-between">
              <h2 id="latest" className="text-2xl font-bold tracking-tight">Recent</h2>
              <Link href="/recent" className="text-sm font-semibold text-[#0A0A0A] hover:underline">View all</Link>
            </div>
            <p className="mb-4 text-sm text-[#6B7280]">Newly approved listings, newest first.</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <SavedProviderBatch>
                {latest.map((p) => <ProviderCard key={p.id} provider={p} />)}
              </SavedProviderBatch>
            </div>
          </section>
        )
      ) : (
        <section aria-labelledby="latest" className="scroll-mt-20 rounded-2xl border border-black/10 bg-[#FFFFFF] p-6 text-center shadow-sm sm:p-8">
          <h2 id="latest" className="text-2xl font-bold tracking-tight">Recent listings</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#6B7280]">
            Newly approved listings are visible to members only. Log in to browse recent posts and full provider details.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href="/login?next=/recent" className="rounded-full bg-[#C9A227] px-5 py-2.5 font-semibold text-black transition-colors hover:bg-[#B8941F]">Log in to view</Link>
            <Link href="/register" className="rounded-full border border-black/15 px-5 py-2.5 font-semibold transition-colors hover:bg-black/5">Create account</Link>
          </div>
        </section>
      )}

      <section aria-labelledby="browse-categories">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="browse-categories" className="text-2xl font-bold tracking-tight">Categories</h2>
          <Link href="/services" className="inline-flex min-h-[36px] items-center text-sm font-semibold text-[#0A0A0A] hover:underline">View all {CATEGORIES.length}</Link>
        </div>
        <CategoryGrid limit={8} />
      </section>

      <section aria-labelledby="popular-locations">
        <div className="mb-2 flex items-center justify-between">
          <h2 id="popular-locations" className="text-2xl font-bold tracking-tight">Locations</h2>
          <Link href="/locations" className="inline-flex min-h-[36px] items-center text-sm font-semibold text-[#111111] hover:underline">View all</Link>
        </div>
        <ul className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {LOCATIONS.slice(0, 8).map((l) => (
            <li key={l.slug} className="shrink-0">
              <Link href={`/locations/${l.slug}`} className="block whitespace-nowrap rounded-full bg-black/5 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-black/10">
                {l.city}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {featured.length > 0 && (
        <section aria-labelledby="featured">
          <h2 id="featured" className="mb-4 text-xl font-bold tracking-tight">Featured providers</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <SavedProviderBatch>
              {featured.map((p) => <ProviderCard key={p.id} provider={p} />)}
            </SavedProviderBatch>
          </div>
        </section>
      )}

      {trending.length > 0 && (
        <section aria-labelledby="trending">
          <div className="mb-1 flex items-center justify-between">
            <h2 id="trending" className="text-2xl font-bold tracking-tight">Trending this week</h2>
            <Link href="/search" className="text-sm font-semibold text-[#0A0A0A] hover:underline">Search all</Link>
          </div>
          <p className="mb-4 text-sm text-[#6B7280]">Ranked by real visits and contact taps in the last 14 days.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <SavedProviderBatch>
              {trending.map((p) => <ProviderCard key={p.id} provider={p} />)}
            </SavedProviderBatch>
          </div>
        </section>
      )}

      {urgent.length > 0 && (
        <section aria-labelledby="urgent">
          <div className="mb-1 flex items-center justify-between">
            <h2 id="urgent" className="text-2xl font-bold tracking-tight">Needs help now</h2>
            <Link href="/add-business" className="text-sm font-semibold text-[#0A0A0A] hover:underline">Offer a service</Link>
          </div>
          <p className="mb-4 text-sm text-[#6B7280]">Open customer requests. Contact details stay private.</p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {urgent.map((u) => (
              <li key={u.id} className="rounded-2xl border border-black/10 bg-[#FFFFFF] p-5 shadow-sm">
                <p className="break-words font-semibold leading-snug">{u.service}</p>
                <p className="mt-1 text-sm text-[#6B7280]">{u.location} · {timeAgo(u.created_at)}</p>
                <Link href="/add-business" className="mt-3 inline-block rounded-full bg-[#C9A227] px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#B8941F]">
                  I offer this service
                </Link>
              </li>
            ))}
          </ul>
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
            <Link href="/add-business" className="rounded-full bg-[#C9A227] px-5 py-3 font-semibold text-black">List your business — it&apos;s free</Link>
            <Link href="/request-service" className="rounded-full border border-black/15 px-5 py-3 font-semibold">Request a service</Link>
          </div>
        </section>
      )}

      {/* App link strip keeps key flows reachable without a footer-sized block. */}
      <nav aria-label="Learn more" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-3xl bg-[#FFFFFF] p-5 text-sm font-semibold shadow-sm">
        <Link href="/how-it-works" className="hover:underline">How it works</Link>
        <Link href="/add-business" className="hover:underline">Become a provider</Link>
        <Link href="/request-service" className="hover:underline">Request a service</Link>
        <Link href="/contact" className="hover:underline">Contact</Link>
      </nav>

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
