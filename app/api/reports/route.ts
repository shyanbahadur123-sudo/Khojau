import { NextResponse } from "next/server";
import { supabasePublic } from "@/lib/supabase";
import { reportSchema } from "@/lib/validation";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  if (!rateLimit(`reports:${clientIp(req)}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many reports. Please try again later." }, { status: 429 });
  }
  const parsed = reportSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const db = supabasePublic();
  if (!db) return NextResponse.json({ error: "DB not configured" }, { status: 503 });
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
