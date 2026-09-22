import { NextResponse } from "next/server";

// Liveness + dependency probe for uptime monitors. Checks Auth reachability
// AND a real database round-trip (public categories read — RLS-safe, tiny),
// with per-dependency timings. Reports no secret, key, or internal detail.
//
// force-dynamic: without it Next.js would prerender this GET at build time
// and serve the same frozen payload forever — a health check that never
// checks is worse than none.
export const dynamic = "force-dynamic";
export async function GET() {
  const t0 = Date.now();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json({ ok: false, supabase: "unconfigured" }, { status: 503 });
  }
  const base = url.replace(/\/$/, "");
  async function timed(name: "auth" | "db", run: () => Promise<void>): Promise<{ name: string; ok: boolean; ms: number }> {
    const start = Date.now();
    try {
      await run();
      return { name, ok: true, ms: Date.now() - start };
    } catch {
      return { name, ok: false, ms: Date.now() - start };
    }
  }
  const [auth, db] = await Promise.all([
    timed("auth", async () => {
      const res = await fetch(`${base}/auth/v1/health`, {
        headers: { apikey: anon },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`auth health ${res.status}`);
    }),
    timed("db", async () => {
      const res = await fetch(`${base}/rest/v1/categories?select=name&limit=1`, {
        headers: { apikey: anon, Authorization: `Bearer ${anon}` },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`db health ${res.status}`);
    }),
  ]);
  const ok = auth.ok && db.ok;
  return NextResponse.json(
    { ok, checks: [auth, db], ms: Date.now() - t0 },
    { status: ok ? 200 : 503 }
  );
}
