"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser, isSupabaseConfigured } from "@/lib/supabase";
import { safeRedirectPath } from "@/lib/validation";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const oauthError =
    params.get("error") === "oauth_cancelled"
      ? "Google sign-in was cancelled. Please try again."
      : params.get("error") === "oauth_failed"
        ? "We couldn't sign you in with Google. Please try again."
        : null;

  async function signInWithGoogle() {
    setError(null);
    setOauthLoading(true);
    try {
      const sb = supabaseBrowser();
      // The callback validates `next` again server-side; OAuth itself is
      // completed by Supabase + Google, never simulated locally.
      const next = safeRedirectPath(params.get("next"));
      const { error: oauthErr } = await sb.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
      });
      if (oauthErr) throw oauthErr;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
      setOauthLoading(false);
    }
  }

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto mt-6 max-w-md rounded-2xl bg-[#FFFDF8] p-6">
        <h1 className="text-2xl font-bold">{mode === "register" ? "Create account" : "Log in"}</h1>
        <p className="mt-2 text-sm">Authentication is not configured yet. Add Supabase credentials to <code>.env.local</code>.</p>
      </div>
    );
  }

  return (
    <form
      className="mx-auto mt-6 max-w-md space-y-3 rounded-2xl bg-[#FFFDF8] p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setNotice(null);
        setLoading(true);
        try {
          const sb = supabaseBrowser();
          if (mode === "register") {
            const { data, error } = await sb.auth.signUp({ email, password });
            if (error) throw error;
            // Email confirmation ON → no session yet; user must confirm first.
            if (!data.session) {
              setNotice("Account created. Check your email for a confirmation link, then log in.");
              return;
            }
          } else {
            const { error } = await sb.auth.signInWithPassword({ email, password });
            if (error) throw error;
          }
          router.push(safeRedirectPath(params.get("next")));
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Authentication failed");
        } finally {
          setLoading(false);
        }
      }}
    >
      <h1 className="text-2xl font-bold">{mode === "register" ? "Create account" : "Log in"}</h1>
      <p className="text-sm text-[#66706E]">
        {mode === "register" ? "One account for requesting services and listing your business." : "Welcome back."}
      </p>
      <button
        type="button"
        disabled={oauthLoading}
        onClick={() => void signInWithGoogle()}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-black/15 bg-white font-semibold hover:border-black/30 disabled:opacity-60"
      >
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.5h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.1.1 3.5 2.7.1.1c2.2-2 3.9-5 3.9-8.9z" />
          <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.2 0-5.9-2.1-6.8-5l-.1.1-3.6 2.8-.1.1C3.5 21.3 7.5 24 12 24z" />
          <path fill="#FBBC05" d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-.1-.1-3.6-2.8-.1.1C.5 8.9 0 10.4 0 12s.5 3.1 1.4 4.4l3.8-2z" />
          <path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.5 0 3.5 2.7 1.4 6.8l3.8 2.9c.9-2.9 3.6-5 6.8-5z" />
        </svg>
        {oauthLoading ? "Connecting…" : mode === "register" ? "Continue with Google" : "Sign in with Google"}
      </button>
      <div className="flex items-center gap-3 text-xs text-[#66706E]" aria-hidden="true">
        <span className="h-px flex-1 bg-black/10" />
        <span>or with email</span>
        <span className="h-px flex-1 bg-black/10" />
      </div>
      <div>
        <label htmlFor="email" className="text-sm font-semibold">Email</label>
        <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-black/15 px-3" />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-semibold">Password</label>
        <input id="password" type="password" required minLength={6} autoComplete={mode === "register" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-black/15 px-3" />
        {mode === "register" && <p className="mt-1 text-xs text-[#66706E]">At least 6 characters.</p>}
      </div>
      {(error || oauthError) && <p role="alert" className="text-sm text-red-700">{error ?? oauthError}</p>}
      {notice && <p role="status" className="text-sm text-[#0B7168]">{notice}</p>}
      <button disabled={loading} className="h-11 w-full rounded-lg bg-[#0B7168] font-semibold text-white disabled:opacity-60">
        {loading ? "Please wait…" : mode === "register" ? "Register" : "Log in"}
      </button>
      <p className="text-sm text-[#66706E]">
        {mode === "register" ? (
          <>Already have an account? <a href="/login" className="underline">Log in</a></>
        ) : (
          <>No account? <a href="/register" className="underline">Register</a><br /><a href="/forgot-password" className="underline">Forgot password?</a></>
        )}
      </p>
    </form>
  );
}
