import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SavedProviderBatch } from "@/components/SavedProviderBatch";
import ProviderCard from "@/components/ProviderCard";
import { PageHeader } from "@/components/PageHeader";
import { InlineAlert } from "@/components/InlineAlert";
import { EmptyPanel } from "@/components/EmptyPanel";
import { getApprovedProvidersResult } from "@/lib/providers";
import { supabaseServer } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Recent listings",
  description: "Newly approved local service providers across Nepal, newest first.",
  alternates: { canonical: "/recent" },
};

export const revalidate = 60;

export default async function RecentPage() {
  try {
    const sb = supabaseServer();
    if (sb) {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) redirect("/login?next=/recent");
    } else {
      redirect("/login?next=/recent");
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) throw e;
    redirect("/login?next=/recent");
  }
  const { providers: all, error: fetchFailed } = await getApprovedProvidersResult({ limit: 60 });

  return (
    <div className="space-y-5 pt-4 sm:pt-6">
      <PageHeader
        eyebrow="Fresh"
        title="Recent listings"
        hint={all.length === 0 ? "Newly approved listings appear here as they publish." : "Newly approved listings, newest first."}
        actions={
          <Link href="/request-service" className="rounded-lg bg-[#C9A227] px-4 py-2 font-semibold text-black">
            Request help
          </Link>
        }
      />
      {fetchFailed && (
        <InlineAlert
          title="Couldn't load recent listings"
          note="Try again shortly, or search directly from the top bar."
        />
      )}
      {fetchFailed ? null : all.length === 0 ? (
        <EmptyPanel
          title="Nothing published yet"
          note="Be the first to list, or request help and we'll match you."
        >
          <Link href="/add-business" className="rounded-lg bg-[#C9A227] px-5 py-2.5 font-semibold text-black">Add your business</Link>
          <Link href="/search" className="rounded-lg border border-black/15 px-5 py-2.5 font-semibold">Search all</Link>
        </EmptyPanel>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SavedProviderBatch>
            {all.map((p) => <ProviderCard key={p.id} provider={p} />)}
          </SavedProviderBatch>
        </div>
      )}
    </div>
  );
}
