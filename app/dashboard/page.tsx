import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { isAdminEmail } from "@/lib/supabase";
import { profileCompleteness } from "@/lib/completeness";
import { PageHeader } from "@/components/PageHeader";
import { InlineAlert } from "@/components/InlineAlert";
import { EmptyPanel } from "@/components/EmptyPanel";
import ImageManager from "@/components/ImageManager";
import ProviderEditor, { type EditableProvider } from "@/components/ProviderEditor";
import ServiceManager from "@/components/ServiceManager";
import HoursManager from "@/components/HoursManager";
import RequestManager from "@/components/RequestManager";
import type { ProviderImage, ProviderHourItem, ServiceItem, ServiceRequestRow } from "@/types/database";

export const metadata = { title: "Dashboard" };

const STATUS_CHIP: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  approved: "bg-[#C9A227]/15 text-[#7A5C00]",
  rejected: "bg-red-500/10 text-red-700 dark:text-red-400",
  suspended: "bg-black/5 text-[#6B7280] dark:bg-white/10 dark:text-[#a3a3a3]",
};

const STATUS_HELP: Record<string, string> = {
  pending: "Under review — our team checks every listing before it goes public. This usually takes a day or two.",
  approved: "Live — customers can find and contact this business.",
  rejected: "Not approved — the listing didn't meet our quality checks. You can edit the details and it will stay visible here.",
  suspended: "Temporarily hidden from the public. Contact us if you think this is a mistake.",
};

interface OwnedProvider {
  id: string;
  business_name: string;
  slug: string;
  status: string;
  verification_status: string;
  plan: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  city: string;
  area: string | null;
  address: string | null;
  description: string | null;
  price_min: number | null;
  price_max: number | null;
  logo_url: string | null;
  cover_image_url: string | null;
  categories: { slug: string } | null;
  provider_images: ProviderImage[] | null;
  services: ServiceItem[] | null;
  provider_hours: ProviderHourItem[] | null;
}

