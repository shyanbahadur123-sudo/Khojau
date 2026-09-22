import type { Metadata } from "next";
import Link from "next/link";
import { LOCATIONS } from "@/lib/locations";

export const metadata: Metadata = { title: "All locations", alternates: { canonical: "/locations" } };

export default function LocationsPage() {
  return (
    <div className="space-y-6 pt-6">
      <h1 className="text-2xl font-bold">All locations</h1>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LOCATIONS.map((l) => (
          <li key={l.slug} className="rounded-xl bg-[#FFFFFF] p-5">
            <Link href={`/locations/${l.slug}`} className="font-bold hover:underline">{l.city}</Link>
            <p className="mt-1 text-sm text-[#6B7280]">{l.areas.join(" · ")}</p>
            <Link href={`/search?location=${encodeURIComponent(l.city)}`} className="mt-2 inline-block text-sm font-semibold text-[#111111] hover:underline">
              Browse providers →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
