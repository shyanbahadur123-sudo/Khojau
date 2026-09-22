import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import SearchBar, { SearchBarSkeleton } from "@/components/SearchBar";
import { LOCATIONS } from "@/lib/locations";

export const metadata: Metadata = { title: "All locations", alternates: { canonical: "/locations" } };

export default function LocationsPage() {
  return (
    <div className="space-y-6 pt-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7A5C00]">Directory</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">All locations</h1>
        <p className="mt-1 text-sm text-[#6B7280]">{LOCATIONS.length} cities across Nepal. Pick one to browse providers or search an area.</p>
      </div>
      <Suspense fallback={<SearchBarSkeleton />}><SearchBar compact /></Suspense>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LOCATIONS.map((l) => (
          <li key={l.slug} className="rounded-xl border border-black/10 bg-[#FFFFFF] p-5 shadow-sm transition-all duration-200 hover:-translate-y-[2px] hover:shadow-md">
            <Link href={`/locations/${l.slug}`} className="font-bold tracking-tight hover:underline">{l.city}</Link>
            <p className="mt-1 text-sm text-[#6B7280]">{l.areas.join(" · ")}</p>
            <Link href={`/search?location=${encodeURIComponent(l.city)}`} className="mt-2 inline-block text-sm font-semibold text-[#0A0A0A] hover:underline">
              Browse providers →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
