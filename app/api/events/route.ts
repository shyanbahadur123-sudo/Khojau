import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({ event: z.string().min(1).max(60), meta: z.record(z.union([z.string(), z.number(), z.boolean()])).optional().default({}), path: z.string().max(200).optional() });

export async function POST(req: Request) {
  if (!rateLimit(`events:${clientIp(req)}`, 120, 60 * 1000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  try {
    const body = schema.parse(await req.json());
    const admin = supabaseAdmin();
    if (admin) {
      await admin.from("events").insert({ event: body.event, meta: body.meta ?? {}, path: body.path ?? null });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
