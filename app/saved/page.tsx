import { redirect } from "next/navigation";
import Link from "next/link";
import { SavedProviderBatch } from "@/components/SavedProviderBatch";
import { supabaseServer } from "@/lib/supabase-server";
import { PageHeader } from "@/components/PageHeader";
import { InlineAlert } from "@/components/InlineAlert";
import { EmptyPanel } from "@/components/EmptyPanel";
import ProviderCard from "@/components/ProviderCard";
import type { Provider } from "@/types/database";

export const metadata = { title: "Saved providers", alternates: { canonical: "/saved" } };

export default async function SavedPage() {
  const sb = supabaseServer();
  if (!sb) redirect("/login");
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const { data: rows, error: fetchFailed } = await sb
    .from("saved_providers")
    .select("provider_id,created_at,providers(id,business_name,slug,description,category_id,phone,whatsapp,email,website,facebook,instagram,city,area,address,latitude,longitude,price_min,price_max,verification_status,plan,logo_url,cover_image_url,categories(name,slug))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(60);
  const providers = ((rows ?? []) as unknown as { providers: Provider | null }[]).map((r) => r.providers).filter((p): p is Provider => Boolean(p));

  return (
    <div className="space-y-5 pt-4 sm:pt-6">
      <PageHeader
        eyebrow="Collection"
        title="Saved providers"
        hint={providers.length === 0 ? "Save providers you plan to contact later." : "Saved businesses stay private to your account."}
        actions={
          providers.length > 0 ? (
            <Link href="/search" className="rounded-lg border border-black/15 px-4 py-2">
              Discover more
            </Link>
          ) : undefined
        }
      />
      {fetchFailed && (
        <InlineAlert
          title="Couldn't load your saved providers"
          note="Refresh the page — your collection is safe."
        />
      )}
      {fetchFailed ? null : providers.length === 0 ? (
        <EmptyPanel
          title="No saved providers yet"
          note="Tap the heart on any provider to keep it here for later."
        >
          <Link href="/search" className="rounded-lg bg-[#C9A227] px-5 py-2.5 font-semibold text-black">Discover providers</Link>
        </EmptyPanel>
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
