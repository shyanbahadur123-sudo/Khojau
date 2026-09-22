import { NextResponse } from "next/server";

// Minimal liveness probe for uptime monitors. Reports dependency reachability
// without exposing any secret, key material, or internal detail.
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json({ ok: false, supabase: "unconfigured" }, { status: 503 });
  }
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/auth/v1/health`, {
      headers: { apikey: anon },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`auth health ${res.status}`);
    return NextResponse.json({ ok: true, supabase: "reachable" });
  } catch {
    return NextResponse.json({ ok: false, supabase: "unreachable" }, { status: 503 });
  }
}
