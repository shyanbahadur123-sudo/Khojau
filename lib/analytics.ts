"use client";

// Minimal privacy-friendly analytics: POSTs to /api/events (Supabase `events` table).
// No third-party trackers — important for Nepal mobile data.
export function track(event: string, meta?: Record<string, string | number | boolean>) {
  try {
    const body = JSON.stringify({ event, meta: meta ?? {}, path: window.location.pathname });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
    }
  } catch {
    // ignore
  }
}
