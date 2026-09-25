"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabaseBrowser, isSupabaseConfigured } from "@/lib/supabase";
import { HeartIcon } from "@/components/UiIcon";
import Toast from "@/components/Toast";

// Save/unsave toggle persisted in saved_providers (owner RLS).
// Guests get a login link that returns them to the provider page.
export default function SaveButton({ providerId, returnTo }: { providerId: string; returnTo: string }) {
  const [state, setState] = useState<"loading" | "in" | "out" | "saved" | "unsaved">("loading");
  const [note, setNote] = useState<string | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setState("out");
      return;
    }
    let live = true;
    supabaseBrowser()
      .auth.getUser()
      .then(async ({ data }) => {
        if (!live) return;
        if (!data.user) {
          setState("out");
          return;
        }
        const { data: row } = await supabaseBrowser()
          .from("saved_providers")
          .select("id")
          .eq("user_id", data.user.id)
          .eq("provider_id", providerId)
          .maybeSingle();
        if (live) setState(row ? "saved" : "unsaved");
      });
    return () => {
      live = false;
    };
  }, [providerId]);

  async function toggle() {
    if (inFlight.current || (state !== "saved" && state !== "unsaved")) return;
    inFlight.current = true;
    const was = state;
    try {
      const sb = supabaseBrowser();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) {
        setState("out");
        return;
      }
      if (was === "saved") {
        const { error } = await sb.from("saved_providers").delete().eq("user_id", user.id).eq("provider_id", providerId);
        if (error) throw error;
        setState("unsaved");
        setNote("Removed from saved providers.");
      } else {
        const { error } = await sb.from("saved_providers").insert({ user_id: user.id, provider_id: providerId });
        if (error) throw error;
        setState("saved");
        setNote("Saved — find it anytime under Saved.");
      }
    } catch {
      setState(was);
    } finally {
      inFlight.current = false;
    }
  }

  if (state === "loading") {
    return (
      <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-lg border border-black/15">
        <HeartIcon className="h-5 w-5 opacity-30" />
      </span>
    );
  }

  if (state === "out") {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(returnTo)}`}
        aria-label="Log in to save this provider"
        className="grid h-11 w-11 place-items-center rounded-lg border border-black/15 transition-colors hover:bg-black/5"
      >
        <HeartIcon className="h-5 w-5" />
      </Link>
    );
  }

  const saved = state === "saved";
  const toggling = state !== "saved" && state !== "unsaved";
  return (
    <>
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={toggling}
        aria-pressed={saved}
        aria-label={saved ? "Remove from saved providers" : "Save this provider"}
        title={saved ? "Saved" : "Save"}
        className={`grid h-11 w-11 place-items-center rounded-lg border transition-all active:scale-95 disabled:opacity-70 ${
          saved ? "border-[#7A5C00]/50 text-[#7A5C00]" : "border-black/15 hover:bg-black/5"
        }`}
      >
        <HeartIcon className="h-5 w-5" filled={saved} />
      </button>
      {note && <Toast message={note} type="success" onClose={() => setNote(null)} />}
    </>
  );
}
