"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { LOCATIONS } from "@/lib/locations";

export default function SearchBar({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [service, setService] = useState(params.get("q") ?? params.get("service") ?? "");
  const [location, setLocation] = useState(params.get("location") ?? "");

  return (
    <form
      role="search"
      aria-label="Find services"
      className={`flex w-full flex-col gap-2 ${compact ? "sm:flex-row" : "sm:flex-row"}`}
      onSubmit={(e) => {
        e.preventDefault();
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
        placeholder="What service do you need? e.g. Electrician"
        autoComplete="off"
        className="h-12 flex-1 rounded-lg border border-black/15 bg-white px-4 text-base"
      />
      <label className="sr-only" htmlFor="location-input">Select location</label>
      <input
        id="location-input"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Select location e.g. Baneshwor, Kathmandu"
        list="khojau-locations"
        autoComplete="off"
        className="h-12 flex-1 rounded-lg border border-black/15 bg-white px-4 text-base sm:max-w-xs"
      />
      <datalist id="khojau-locations">
        {LOCATIONS.flatMap((l) => [l.city, ...l.areas.map((a) => `${a}, ${l.city}`)]).map((v) => (
          <option key={v} value={v} />
        ))}
      </datalist>
      <button
        type="submit"
        className="h-12 rounded-lg bg-[#0B7168] px-6 text-base font-semibold text-white hover:bg-[#095A53]"
      >
        Find Services
      </button>
    </form>
  );
}
