import { redirect } from "next/navigation";
import { getAdminStatus } from "@/lib/admin";
import AdminNotice from "@/components/AdminNotice";
import AdminReportActions from "@/components/AdminReportActions";

export const metadata = { title: "Admin — Reports" };

export default async function AdminReportsPage() {
  const gate = await getAdminStatus();
  if (!gate.ok && gate.reason !== "signed-out") {
    return <AdminNotice reason={gate.reason} email={gate.email} />;
  }
  if (!gate.ok) redirect("/login");
  const ctx = gate.ctx;

  const { data: reports } = await ctx.admin
    .from("reports")
    .select("id,reason,contact,status,created_at,provider_id,providers(business_name)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-4 pt-6">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Reports</h1>
      {(reports ?? []).length === 0 ? (
        <p className="rounded-xl bg-[#FFFFFF] p-4 text-sm text-[#6B7280]">No reports.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {(reports ?? []).map((r: { id: string; reason: string; contact: string | null; status: string; providers: { business_name: string } | { business_name: string }[] | null }) => (
            <li key={r.id} className="rounded-xl bg-[#FFFFFF] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{(Array.isArray(r.providers) ? r.providers[0] : r.providers)?.business_name ?? "Unknown listing"}</p>
                <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-semibold">{r.status}</span>
              </div>
              <p className="mt-1 break-words">{r.reason}{r.contact ? ` — ${r.contact}` : ""}</p>
              {r.status === "open" && (
                <div className="mt-2"><AdminReportActions id={r.id} /></div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
