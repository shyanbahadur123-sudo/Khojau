import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase-server";
import { supabaseAdmin, isAdminEmail } from "@/lib/supabase";

export const metadata = { title: "Admin dashboard" };

async function requireAdmin() {
  const sb = supabaseServer();
  if (!sb) return null;
  const { data: { user } } = await sb.auth.getUser();
  if (!user || !isAdminEmail(user.email)) return null;
  return user;
}

export default async function AdminPage() {
  const user = await requireAdmin();
  if (!user) redirect("/login");

  const admin = supabaseAdmin();
  let counts = { pending: 0, approved: 0, reports: 0, requests: 0 };
  if (admin) {
    const [p, a, r, s] = await Promise.all([
      admin.from("providers").select("id", { count: "exact", head: true }).eq("status", "pending"),
      admin.from("providers").select("id", { count: "exact", head: true }).eq("status", "approved"),
      admin.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
      admin.from("service_requests").select("id", { count: "exact", head: true }).eq("status", "open"),
    ]);
    counts = { pending: p.count ?? 0, approved: a.count ?? 0, reports: r.count ?? 0, requests: s.count ?? 0 };
  }

  const cards = [
    { href: "/admin/providers?status=pending", title: "Pending listings", value: counts.pending },
    { href: "/admin/providers", title: "All providers", value: counts.approved },
    { href: "/admin/reports", title: "Open reports", value: counts.reports },
    { href: "/admin/categories", title: "Categories", value: 22 },
  ];

  return (
    <div className="space-y-6 pt-6">
      <h1 className="text-2xl font-bold">Admin dashboard</h1>
      <p className="text-sm text-[#66706E]">Signed in as {user.email}. Manually review, verify, feature, or suspend listings.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.title} href={c.href} className="rounded-xl bg-[#FFFDF8] p-5 hover:border-[#0B7168] border border-black/10">
            <p className="text-3xl font-bold">{c.value}</p>
            <p className="text-sm font-semibold">{c.title}</p>
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="/admin/providers" className="rounded-lg bg-[#0B7168] px-4 py-2 font-semibold text-white">Manage providers</Link>
        <Link href="/admin/categories" className="rounded-lg border px-4 py-2">Categories</Link>
        <Link href="/admin/reports" className="rounded-lg border px-4 py-2">Reports</Link>
      </div>
    </div>
  );
}
