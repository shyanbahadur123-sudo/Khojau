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
  const [showPw, setShowPw] = useState(false);
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
      // Bare path on purpose: the Supabase Redirect URL allow-list matches
      // exact strings, so the registered value must be exactly
      // `<origin>/auth/callback` with no query (?next= would break the match
      // and Supabase would fall back to Site URL). Post-login landing is
      // /dashboard; email/password logins keep deep-link `next` support.
      const { error: oauthErr } = await sb.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (oauthErr) throw oauthErr;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
      setOauthLoading(false);
    }
  }

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto mt-6 w-full max-w-md rounded-2xl border border-black/10 bg-[#FFFFFF] p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight">{mode === "register" ? "Create account" : "Log in"}</h1>
        <p className="mt-2 text-sm">Authentication is not configured yet. Add Supabase credentials to <code>.env.local</code>.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-6 w-full max-w-md">
      <form
        className="space-y-4 rounded-2xl border border-black/10 bg-[#FFFFFF] p-6 shadow-sm sm:p-8"
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
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7A5C00]">
            {mode === "register" ? "Join Khojau" : "Welcome back"}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{mode === "register" ? "Create account" : "Log in"}</h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            {mode === "register" ? "One account for requesting services and listing your business." : "Access your listings and requests."}
          </p>
        </div>
        <button
          type="button"
          disabled={oauthLoading}
          onClick={() => void signInWithGoogle()}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-black/15 bg-transparent font-semibold transition-colors hover:bg-black/5 disabled:opacity-60"
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.5h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.1.1 3.5 2.7.1.1c2.2-2 3.9-5 3.9-8.9z" />
            <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.2 0-5.9-2.1-6.8-5l-.1.1-3.6 2.8-.1.1C3.5 21.3 7.5 24 12 24z" />
            <path fill="#FBBC05" d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-.1-.1-3.6-2.8-.1.1C.5 8.9 0 10.4 0 12s.5 3.1 1.4 4.4l3.8-2z" />
            <path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.5 0 3.5 2.7 1.4 6.8l3.8 2.9c.9-2.9 3.6-5 6.8-5z" />
          </svg>
          {oauthLoading ? "Connecting…" : mode === "register" ? "Continue with Google" : "Sign in with Google"}
        </button>
        <div className="flex items-center gap-3 text-xs text-[#6B7280]" aria-hidden="true">
          <span className="h-px flex-1 bg-black/10" />
          <span>or with email</span>
          <span className="h-px flex-1 bg-black/10" />
        </div>
        <div>
          <label htmlFor="email" className="text-sm font-semibold">Email</label>
          <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1 h-12 w-full rounded-lg border border-black/15 bg-transparent px-3 transition-colors focus:border-black/30" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-semibold">Password</label>
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
              aria-pressed={showPw}
              className="rounded px-1 text-xs font-semibold text-[#6B7280] hover:underline"
            >
              {showPw ? "Hide" : "Show"}
            </button>
          </div>
          <input id="password" type={showPw ? "text" : "password"} required minLength={6} autoComplete={mode === "register" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1 h-12 w-full rounded-lg border border-black/15 bg-transparent px-3 transition-colors focus:border-black/30" />
          {mode === "register" && <p className="mt-1 text-xs text-[#6B7280]">At least 6 characters.</p>}
        </div>
        {(error || oauthError) && <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400">{error ?? oauthError}</p>}
        {notice && <p role="status" className="rounded-lg bg-[#C9A227]/15 p-3 text-sm text-[#7A5C00]">{notice}</p>}
        <button disabled={loading} className="h-12 w-full rounded-lg bg-[#C9A227] font-semibold text-black transition-colors hover:bg-[#B8941F] disabled:opacity-60">
          {loading ? "Please wait…" : mode === "register" ? "Create account" : "Log in"}
        </button>
        <div className="flex items-center justify-between text-sm">
          {mode === "register" ? (
            <p className="text-[#6B7280]">Have an account? <a href="/login" className="font-semibold text-[#0A0A0A] underline underline-offset-2">Log in</a></p>
          ) : (
            <>
              <p className="text-[#6B7280]">New here? <a href="/register" className="font-semibold text-[#0A0A0A] underline underline-offset-2">Register</a></p>
              <a href="/forgot-password" className="font-semibold text-[#0A0A0A] underline underline-offset-2">Forgot password?</a>
            </>
          )}
        </div>
      </form>
      <p className="mt-4 text-center text-xs leading-relaxed text-[#6B7280]">
        By continuing you agree to our <a href="/terms" className="underline underline-offset-2">Terms</a> and <a href="/privacy" className="underline underline-offset-2">Privacy Policy</a>.
      </p>
    </div>
  );
}
