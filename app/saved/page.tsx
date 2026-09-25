import { redirect } from "next/navigation";
import Link from "next/link";
import { SavedProviderBatch } from "@/components/SavedProviderBatch";
import { supabaseServer } from "@/lib/supabase-server";
import ProviderCard from "@/components/ProviderCard";
import type { Provider } from "@/types/database";

export const metadata = { title: "Saved providers", alternates: { canonical: "/saved" } };

// Members-only collection. RLS ("owners read own saved") is the gate;
// the middleware bounce to login is UX only. Unavailable providers
// (suspended/deleted since saving) drop out of the join honestly.
export default async function SavedPage() {
  const sb = supabaseServer();
  if (!sb) redirect("/login");
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await sb
    .from("saved_providers")
    .select("provider_id,created_at,providers(id,business_name,slug,description,category_id,phone,whatsapp,email,website,facebook,instagram,city,area,address,latitude,longitude,price_min,price_max,verification_status,plan,logo_url,cover_image_url,categories(name,slug))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(60);
  const providers = ((data ?? []) as unknown as { providers: Provider | null }[])
    .map((r) => r.providers)
    .filter((p): p is Provider => Boolean(p));

  return (
    <div className="space-y-6 pt-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7A5C00]">Collection</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Saved providers</h1>
        <p className="mt-1 text-sm text-[#6B7280]" role="status">
          {providers.length === 0
            ? "Nothing saved yet."
            : `${providers.length} saved provider${providers.length === 1 ? "" : "s"}.`}
        </p>
      </div>
      {providers.length === 0 ? (
        <div className="rounded-2xl border border-black/10 bg-[#FFFFFF] p-8 text-center shadow-sm">
          <p className="text-lg font-bold tracking-tight">No saved providers yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-[#6B7280]">
            Tap the heart on any provider to keep them here for later.
          </p>
          <Link href="/search" className="mt-4 inline-block rounded-lg bg-[#C9A227] px-5 py-2.5 font-semibold text-black transition-colors hover:bg-[#B8941F]">
            Discover providers
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SavedProviderBatch>
            {providers.map((p) => <ProviderCard key={p.id} provider={p} />)}
          </SavedProviderBatch>
        </div>
      )}
    </div>
  );
}
