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
            <strong>Link accepted — you are now signed in.</strong>{" "}
            <a href="/dashboard" className="font-semibold text-[#7A5C00] hover:underline">Go to your dashboard →</a>
            <br />
            <span className="text-[#6B7280]">
              Resetting your password instead?{" "}
              <a href="/reset-password" className="font-semibold text-[#7A5C00] hover:underline">Choose a new password →</a>
            </span>
          </p>
        )}
        {status === "error" && (
          <p>
            <strong>This link is invalid or has expired.</strong> Email links work
            only once, only for a short time, and only in the same browser you
            requested them from — request a fresh link, then open it in that
            same browser (not a private tab).{" "}
            <a href="/login" className="font-semibold text-[#7A5C00] hover:underline">Back to login</a>
          </p>
        )}
      </div>
    </div>
  );
}
