import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin";
import AdminRequestActions from "@/components/AdminRequestActions";
import type { RequestStatus } from "@/types/database";

export const metadata = { title: "Admin — Requests" };

export default async function AdminRequestsPage({ searchParams }: { searchParams: { status?: string } }) {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/login");

  const status = searchParams.status ?? "open";
  const { data } = await ctx.admin
    .from("service_requests")
    .select("id,service,location,description,phone,preferred_time,status,created_at,providers(business_name)")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-4 pt-6">
      <h1 className="text-2xl font-bold">Service requests — {status.replace("_", " ")}</h1>
      <nav className="flex gap-2 text-sm" aria-label="Status filter">
        {[["open", "Open"], ["in_progress", "In progress"], ["completed", "Completed"], ["cancelled", "Cancelled"]].map(([v, l]) => (
          <a key={v} href={`/admin/requests?status=${v}`} className="rounded-full border px-3 py-1.5">{l}</a>
        ))}
      </nav>
      {(data ?? []).length === 0 ? (
        <p className="rounded-xl bg-[#FFFDF8] p-4 text-sm text-[#66706E]">No {status.replace("_", " ")} requests.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {(data ?? []).map((r: { id: string; service: string; location: string; description: string; phone: string; preferred_time: string | null; status: RequestStatus; providers: { business_name: string } | { business_name: string }[] | null }) => (
            <li key={r.id} className="rounded-xl bg-[#FFFDF8] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{r.service} · {r.location}</p>
                <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-semibold">{r.status.replace("_", " ")}</span>
              </div>
              <p className="mt-1">{r.description}</p>
              <p className="mt-1 text-[#66706E]">
                <a href={`tel:${r.phone}`} className="text-[#0B7168] hover:underline">{r.phone}</a>
                {r.preferred_time ? ` · ${r.preferred_time}` : ""}
                {(Array.isArray(r.providers) ? r.providers[0] : r.providers) ? ` · ${(Array.isArray(r.providers) ? r.providers[0] : r.providers)?.business_name}` : " · unmatched"}
              </p>
              <div className="mt-2"><AdminRequestActions id={r.id} current={r.status} /></div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
