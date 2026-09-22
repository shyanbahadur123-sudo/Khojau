import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { supabaseAdmin, isAdminEmail } from "@/lib/supabase";
import AdminProviderActions from "@/components/AdminProviderActions";

export const metadata = { title: "Admin — Providers" };

export default async function AdminProvidersPage({ searchParams }: { searchParams: { status?: string } }) {
  const sb = supabaseServer();
  const { data: { user } } = sb ? await sb.auth.getUser() : { data: { user: null } };
  if (!user || !isAdminEmail(user.email)) redirect("/login");
  const admin = supabaseAdmin();
  if (!admin) return <div className="pt-6"><h1 className="text-2xl font-bold">Providers</h1><p className="text-sm">Set SUPABASE_SERVICE_ROLE_KEY in server env.</p></div>;

  const status = searchParams.status ?? "";
  let q = admin.from("providers").select("id,business_name,slug,city,area,phone,status,verification_status,plan").order("updated_at", { ascending: false }).limit(100);
  if (status) q = q.eq("status", status);
  const { data } = await q;

  return (
    <div className="space-y-4 pt-6">
      <h1 className="text-2xl font-bold">Providers {status ? `— ${status}` : ""}</h1>
      <nav className="flex gap-2 text-sm" aria-label="Status filter">
        {[["", "All"], ["pending", "Pending"], ["approved", "Approved"], ["rejected", "Rejected"], ["suspended", "Suspended"]].map(([v, l]) => (
          <a key={v} href={v ? `/admin/providers?status=${v}` : "/admin/providers"} className="rounded-full border px-3 py-1.5">{l}</a>
        ))}
      </nav>
      <AdminProviderActions rows={(data ?? []) as { id: string; business_name: string; slug: string; city: string; area: string | null; phone: string; status: string; verification_status: string; plan: string }[]} />
    </div>
  );
}
