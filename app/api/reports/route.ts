import { NextResponse } from "next/server";
import { supabasePublic } from "@/lib/supabase";
import { reportSchema } from "@/lib/validation";

export async function POST(req: Request) {
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
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
