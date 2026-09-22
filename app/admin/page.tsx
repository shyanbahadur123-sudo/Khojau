import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminContext } from "@/lib/admin";

export const metadata = { title: "Admin dashboard" };

export default async function AdminPage() {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/login");
  const { admin, email } = ctx;

  const [p, a, r, s, audit] = await Promise.all([
    admin.from("providers").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("providers").select("id", { count: "exact", head: true }).eq("status", "approved"),
    admin.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
    admin.from("service_requests").select("id", { count: "exact", head: true }).eq("status", "open"),
    admin.from("admin_audit_log").select("action,target_type,target_id,created_at").order("created_at", { ascending: false }).limit(10),
  ]);
  const counts = { pending: p.count ?? 0, approved: a.count ?? 0, reports: r.count ?? 0, requests: s.count ?? 0 };

  const cards = [
    { href: "/admin/providers?status=pending", title: "Pending listings", value: counts.pending },
    { href: "/admin/providers", title: "Approved providers", value: counts.approved },
    { href: "/admin/reports", title: "Open reports", value: counts.reports },
    { href: "/admin/requests", title: "Open requests", value: counts.requests },
  ];

  return (
    <div className="space-y-6 pt-6">
      <h1 className="text-2xl font-bold">Admin dashboard</h1>
      <p className="text-sm text-[#66706E]">Signed in as {email}. Every moderation action is audit-logged.</p>
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
        <Link href="/admin/reports" className="rounded-lg border px-4 py-2">Reports</Link>
        <Link href="/admin/requests" className="rounded-lg border px-4 py-2">Requests</Link>
        <Link href="/admin/categories" className="rounded-lg border px-4 py-2">Categories</Link>
      </div>
      <section aria-label="Recent admin activity" className="rounded-xl bg-[#FFFDF8] p-5">
        <h2 className="font-bold">Recent activity</h2>
        {(audit.data ?? []).length === 0 ? (
          <p className="mt-2 text-sm text-[#66706E]">No moderation actions recorded yet.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {(audit.data ?? []).map((e: { action: string; target_type: string; target_id: string; created_at: string }, i: number) => (
              <li key={i} className="flex flex-wrap gap-2">
                <code className="rounded bg-black/5 px-1">{e.action}</code>
                <span className="text-[#66706E]">{e.target_type} {e.target_id.slice(0, 8)} · {new Date(e.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
