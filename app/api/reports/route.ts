import { NextResponse } from "next/server";
import { supabasePublic } from "@/lib/supabase";
import { reportSchema } from "@/lib/validation";
import { clientIp } from "@/lib/rate-limit";
import { rateLimitAuto } from "@/lib/rate-limit-shared";

export async function POST(req: Request) {
  if (!(await rateLimitAuto(`reports:${clientIp(req)}`, 5, 10 * 60 * 1000))) {
    return NextResponse.json({ error: "Too many reports. Please try again later." }, { status: 429 });
  }
  const parsed = reportSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const db = supabasePublic();
  if (!db) return NextResponse.json({ error: "DB not configured" }, { status: 503 });
  // Existence pre-check with an identical response to a database failure, so
  // the endpoint cannot be used to probe whether a provider ID exists (the
  // old code returned 500 here vs 400 for malformed input). Reports against
  // listings of any status are accepted; moderation happens in /admin.
  const { data: target } = await db.from("providers").select("id").eq("id", parsed.data.provider_id).single();
  if (!target) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { error } = await db.from("reports").insert({
    provider_id: parsed.data.provider_id,
    reason: parsed.data.reason,
    contact: parsed.data.contact || null,
    status: "open",
  });
  if (error) {
    console.error("report insert failed:", error.code);
    return NextResponse.json({ error: "Could not submit. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
