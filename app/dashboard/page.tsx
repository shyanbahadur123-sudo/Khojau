import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { isAdminEmail } from "@/lib/supabase";
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
  if (!user) redirect("/login");

  // Cookie-authenticated query: RLS "owners read own" applies to this session.
  const { data } = await sb
    .from("providers")
    .select("id,business_name,slug,status,verification_status,plan,phone,whatsapp,email,website,facebook,instagram,city,area,address,description,price_min,price_max,logo_url,cover_image_url,categories(slug),provider_images(id,url,caption,sort),services(id,name,price_min,price_max),provider_hours(weekday,open_time,close_time,is_closed)")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false })
    .order("sort", { referencedTable: "provider_images", ascending: true })
    .order("weekday", { referencedTable: "provider_hours", ascending: true });
  const rows = (data ?? []) as unknown as OwnedProvider[];

  // Customer view: requests I submitted while signed in.
  const { data: myRequests } = await sb
    .from("service_requests")
    .select("id,service,location,description,preferred_time,phone,status,provider_id,service_id,customer_id,created_at,providers(business_name,slug)")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // Provider view: requests addressed to my listings.
  const myIds = rows.map((p) => p.id);
  const { data: incoming } = myIds.length
    ? await sb
        .from("service_requests")
        .select("id,service,location,description,preferred_time,phone,status,provider_id,service_id,customer_id,created_at,providers(business_name,slug)")
        .in("provider_id", myIds)
        .order("created_at", { ascending: false })
        .limit(100)
    : { data: [] as ServiceRequestRow[] | null };

  const incomingRows = (incoming ?? []) as unknown as ServiceRequestRow[];
  const myRequestRows = (myRequests ?? []) as unknown as ServiceRequestRow[];
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
    <div className="space-y-6 pt-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7A5C00]">Dashboard</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">My listings</h1>
        <p className="mt-1 text-sm text-[#6B7280]">Signed in as {user.email}{isAdminEmail(user.email) ? " · Admin" : ""}</p>
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Account summary">
        {stats.map((s) => (
          <a key={s.label} href={s.href} className="rounded-xl border border-black/10 bg-[#FFFFFF] p-4 transition-colors hover:border-black/25">
            <dd className="text-3xl font-bold tracking-tight">{s.value}</dd>
            <dt className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">{s.label}</dt>
          </a>
        ))}
      </dl>
      <div className="flex flex-wrap gap-2">
        <a href="/add-business" className="rounded-lg bg-[#C9A227] px-4 py-2 font-semibold text-black transition-colors hover:bg-[#B8941F]">Add business</a>
        {isAdminEmail(user.email) && <a href="/admin" className="rounded-lg border border-black/15 px-4 py-2 font-semibold transition-colors hover:bg-black/5">Admin dashboard</a>}
        <form action="/api/auth/signout" method="post"><button className="rounded-lg border border-black/15 px-4 py-2 font-medium transition-colors hover:bg-black/5">Sign out</button></form>
      </div>
      <div id="requests" className="scroll-mt-20">
        <RequestManager incoming={incomingRows} mine={myRequestRows} />
      </div>
      <section id="listings" aria-label="Your listings" className="scroll-mt-20">
        <h2 className="text-lg font-bold tracking-tight">Listings {rows.length > 0 && <span className="text-sm font-semibold text-[#6B7280]">({rows.length})</span>}</h2>
      {rows.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-black/10 bg-[#FFFFFF] p-8 text-center shadow-sm">
          <p className="text-sm text-[#6B7280]">No listings yet. Submit your first business — it goes to pending review and appears here.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <a href="/add-business" className="rounded-lg bg-[#C9A227] px-5 py-2.5 font-semibold text-black transition-colors hover:bg-[#B8941F]">Add your business</a>
            <a href="/how-it-works" className="rounded-lg border border-black/15 px-5 py-2.5 font-semibold transition-colors hover:bg-black/5">How it works</a>
          </div>
        </div>
      ) : (
        <ul className="mt-3 grid gap-4 xl:grid-cols-2">
          {rows.map((p) => {
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
            return (
              <li key={p.slug} className="rounded-2xl border border-black/10 bg-[#FFFFFF] p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-bold tracking-tight">{p.business_name}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_CHIP[p.status] ?? STATUS_CHIP.suspended}`}>{p.status}</span>
                  {p.status === "approved" && (
                    <a href={`/provider/${p.slug}`} className="ml-auto text-xs font-semibold text-[#0A0A0A] underline underline-offset-2">View public page →</a>
                  )}
                </div>
                <p className="mt-1 text-sm text-[#6B7280]">{p.verification_status} · {p.plan} plan</p>
                {STATUS_HELP[p.status] && (
                  <p className="mt-2 rounded-lg bg-black/5 p-2 text-xs text-[#6B7280]">{STATUS_HELP[p.status]}</p>
                )}
                <ProviderEditor provider={editable} />
                <ServiceManager providerId={p.id} initial={p.services ?? []} />
                <HoursManager providerId={p.id} initial={p.provider_hours ?? []} />
                <ImageManager
                  providerId={p.id}
                  businessName={p.business_name}
                  status={p.status}
                  initialLogo={p.logo_url}
                  initialCover={p.cover_image_url}
                  initialImages={p.provider_images ?? []}
                />
              </li>
            );
          })}
        </ul>
      )}
      </section>
    </div>
  );
}
