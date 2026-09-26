import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase-server";
import { REQUEST_STATUS_LABEL, type RequestStatus } from "@/lib/request-status";
import type { ServiceRequestRow } from "@/types/database";

export const metadata = { title: "My requests", alternates: { canonical: "/requests" } };

function StatusChip({ status }: { status: RequestStatus }) {
  const tone =
    status === "open"
      ? "bg-[#C9A227]/15 text-[#7A5C00]"
      : status === "completed"
        ? "bg-black/5 text-[#0A0A0A]"
        : status === "cancelled"
          ? "bg-red-500/10 text-red-700 dark:text-red-400"
          : "bg-black/5 text-[#6B7280]";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>
      {REQUEST_STATUS_LABEL[status] ?? status}
    </span>
  );
}

// Read-only tracking list. RLS ("customers read own requests") is the gate:
// only rows addressed to the caller ever arrive here.
export default async function RequestsPage() {
  const sb = supabaseServer();
  if (!sb) redirect("/login");
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await sb
    .from("service_requests")
    .select("id,service,location,status,provider_id,created_at,providers(business_name,slug)")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  const rows = (data ?? []) as unknown as ServiceRequestRow[];

  return (
    <div className="mx-auto max-w-2xl space-y-6 pt-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7A5C00]">Activity</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">My requests</h1>
        <p className="mt-1 text-sm text-[#6B7280]" role="status">
          {rows.length === 0 ? "No requests yet." : `${rows.length} request${rows.length === 1 ? "" : "s"}.`}
        </p>
      </div>
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-black/10 bg-[#FFFFFF] p-8 text-center shadow-sm">
          <p className="text-lg font-bold tracking-tight">No service requests yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-[#6B7280]">Tell us what you need and track every reply here.</p>
          <Link href="/request-service" className="mt-4 inline-block rounded-full bg-[#C9A227] px-5 py-2.5 font-semibold text-black transition-colors hover:bg-[#B8941F]">
            Find a service
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="rounded-xl border border-black/10 bg-[#FFFFFF] p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{r.service}</p>
                <StatusChip status={r.status} />
              </div>
              <p className="mt-0.5 text-sm text-[#6B7280]">{r.location}</p>
              <div className="mt-2">
                <Link href={`/requests/${r.id}`} className="text-sm font-semibold underline underline-offset-2">
                  View details
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
