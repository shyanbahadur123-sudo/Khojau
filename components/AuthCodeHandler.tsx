"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser, isSupabaseConfigured } from "@/lib/supabase";

// Handles Supabase email links that land on the site root with ?code=... or
// ?error=... (e.g. confirm-signup links using the default Site URL). Exchanges
// valid codes for a session; explains expired/invalid links instead of leaving
// users stranded on a silent homepage.
export default function AuthCodeHandler() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");

  useEffect(() => {
    const code = params.get("code");
    const err = params.get("error");
    if (!code && !err) return;
    // Single-use codes must not linger in history, synced tabs, or URL logs:
    // strip ?code= / ?error= once settled.
    const scrubQuery = () => {
      try {
        router.replace(window.location.pathname, { scroll: false });
      } catch {
        // Non-critical hygiene; the exchange result stands regardless.
      }
    };
    if (!isSupabaseConfigured()) {
      setStatus("error");
      scrubQuery();
      return;
    }
    if (err) {
      setStatus("error");
      scrubQuery();
      return;
    }
    setStatus("working");
    // Pass ONLY the code: the token endpoint rejects anything else
    // (a full URL here fails every exchange — verified in auth-js source).
    // Afterwards, trust the SESSION, not the call: the browser client can
    // auto-detect the same URL session first (consuming the single-use
    // code), in which case our exchange errors while the user is in fact
    // signed in. getUser() settles who is right.
    void (async () => {
      try {
        const sb = supabaseBrowser();
        const { error } = await sb.auth.exchangeCodeForSession(code as string);
        if (!error) {
          setStatus("done");
          scrubQuery();
          return;
        }
        const { data } = await sb.auth.getUser();
        setStatus(data.user ? "done" : "error");
      } catch {
        setStatus("error");
      } finally {
        scrubQuery();
      }
    })();
  }, [params, router]);

  if (status === "idle") return null;
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6" aria-live="polite">
      <div className="mt-4 rounded-xl border border-[#111111]/30 bg-[#FFFFFF] p-4 text-sm">
        {status === "working" && <p>Confirming your email…</p>}
        {status === "done" && (
          <p>
            <strong>Link accepted — you are now signed in.</strong>{" "}
            <a href="/" className="font-semibold text-[#7A5C00] hover:underline">Back to Khojau home →</a>
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
