"use client";

import { useState } from "react";
import { supabaseBrowser, isSupabaseConfigured } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto mt-6 max-w-md rounded-2xl bg-[#FFFFFF] p-6">
        <h1 className="text-2xl font-bold">Reset password</h1>
        <p className="mt-2 text-sm">Authentication is not configured yet.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-6 max-w-md rounded-2xl bg-[#FFFFFF] p-6">
      <h1 className="text-2xl font-bold">Reset password</h1>
      <p className="mt-1 text-sm text-[#6B7280]">We&apos;ll email you a link to set a new password.</p>
      <form
        className="mt-4 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setStatus(null);
          setLoading(true);
          try {
            const sb = supabaseBrowser();
            const { error } = await sb.auth.resetPasswordForEmail(email, {
              redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) throw error;
            setStatus("If an account exists for that email, a reset link is on its way.");
          } catch (err) {
            setStatus(err instanceof Error ? err.message : "Request failed.");
          } finally {
            setLoading(false);
          }
        }}
      >
        <div>
          <label htmlFor="email" className="text-sm font-semibold">Email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-black/15 px-3" />
        </div>
        <button disabled={loading} className="h-11 w-full rounded-lg bg-[#C9A227] font-semibold text-black disabled:opacity-60">
          {loading ? "Sending…" : "Send reset link"}
        </button>
        {status && <p role="status" className="text-sm text-[#6B7280]">{status}</p>}
      </form>
    </div>
  );
}
