"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

// Binds call/message/directions clicks to lightweight analytics + provider_view on mount.
export default function ContactTracker({ providerId }: { providerId: string }) {
  useEffect(() => {
    track("provider_view", { providerId });
    const handler = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest("[data-track]");
      if (!el) return;
      const event = el.getAttribute("data-track") ?? "click";
      track(event, { providerId });
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [providerId]);
  return null;
}
