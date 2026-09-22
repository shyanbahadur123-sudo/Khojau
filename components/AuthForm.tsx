"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="mx-auto mt-6 max-w-md space-y-3 rounded-2xl bg-[#FFFDF8] p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
          const sb = supabaseBrowser();
          if (mode === "register") {
            const { error } = await sb.auth.signUp({ email, password });
            if (error) throw error;
          } else {
            const { error } = await sb.auth.signInWithPassword({ email, password });
            if (error) throw error;
          }
          router.push("/dashboard");
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Authentication failed");
        } finally {
          setLoading(false);
        }
      }}
    >
      <h1 className="text-2xl font-bold">{mode === "register" ? "Create account" : "Log in"}</h1>
      <div>
        <label htmlFor="email" className="text-sm font-semibold">Email</label>
        <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-black/15 px-3" />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-semibold">Password</label>
        <input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-black/15 px-3" />
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button disabled={loading} className="h-11 w-full rounded-lg bg-[#0B7168] font-semibold text-white disabled:opacity-60">
        {loading ? "Please wait…" : mode === "register" ? "Register" : "Log in"}
      </button>
      <p className="text-sm text-[#66706E]">
        {mode === "register" ? (
          <>Already have an account? <a href="/login" className="underline">Log in</a></>
        ) : (
          <>No account? <a href="/register" className="underline">Register</a></>
        )}
      </p>
    </form>
  );
}
