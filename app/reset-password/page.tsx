"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser, isSupabaseConfigured } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto mt-6 max-w-md rounded-2xl bg-[#FFFDF8] p-6">
        <h1 className="text-2xl font-bold">Set new password</h1>
        <p className="mt-2 text-sm">Authentication is not configured yet.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-6 max-w-md rounded-2xl bg-[#FFFDF8] p-6">
      <h1 className="text-2xl font-bold">Set new password</h1>
      <p className="mt-1 text-sm text-[#66706E]">Open this page from the reset link in your email, then choose a new password.</p>
      <form
        className="mt-4 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setStatus(null);
          setLoading(true);
          try {
            const sb = supabaseBrowser();
            // The ?code= in the reset link is exchanged for a session automatically
            // by the Supabase browser client on page load.
            const {
              data: { user },
            } = await sb.auth.getUser();
            if (!user) throw new Error("This reset link is invalid or expired. Request a new one.");
            const { error } = await sb.auth.updateUser({ password });
            if (error) throw error;
            router.push("/login");
          } catch (err) {
            setStatus(err instanceof Error ? err.message : "Update failed.");
          } finally {
            setLoading(false);
          }
        }}
      >
        <div>
          <label htmlFor="password" className="text-sm font-semibold">New password</label>
          <input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-black/15 px-3" />
        </div>
        <button disabled={loading} className="h-11 w-full rounded-lg bg-[#0B7168] font-semibold text-white disabled:opacity-60">
          {loading ? "Saving…" : "Save new password"}
        </button>
        {status && <p role="alert" className="text-sm text-red-700">{status}</p>}
      </form>
    </div>
  );
}
