import type { Metadata } from "next";
import { Suspense } from "react";
import SearchBar from "@/components/SearchBar";
import CategoryGrid from "@/components/CategoryGrid";
import { CATEGORIES } from "@/lib/categories";
import { LOCATIONS } from "@/lib/locations";

export const metadata: Metadata = { title: "All services", alternates: { canonical: "/services" } };

export default function ServicesPage() {
  return (
    <div className="space-y-6 pt-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7A5C00]">Directory</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">All services</h1>
        <p className="mt-1 text-sm text-[#6B7280]">{CATEGORIES.length} categories across {LOCATIONS.length} cities in Nepal.</p>
      </div>
      <Suspense><SearchBar compact /></Suspense>
      <CategoryGrid />
    </div>
  );
}
