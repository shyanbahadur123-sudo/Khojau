"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import { LOCATIONS } from "@/lib/locations";

export default function SearchBar({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [service, setService] = useState(params.get("q") ?? params.get("service") ?? "");
  const [location, setLocation] = useState(params.get("location") ?? "");
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      role="search"
      aria-label="Find services"
      className="flex w-full flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        const q = new URLSearchParams();
        if (service.trim()) q.set("q", service.trim());
        if (location.trim()) q.set("location", location.trim());
        router.push(`/search?${q.toString()}`);
      }}
    >
      <label className="sr-only" htmlFor="service-input">What service do you need?</label>
      <input
        id="service-input"
        value={service}
        onChange={(e) => setService(e.target.value)}
        placeholder="What do you need? e.g. Plumber"
        autoComplete="off"
        list="khojau-services"
        className="h-11 flex-1 rounded-lg border border-black/15 bg-white px-4 text-base sm:h-12"
      />
      <datalist id="khojau-services">
        {CATEGORIES.map((c) => (
          <option key={c.slug} value={c.name} />
        ))}
      </datalist>
      <label className="sr-only" htmlFor="location-input">Select location</label>
      <input
        id="location-input"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Where? e.g. Baneshwor"
        list="khojau-locations"
        autoComplete="off"
        className="h-11 flex-1 rounded-lg border border-black/15 bg-white px-4 text-base sm:h-12 sm:max-w-xs"
      />
      <datalist id="khojau-locations">
        {LOCATIONS.flatMap((l) => [l.city, ...l.areas.map((a) => `${a}, ${l.city}`)]).map((v) => (
          <option key={v} value={v} />
        ))}
      </datalist>
      <button
        type="submit"
        disabled={submitting}
        className="h-11 rounded-lg bg-[#C9A227] px-6 text-base font-semibold text-black hover:bg-[#B8941F] disabled:opacity-60 sm:h-12"
      >
        {submitting ? "Searching…" : "Find Services"}
      </button>
    </form>
  );
}
