import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SavedProviderBatch } from "@/components/SavedProviderBatch";
import ProviderCard from "@/components/ProviderCard";
import { getApprovedProvidersResult } from "@/lib/providers";
import { supabaseServer } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Recent listings",
  description: "Newly approved local service providers across Nepal, newest first.",
  alternates: { canonical: "/recent" },
};

export const revalidate = 60;

export default async function RecentPage() {
  // Members-only (defense in depth: middleware already redirects guests).
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
    <div className="space-y-6 pt-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7A5C00]">Fresh</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Recent</h1>
        {fetchFailed ? (
          <div role="alert" className="mt-2 rounded-xl bg-red-500/10 p-4 text-sm text-[#6B7280]">
            <span className="font-semibold text-red-700">Couldn’t load recent listings.</span>{" "}
            Try again shortly.
          </div>
        ) : (
          <p className="mt-1 text-sm text-[#6B7280]" role="status">
            {all.length === 0
              ? "No approved listings yet."
              : `${all.length} approved listing${all.length === 1 ? "" : "s"}, newest first.`}
          </p>
        )}
      </div>
      {all.length === 0 ? (
        <div className="rounded-2xl border border-black/10 bg-[#FFFFFF] p-8 text-center shadow-sm">
          <p className="text-sm text-[#6B7280]">Nothing published yet. List your business for free and be the first here.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link href="/add-business" className="rounded-lg bg-[#C9A227] px-5 py-2.5 font-semibold text-black transition-colors hover:bg-[#B8941F]">
              Add your business
            </Link>
            <Link href="/search" className="rounded-lg border border-black/15 px-5 py-2.5 font-semibold transition-colors hover:bg-black/5">
              Search all
            </Link>
          </div>
        </div>
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
