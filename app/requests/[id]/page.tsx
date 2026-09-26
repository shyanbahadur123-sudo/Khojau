import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase-server";
import { REQUEST_STATUS_LABEL } from "@/lib/request-status";
import { whatsappUrl } from "@/lib/search";
import type { ServiceRequestRow } from "@/types/database";

export const metadata = { title: "Request details" };

function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (!Number.isFinite(mins)) return "recently";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

// Detail view gated purely by RLS: the row is returned only when the caller
// is its customer or its provider's owner. Otherwise: notFound (no existence
// oracle, no IDOR signal beyond 404).
export default async function RequestDetailPage({ params }: { params: { id: string } }) {
  if (!/^[0-9a-f-]{1,100}$/i.test(params.id)) notFound();
  const sb = supabaseServer();
  if (!sb) redirect("/login");
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await sb
    .from("service_requests")
    .select("id,service,location,description,preferred_time,phone,status,provider_id,service_id,customer_id,created_at,providers(business_name,slug,phone,whatsapp,city)")
    .eq("id", params.id)
    .single();
  if (!data) notFound();
  const r = data as unknown as ServiceRequestRow & {
    providers?: { business_name: string; slug: string; phone: string; whatsapp: string | null; city: string } | null;
  };
  const mine = r.customer_id === user.id;
  const wa = r.providers ? whatsappUrl(r.providers.whatsapp ?? r.providers.phone) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 pt-6">
      <nav aria-label="Breadcrumb" className="break-words text-sm text-[#6B7280]">
        <Link href="/" className="hover:underline">Home</Link> /{" "}
        <Link href={mine ? "/requests" : "/dashboard"} className="hover:underline">
          {mine ? "My requests" : "Dashboard"}
        </Link>{" "}
        / <span aria-current="page">Request</span>
      </nav>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7A5C00]">Request</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{r.service}</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          {r.location} · Requested {timeAgo(r.created_at)}
        </p>
      </div>

      <section aria-labelledby="status" className="rounded-2xl border border-black/10 bg-[#FFFFFF] p-6 shadow-sm">
        <h2 id="status" className="font-bold">Status</h2>
        <p className="mt-2 inline-block rounded-full bg-[#C9A227]/15 px-3 py-1 text-sm font-semibold text-[#7A5C00]">
          {REQUEST_STATUS_LABEL[r.status]}
        </p>
        {r.preferred_time && <p className="mt-2 text-sm text-[#6B7280]">Preferred time: {r.preferred_time}</p>}
      </section>

      <section aria-labelledby="details" className="rounded-2xl border border-black/10 bg-[#FFFFFF] p-6 shadow-sm">
        <h2 id="details" className="font-bold">Details</h2>
        <p className="mt-2 break-words whitespace-pre-line text-[15px] leading-relaxed">{r.description}</p>
      </section>

      {r.providers && (
        <section aria-labelledby="provider" className="rounded-2xl border border-black/10 bg-[#FFFFFF] p-6 shadow-sm">
          <h2 id="provider" className="font-bold">Provider</h2>
          <p className="mt-2 font-semibold">
            <Link href={`/provider/${r.providers.slug}`} className="hover:underline">
              {r.providers.business_name}
            </Link>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={`tel:${r.providers.phone}`} className="rounded-full bg-[#C9A227] px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#B8941F]">
              Call provider
            </a>
            {wa && (
              <a href={wa} target="_blank" rel="noopener" className="rounded-full border border-black/15 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-black/5">
                Message
              </a>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
