import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { isAdminEmail } from "@/lib/supabase";
import ImageManager from "@/components/ImageManager";
import type { ProviderImage } from "@/types/database";

export const metadata = { title: "Dashboard" };

interface OwnedProvider {
  id: string;
  business_name: string;
  slug: string;
  status: string;
  verification_status: string;
  plan: string;
  logo_url: string | null;
  cover_image_url: string | null;
  provider_images: ProviderImage[] | null;
}

export default async function DashboardPage() {
  const sb = supabaseServer();
  if (!sb) {
    return (
      <div className="pt-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-2 text-sm text-[#66706E]">Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.</p>
      </div>
    );
  }
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  // Cookie-authenticated query: RLS "owners read own" applies to this session.
  const { data } = await sb
    .from("providers")
    .select("id,business_name,slug,status,verification_status,plan,logo_url,cover_image_url,provider_images(id,url,caption,sort)")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false })
    .order("sort", { referencedTable: "provider_images", ascending: true });
  const rows = (data ?? []) as unknown as OwnedProvider[];

  return (
    <div className="space-y-6 pt-6">
      <h1 className="text-2xl font-bold">My listings</h1>
      <p className="text-sm text-[#66706E]">Signed in as {user.email}{isAdminEmail(user.email) ? " · Admin" : ""}</p>
      <div className="flex gap-2">
        <a href="/add-business" className="rounded-lg bg-[#0B7168] px-4 py-2 font-semibold text-white">Add business</a>
        {isAdminEmail(user.email) && <a href="/admin" className="rounded-lg border px-4 py-2 font-semibold">Admin dashboard</a>}
        <form action="/api/auth/signout" method="post"><button className="rounded-lg border px-4 py-2">Sign out</button></form>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-xl bg-[#FFFDF8] p-6 text-sm text-[#66706E]">No listings yet. Submit your first business — it goes to pending review.</p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {rows.map((p) => (
            <li key={p.slug} className="rounded-xl bg-[#FFFDF8] p-4">
              <p className="font-semibold">{p.business_name}</p>
              <p className="text-sm text-[#66706E]">{p.status} · {p.verification_status} · {p.plan}</p>
              <ImageManager
                providerId={p.id}
                businessName={p.business_name}
                status={p.status}
                initialLogo={p.logo_url}
                initialCover={p.cover_image_url}
                initialImages={p.provider_images ?? []}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
