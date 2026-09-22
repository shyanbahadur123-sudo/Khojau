"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseBrowser, isSupabaseConfigured } from "@/lib/supabase";

// Handles Supabase email links that land on the site root with ?code=... or
// ?error=... (e.g. confirm-signup links using the default Site URL). Exchanges
// valid codes for a session; explains expired/invalid links instead of leaving
// users stranded on a silent homepage.
export default function AuthCodeHandler() {
  const params = useSearchParams();
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");

  useEffect(() => {
    const code = params.get("code");
    const err = params.get("error");
    if (!code && !err) return;
    if (!isSupabaseConfigured()) {
      setStatus("error");
      return;
    }
    if (err) {
      setStatus("error");
      return;
    }
    setStatus("working");
    supabaseBrowser()
      .auth.exchangeCodeForSession(window.location.href)
      .then(({ error }) => setStatus(error ? "error" : "done"))
      .catch(() => setStatus("error"));
  }, [params]);

  if (status === "idle") return null;
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6" aria-live="polite">
      <div className="mt-4 rounded-xl border border-[#111111]/30 bg-[#FFFFFF] p-4 text-sm">
        {status === "working" && <p>Confirming your email…</p>}
        {status === "done" && (
          <p>
            <strong>Email confirmed — welcome!</strong> You are now signed in.{" "}
            <a href="/dashboard" className="font-semibold text-[#111111] hover:underline">Go to your dashboard →</a>
          </p>
        )}
        {status === "error" && (
          <p>
            <strong>This link is invalid or has expired.</strong> Request a new confirmation email by registering again,{" "}
            or <a href="/login" className="font-semibold text-[#111111] hover:underline">log in</a> if you already have an account.
          </p>
        )}
      </div>
    </div>
  );
}
