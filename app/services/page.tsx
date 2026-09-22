import type { Metadata } from "next";
import Link from "next/link";
import CategoryGrid from "@/components/CategoryGrid";
import ProviderCard from "@/components/ProviderCard";
import { CATEGORIES, categoryBySlug } from "@/lib/categories";
import { getApprovedProviders } from "@/lib/providers";

export const metadata: Metadata = { title: "All services", alternates: { canonical: "/services" } };

export default function ServicesPage() {
  return (
    <div className="space-y-6 pt-6">
      <h1 className="text-2xl font-bold">All services</h1>
      <CategoryGrid />
    </div>
  );
}
