import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { supabaseAdmin, isAdminEmail } from "@/lib/supabase";

export const metadata = { title: "Admin — Reports & requests" };

export default async function AdminReportsPage() {
  const sb = supabaseServer();
  const { data: { user } } = sb ? await sb.auth.getUser() : { data: { user: null } };
  if (!user || !isAdminEmail(user.email)) redirect("/login");
  const admin = supabaseAdmin();
  const [{ data: reports }, { data: requests }] = admin
    ? await Promise.all([
        admin.from("reports").select("id,reason,contact,status,created_at,provider_id").eq("status", "open").order("created_at", { ascending: false }).limit(50),
        admin.from("service_requests").select("id,service,location,description,phone,status,created_at").eq("status", "open").order("created_at", { ascending: false }).limit(50),
      ])
    : [{ data: [] }, { data: [] }];

  return (
    <div className="space-y-8 pt-6">
      <section>
        <h1 className="text-2xl font-bold">Open reports</h1>
        <ul className="mt-3 space-y-2 text-sm">
          {(reports ?? []).length === 0 && <li className="rounded-xl bg-[#FFFDF8] p-4 text-[#66706E]">No open reports.</li>}
          {(reports ?? []).map((r: { id: string; reason: string; contact: string | null; provider_id: string }) => (
            <li key={r.id} className="rounded-xl bg-[#FFFDF8] p-4">{r.reason}{r.contact ? ` — ${r.contact}` : ""}</li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-bold">Service requests (lead matching)</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {(requests ?? []).length === 0 && <li className="rounded-xl bg-[#FFFDF8] p-4 text-[#66706E]">No open requests.</li>}
          {(requests ?? []).map((r: { id: string; service: string; location: string; description: string; phone: string }) => (
            <li key={r.id} className="rounded-xl bg-[#FFFDF8] p-4">
              <strong>{r.service}</strong> in {r.location} — {r.phone}<br />{r.description}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