export default async function DashboardPage() {
  const sb = supabaseServer();
  if (!sb) {
    return (
      <div className="pt-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-2 text-sm text-[#6B7280]">Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.</p>
      </div>
    );
  }
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  // Cookie-authenticated query: RLS "owners read own" applies to this session.
  // Errors are surfaced (never mistaken for "no listings").
  const { data, error: listingsError } = await sb
    .from("providers")
    .select("id,business_name,slug,status,verification_status,plan,phone,whatsapp,email,website,facebook,instagram,city,area,address,description,price_min,price_max,logo_url,cover_image_url,categories(slug),provider_images(id,url,caption,sort),services(id,name,price_min,price_max),provider_hours(weekday,open_time,close_time,is_closed)")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false })
    .order("sort", { referencedTable: "provider_images", ascending: true })
    .order("weekday", { referencedTable: "provider_hours", ascending: true })
    .limit(50);
  const rows = (data ?? []) as unknown as OwnedProvider[];

  // Customer view: requests I submitted while signed in.
  const { data: myRequests, error: myRequestsError } = await sb
    .from("service_requests")
    .select("id,service,location,description,preferred_time,phone,status,provider_id,service_id,customer_id,created_at,providers(business_name,slug)")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // Provider view: requests addressed to my listings.
  const myIds = rows.map((p) => p.id);
  const { data: incoming, error: incomingError } = myIds.length
    ? await sb
        .from("service_requests")
        .select("id,service,location,description,preferred_time,phone,status,provider_id,service_id,customer_id,created_at,providers(business_name,slug)")
        .in("provider_id", myIds)
        .order("created_at", { ascending: false })
        .limit(100)
    : { data: [] as ServiceRequestRow[] | null, error: null };

  const incomingRows = (incoming ?? []) as unknown as ServiceRequestRow[];
  const myRequestRows = (myRequests ?? []) as unknown as ServiceRequestRow[];
  const requestsError = myRequestsError ?? incomingError;
  if (listingsError) {
    return (
      <div className="space-y-6 pt-4 sm:pt-6">
        <PageHeader eyebrow="Dashboard" title="My listings" hint="Manage your businesses, requests and profile." />
        <InlineAlert title="Couldn't load your listings" note="Check your connection and try again — your data is safe.">
          <a href="/dashboard" className="rounded-lg bg-[#C9A227] px-5 py-2.5 font-semibold text-black">Try again</a>
        </InlineAlert>
      </div>
    );
  }
  const pendingCount = rows.filter((p) => p.status === "pending").length;
  const liveCount = rows.filter((p) => p.status === "approved").length;
  const openIncoming = incomingRows.filter((r) => r.status === "open").length;

  const stats = [
    { label: "Listings", value: rows.length, href: "#listings" },
    { label: "Pending review", value: pendingCount, href: "#listings" },
    { label: "Live", value: liveCount, href: "#listings" },
    { label: "Open requests", value: openIncoming, href: "#requests" },
  ];

  return (
    <div className="space-y-6 pt-4 sm:pt-6">
      <PageHeader
        eyebrow="Dashboard"
        title="My listings"
        hint={`Signed in as ${user.email}${isAdminEmail(user.email) ? " · Admin" : ""}`}
        actions={null}
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" role="group" aria-label="Account summary">
        {stats.map((s) => (
          <a key={s.label} href={s.href} className="rounded-xl border border-black/10 bg-[#FFFFFF] p-4 transition-colors hover:border-black/25">
            <span className="block text-3xl font-bold tracking-tight">{s.value}</span>
            <span className="mt-0.5 block text-xs font-semibold uppercase tracking-wide text-[#6B7280]">{s.label}</span>
          </a>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <a href="/add-business" className="inline-flex min-h-[44px] items-center rounded-lg bg-[#C9A227] px-4 py-2 font-semibold text-black transition-colors hover:bg-[#B8941F]">Add business</a>
        {isAdminEmail(user.email) && <a href="/admin" className="inline-flex min-h-[44px] items-center rounded-lg border border-black/15 px-4 py-2 font-semibold transition-colors hover:bg-black/5">Admin dashboard</a>}
        <form action="/api/auth/signout" method="post"><button className="inline-flex min-h-[44px] items-center rounded-lg border border-black/15 px-4 py-2 font-medium transition-colors hover:bg-black/5">Sign out</button></form>
      </div>
      <div id="requests" className="scroll-mt-20">
        {requestsError && (
          <InlineAlert title="Couldn't load service requests" note={<a href="/dashboard" className="underline underline-offset-2">Try again</a>} />
        )}
        <RequestManager incoming={incomingRows} mine={myRequestRows} />
      </div>
      <section id="listings" aria-label="Your listings" className="scroll-mt-20">
        <h2 className="text-lg font-bold tracking-tight">Listings {rows.length > 0 && <span className="text-sm font-semibold text-[#6B7280]">({rows.length})</span>}</h2>
      {rows.length === 0 ? (
        <div className="mt-3">
          <EmptyPanel title="No listings yet" note="Submit your first business — it goes to pending review and appears here.">
            <a href="/add-business" className="rounded-lg bg-[#C9A227] px-5 py-2.5 font-semibold text-black">Add your business</a>
            <a href="/how-it-works" className="rounded-lg border border-black/15 px-5 py-2.5 font-semibold">How it works</a>
          </EmptyPanel>
        </div>
      ) : (
        <ul className="mt-3 grid gap-4 xl:grid-cols-2">
          {rows.map((p, idx) => {
            const editable: EditableProvider = {
              id: p.id,
              business_name: p.business_name,
              category_slug: p.categories?.slug ?? null,
              phone: p.phone,
              whatsapp: p.whatsapp,
              email: p.email,
              website: p.website,
              facebook: p.facebook,
              instagram: p.instagram,
              city: p.city,
              area: p.area,
              address: p.address,
              description: p.description,
              price_min: p.price_min,
              price_max: p.price_max,
            };
            const svcCount = p.services?.length ?? 0;
            const photoCount = (p.provider_images?.length ?? 0) + (p.logo_url ? 1 : 0) + (p.cover_image_url ? 1 : 0);
            const openHere = incomingRows.filter((r) => r.provider_id === p.id && r.status === "open").length;
            return (
              <li key={p.slug} className="rounded-2xl border border-black/10 bg-[#FFFFFF] p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold tracking-tight">{p.business_name}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_CHIP[p.status] ?? STATUS_CHIP.suspended}`}>{p.status}</span>
                  {openHere > 0 && (
                    <a href="#requests" className="rounded-full bg-[#C9A227]/15 px-2 py-0.5 text-xs font-semibold text-[#7A5C00]">
                      {openHere} open request{openHere === 1 ? "" : "s"}
                    </a>
                  )}
                  {p.status === "approved" && (
                    <a href={`/provider/${p.slug}`} className="ml-auto text-xs font-semibold text-[#0A0A0A] underline underline-offset-2">View public page →</a>
                  )}
                </div>
                <p className="mt-1 text-sm text-[#6B7280]">{p.verification_status} · {p.plan} plan · {svcCount} service{svcCount === 1 ? "" : "s"} · {photoCount} photo{photoCount === 1 ? "" : "s"}</p>
                {p.verification_status !== "verified" && (
                  <p className="mt-1 text-xs text-[#6B7280]">Not verified yet — <a href="/how-it-works#verification" className="underline underline-offset-2">what verification means</a>.</p>
                )}
                {p.status === "approved" && (
                  <p className="mt-1 text-xs text-[#6B7280]">Want more visibility? <a href="/contact" className="underline underline-offset-2">Ask about Featured plans</a>.</p>
                )}
                {STATUS_HELP[p.status] && (
                  <p className="mt-2 rounded-lg bg-black/5 p-2 text-xs text-[#6B7280]">{STATUS_HELP[p.status]}</p>
                )}
                {(() => {
                  const comp = profileCompleteness({
                    business_name: p.business_name,
                    phone: p.phone,
                    category_slug: p.categories?.slug ?? null,
                    description: p.description,
                    city: p.city,
                    area: p.area,
                    has_hours: (p.provider_hours ?? []).length > 0,
                    photo_count: photoCount,
                    service_count: svcCount,
                    has_whatsapp: Boolean(p.whatsapp),
                  });
                  const missing = comp.items.filter((i) => !i.done);
                  return (
                    <div className="mt-2 rounded-lg border border-black/10 p-3">
                      <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                        <span>Profile completeness</span>
                        <span>{comp.percent}%</span>
                      </div>
                      <div role="progressbar" aria-valuenow={comp.percent} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completeness" className="mt-2 h-2 overflow-hidden rounded-full bg-black/10">
                        <div className="h-full rounded-full bg-[#C9A227] transition-all" style={{ width: `${comp.percent}%` }} />
                      </div>
                      {missing.length > 0 && (
                        <p className="mt-2 text-xs text-[#6B7280]">
                          Missing: {missing.map((i) => i.label).join(" · ")}
                        </p>
                      )}
                    </div>
                  );
                })()}
                <ProviderEditor provider={editable} />
                <details open={idx === 0} className="mt-3 rounded-xl border border-black/10">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">Services ({svcCount})</summary>
                  <div className="px-4 pb-4"><ServiceManager providerId={p.id} initial={p.services ?? []} /></div>
                </details>
                <details open={idx === 0} className="mt-3 rounded-xl border border-black/10">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">Opening hours</summary>
                  <div className="px-4 pb-4"><HoursManager providerId={p.id} initial={p.provider_hours ?? []} /></div>
                </details>
                <details open={idx === 0} className="mt-3 rounded-xl border border-black/10">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">Photos ({photoCount})</summary>
                  <div className="px-4 pb-4">
                    <ImageManager
                      providerId={p.id}
                      businessName={p.business_name}
                      status={p.status}
                      initialLogo={p.logo_url}
                      initialCover={p.cover_image_url}
                      initialImages={p.provider_images ?? []}
                    />
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
      </section>
    </div>
  );
}
