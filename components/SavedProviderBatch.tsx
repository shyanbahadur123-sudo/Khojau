"use client";

import { createContext, useEffect, useRef, useState } from "react";
import { supabaseBrowser, isSupabaseConfigured } from "@/lib/supabase";

type SavedMap = Map<string, true>;

// Batch context shared by every SaveButton in a grid. `signedOut` drives the
// login link path so guests don't get a silently-broken toggle.
export const SavedContext = createContext<{
  saved: Map<string, true>;
  signedOut: boolean;
  toggle: (providerId: string) => Promise<void>;
} | null>(null);

export function SavedProviderBatch({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = useState<SavedMap | null>(null);
  const [signedOut, setSignedOut] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setSaved(new Map());
      setSignedOut(true);
      return;
    }
    let live = true;
    (async () => {
      const { data } = await supabaseBrowser().auth.getSession();
      if (!live) return;
      if (!data.session) {
        setSaved(new Map());
        setSignedOut(true);
        return;
      }
      const { data: rows } = await supabaseBrowser()
        .from("saved_providers")
        .select("provider_id");
      if (live) setSaved(new Map(((rows ?? []) as { provider_id: string }[]).map((r) => [r.provider_id, true])));
    })();
    const { data: sub } = supabaseBrowser().auth.onAuthStateChange((_e, session) => {
      if (!live) return;
      if (!session) {
        setSaved(new Map());
        setSignedOut(true);
      }
    });
    return () => {
      live = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const writing = useRef(new Set<string>());

  async function toggle(providerId: string) {
    if (!saved || writing.current.has(providerId)) return;
    const sb = supabaseBrowser();
    const { data } = await sb.auth.getUser();
    if (!data.user) {
      setSignedOut(true);
      return;
    }
    writing.current.add(providerId);
    try {
      if (saved.has(providerId)) {
        const { error } = await sb.from("saved_providers").delete().eq("user_id", data.user.id).eq("provider_id", providerId);
        if (error) throw error;
        setSaved((prev) => {
          const next = new Map(prev ?? new Map());
          next.delete(providerId);
          return next;
        });
      } else {
        const { error } = await sb.from("saved_providers").insert({ user_id: data.user.id, provider_id: providerId });
        if (error) throw error;
        setSaved((prev) => new Map(prev ?? new Map()).set(providerId, true));
      }
    } finally {
      writing.current.delete(providerId);
    }
  }

  return (
    <SavedContext.Provider value={{ saved: saved ?? new Map(), signedOut, toggle }}>
      {children}
    </SavedContext.Provider>
  );
}
