"use client";

import { useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabaseBrowser, isSupabaseConfigured } from "@/lib/supabase";
import { HeartIcon } from "@/components/UiIcon";
import Toast from "@/components/Toast";
import { SavedContext } from "@/components/SavedProviderBatch";

// Save/unsave heart. When wrapped by <SavedProviderBatch>, state comes from
// one shared fetch per grid instead of one getUser+select per card.
export default function SaveButton({ providerId, returnTo }: { providerId: string; returnTo: string }) {
  const [note, setNote] = useState<string | null>(null);
  const inFlight = useRef(false);
  const batch = useContext(SavedContext);
  const [fallback, setFallback] = useState<"loading" | "out" | "saved" | "unsaved">("loading");
  const saved = batch ? batch.saved.has(providerId) : fallback === "saved";

  useEffect(() => {
    if (batch || !isSupabaseConfigured()) {
      if (!isSupabaseConfigured()) setFallback("out");
      return;
    }
    let live = true;
    supabaseBrowser()
      .auth.getUser()
      .then(async ({ data }) => {
        if (!live) return;
        if (!data.user) {
          setFallback("out");
          return;
        }
        const { data: row } = await supabaseBrowser()
          .from("saved_providers")
          .select("id")
          .eq("user_id", data.user.id)
          .eq("provider_id", providerId)
          .maybeSingle();
        if (live) setFallback(row ? "saved" : "unsaved");
      });
    return () => {
      live = false;
    };
  }, [batch, providerId]);

  async function toggle() {
    if (inFlight.current) return;
    if (batch) {
      await batch.toggle(providerId);
      return;
    }
    inFlight.current = true;
    try {
      const sb = supabaseBrowser();
      const user = (await sb.auth.getUser()).data.user;
      if (!user) {
        setFallback("out");
        return;
      }
      if (saved) {
        const { error } = await sb.from("saved_providers").delete().eq("user_id", user.id).eq("provider_id", providerId);
        if (error) throw error;
        setFallback("unsaved");
        setNote("Removed from saved providers.");
      } else {
        const { error } = await sb.from("saved_providers").insert({ user_id: user.id, provider_id: providerId });
        if (error) throw error;
        setFallback("saved");
        setNote("Saved — find it anytime under Saved.");
      }
    } catch {
      setNote("Couldn’t update saved providers. Try again.");
    } finally {
      inFlight.current = false;
    }
  }

  const guest = batch ? batch.signedOut : fallback === "out";
  if (guest) {
    return (
      <Link href={`/login?next=${encodeURIComponent(returnTo)}`} aria-label="Log in to save this provider" className="grid h-11 w-11 place-items-center rounded-lg border border-black/15 transition-colors hover:bg-black/5">
        <HeartIcon className="h-5 w-5" />
      </Link>
    );
  }
  return (
    <>
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={fallback === "loading"}
        aria-pressed={saved}
        aria-label={saved ? "Remove from saved providers" : "Save this provider"}
        title={saved ? "Saved" : "Save"}
        className={`grid h-11 w-11 place-items-center rounded-lg border transition-all active:scale-95 disabled:opacity-70 ${saved ? "border-[#7A5C00]/50 text-[#7A5C00]" : "border-black/15 hover:bg-black/5"}`}
      >
        <HeartIcon className="h-5 w-5" filled={saved} />
      </button>
      {note && <Toast message={note} type={note.startsWith("Couldn’t") ? "error" : "success"} onClose={() => setNote(null)} />}
    </>
  );
}
