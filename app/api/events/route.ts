import { NextResponse } from "next/server";
import { supabasePublic } from "@/lib/supabase";
import { clientIp } from "@/lib/rate-limit";
import { rateLimitAuto } from "@/lib/rate-limit-shared";
import { z } from "zod";

// Allowlisted product events only: the insert runs over RLS (no service
// role on this anonymous path), and trending tallies only these names, so
// junk event names can never influence rankings or bloat privileged writes.
const KNOWN_EVENTS = ["provider_view", "phone_click", "message_click", "directions_click"] as const;
const schema = z.object({
  event: z.enum(KNOWN_EVENTS),
  meta: z.record(z.string().max(64), z.union([z.string().max(200), z.number(), z.boolean()])).optional().default({}),
  path: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  if (!(await rateLimitAuto(`events:${clientIp(req)}`, 120, 60 * 1000))) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  try {
    const body = schema.parse(await req.json());
    const db = supabasePublic();
    if (!db) return NextResponse.json({ ok: false }, { status: 503 });
    const { error } = await db.from("events").insert({ event: body.event, meta: body.meta ?? {}, path: body.path ?? null });
    if (error) return NextResponse.json({ ok: false }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
