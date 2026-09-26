import { redirect } from "next/navigation";
import { getAdminStatus } from "@/lib/admin";
import AdminNotice from "@/components/AdminNotice";
import AdminProviderActions from "@/components/AdminProviderActions";

export const metadata = { title: "Admin — Providers" };

export default async function AdminProvidersPage({ searchParams }: { searchParams: { status?: string } }) {
  const gate = await getAdminStatus();
  if (!gate.ok && gate.reason !== "signed-out") {
    return <AdminNotice reason={gate.reason} email={gate.email} />;
  }
  if (!gate.ok) redirect("/login");
  const ctx = gate.ctx;

  const status = searchParams.status ?? "";
  let q = ctx.admin.from("providers").select("id,business_name,slug,city,area,phone,status,verification_status,plan").order("updated_at", { ascending: false }).limit(100);
  if (status) q = q.eq("status", status);
  const { data } = await q;

  return (
    <div className="space-y-4 pt-6">
      <h1 className="text-2xl font-bold">Providers {status ? `— ${status}` : ""}</h1>
      <nav className="flex gap-2 text-sm" aria-label="Status filter">
        {[["", "All"], ["pending", "Pending"], ["approved", "Approved"], ["rejected", "Rejected"], ["suspended", "Suspended"]].map(([v, l]) => (
          <a key={v} href={v ? `/admin/providers?status=${v}` : "/admin/providers"} className="inline-flex min-h-[44px] items-center rounded-full border px-3 py-1.5">{l}</a>
        ))}
      </nav>
      <AdminProviderActions rows={(data ?? []) as { id: string; business_name: string; slug: string; city: string; area: string | null; phone: string; status: string; verification_status: string; plan: string }[]} />
    </div>
  );
}
