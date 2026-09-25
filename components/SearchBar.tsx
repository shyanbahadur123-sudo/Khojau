"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import { LOCATIONS } from "@/lib/locations";

// Server-rendered placeholder so the search control exists in HTML before
// hydration (Suspense fallback). Matches the real bar's footprint.
export function SearchBarSkeleton() {
  return (
    <div aria-hidden="true" className="flex w-full flex-col gap-2 sm:flex-row">
      <div className="h-11 flex-1 animate-pulse rounded-lg bg-black/5 sm:h-12" />
      <div className="h-11 flex-1 animate-pulse rounded-lg bg-black/5 sm:h-12 sm:max-w-xs" />
      <div className="h-11 w-full animate-pulse rounded-lg bg-black/5 sm:h-12 sm:w-40" />
    </div>
  );
}

const RECENT_KEY = "khojau-recent-searches";
const MAX_SUGGESTIONS = 6;

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((s) => typeof s === "string").slice(0, 5) : [];
  } catch {
    return [];
  }
}

const ALL_LOCATIONS = LOCATIONS.flatMap((l) => [l.city, ...l.areas.map((a) => `${a}, ${l.city}`)]);

export default function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [service, setService] = useState(params.get("q") ?? params.get("service") ?? "");
  const [location, setLocation] = useState(params.get("location") ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [openFor, setOpenFor] = useState<"service" | "location" | null>(null);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);
  const [debouncedService, setDebouncedService] = useState(service);
  const [debouncedLocation, setDebouncedLocation] = useState(location);
  const wrapRef = useRef<HTMLDivElement>(null);
  const serviceId = useId();
  const locationId = useId();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedService(service), 120);
    return () => clearTimeout(t);
  }, [service]);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedLocation(location), 120);
    return () => clearTimeout(t);
  }, [location]);

  useEffect(() => {
    try {
      setRecent(loadRecent());
    } catch {
      // Private mode: suggestions still work, recents just stay empty.
    }
  }, []);

  useEffect(() => {
    if (!openFor) return;
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpenFor(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenFor(null);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openFor]);

  const serviceSuggestions = useMemo(() => {
    const q = debouncedService.trim().toLowerCase();
    if (!q) return CATEGORIES.slice(0, MAX_SUGGESTIONS).map((c) => ({ value: c.name, hint: c.description ?? "" }));
    return CATEGORIES.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.description ?? "").toLowerCase().includes(q)
    )
      .slice(0, MAX_SUGGESTIONS)
      .map((c) => ({ value: c.name, hint: c.description ?? "" }));
  }, [debouncedService]);

  const locationSuggestions = useMemo(() => {
    const q = debouncedLocation.trim().toLowerCase();
    if (!q) return ALL_LOCATIONS.slice(0, MAX_SUGGESTIONS).map((v) => ({ value: v, hint: "" }));
    return ALL_LOCATIONS.filter((v) => v.toLowerCase().includes(q))
      .slice(0, MAX_SUGGESTIONS)
      .map((v) => ({ value: v, hint: "" }));
  }, [debouncedLocation]);

  function submit(serviceVal: string, locationVal: string) {
    if (submitting) return;
    setSubmitting(true);
    setOpenFor(null);
    const label = serviceVal.trim() || locationVal.trim();
    if (label) {
      try {
        const next = [label, ...loadRecent().filter((r) => r !== label)].slice(0, 5);
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
        setRecent(next);
      } catch {
        // Private mode: search still works.
      }
    }
    const q = new URLSearchParams();
    if (serviceVal.trim()) q.set("q", serviceVal.trim());
    if (locationVal.trim()) q.set("location", locationVal.trim());
    router.push(`/search?${q.toString()}`);
    // Reset so back-navigation re-submits cleanly.
    setTimeout(() => setSubmitting(false), 1500);
  }

  const activeList = openFor === "service" ? serviceSuggestions : openFor === "location" ? locationSuggestions : [];

  function onFieldKey(e: React.KeyboardEvent, field: "service" | "location") {
    if (field !== openFor && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpenFor(field);
      setActiveIdx(0);
      e.preventDefault();
      return;
    }
    if (e.key === "ArrowDown") {
      setActiveIdx((i) => Math.min(activeList.length - 1, i + 1));
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setActiveIdx((i) => Math.max(-1, i - 1));
      e.preventDefault();
    } else if (e.key === "Enter" && openFor && activeIdx >= 0 && activeList[activeIdx]) {
      const pick = activeList[activeIdx].value;
      if (field === "service") {
        setService(pick);
        submit(pick, location);
      } else {
        setLocation(pick);
        submit(service, pick);
      }
      e.preventDefault();
    }
  }

  function renderDropdown(field: "service" | "location") {
    if (openFor !== field) return null;
    const list = field === "service" ? serviceSuggestions : locationSuggestions;
    const listId = field === "service" ? `${serviceId}-list` : `${locationId}-list`;
    return (
      <ul
        id={listId}
        role="listbox"
        aria-label={field === "service" ? "Service suggestions" : "Location suggestions"}
        className="absolute inset-x-0 top-full z-30 mt-1 max-h-64 overflow-auto rounded-lg border border-black/10 bg-[#FFFFFF] p-1 shadow-xl"
      >
        {field === "service" && !debouncedService.trim() && recent.length > 0 && (
          <li aria-hidden="true" className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">
            Recent searches
          </li>
        )}
        {field === "service" && !debouncedService.trim()
          ? recent.map((r) => (
              <li key={r} role="option" aria-selected={false}>
                <button
                  type="button"
                  onClick={() => {
                    setService(r);
                    submit(r, location);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-[15px] hover:bg-black/5"
                >
                  <span aria-hidden="true">↻</span> {r}
                </button>
              </li>
            ))
          : null}
        {list.length === 0 && (
          <li className="px-3 py-2.5 text-sm text-[#6B7280]">No matches — press Search to try anyway.</li>
        )}
        {list.map((s, i) => (
          <li key={s.value} role="option" aria-selected={i === activeIdx}>
            <button
              type="button"
              onMouseEnter={() => setActiveIdx(i)}
              onClick={() => {
                if (field === "service") {
                  setService(s.value);
                  submit(s.value, location);
                } else {
                  setLocation(s.value);
                  submit(service, s.value);
                }
              }}
              className={`flex w-full flex-col rounded-md px-3 py-2.5 text-left hover:bg-black/5 ${i === activeIdx ? "bg-black/5" : ""}`}
            >
              <span className="text-[15px] font-medium">{s.value}</span>
              {s.hint && <span className="text-xs text-[#6B7280]">{s.hint}</span>}
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div ref={wrapRef}>
      <form
        role="search"
        aria-label="Find services"
        className="flex w-full flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          submit(service, location);
        }}
      >
        <div className="relative flex-1">
          <label className="sr-only" htmlFor={`${serviceId}-input`}>
            What service do you need?
          </label>
          <input
            id={`${serviceId}-input`}
            value={service}
            onChange={(e) => {
              setService(e.target.value);
              setOpenFor("service");
              setActiveIdx(-1);
            }}
            onFocus={() => {
              setOpenFor("service");
              setActiveIdx(-1);
            }}
            onKeyDown={(e) => onFieldKey(e, "service")}
            placeholder="What do you need? e.g. Plumber"
            autoComplete="off"
            role="combobox"
            aria-expanded={openFor === "service"}
            aria-controls={`${serviceId}-list`}
            aria-autocomplete="list"
            className="h-11 w-full rounded-lg border border-black/15 bg-white px-4 pr-10 text-base sm:h-12"
          />
          {service && (
            <button
              type="button"
              aria-label="Clear service"
              onClick={() => setService("")}
              className="absolute right-1 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-md text-[#6B7280] hover:bg-black/5"
            >
              ✕
            </button>
          )}
          {renderDropdown("service")}
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <label className="sr-only" htmlFor={`${locationId}-input`}>
            Where?
          </label>
          <input
            id={`${locationId}-input`}
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setOpenFor("location");
              setActiveIdx(-1);
            }}
            onFocus={() => {
              setOpenFor("location");
              setActiveIdx(-1);
            }}
            onKeyDown={(e) => onFieldKey(e, "location")}
            placeholder="Where? e.g. Kathmandu"
            autoComplete="off"
            role="combobox"
            aria-expanded={openFor === "location"}
            aria-controls={`${locationId}-list`}
            aria-autocomplete="list"
            className="h-11 w-full rounded-lg border border-black/15 bg-white px-4 pr-10 text-base sm:h-12"
          />
          {location && (
            <button
              type="button"
              aria-label="Clear location"
              onClick={() => setLocation("")}
              className="absolute right-1 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-md text-[#6B7280] hover:bg-black/5"
            >
              ✕
            </button>
          )}
          {renderDropdown("location")}
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="h-11 min-h-[44px] rounded-lg bg-[#C9A227] px-6 text-base font-semibold text-black hover:bg-[#B8941F] disabled:opacity-60 sm:h-12"
        >
          {submitting ? "Searching…" : "Find Services"}
        </button>
      </form>
    </div>
  );
}
