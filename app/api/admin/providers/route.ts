import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin, isAdminEmail } from "@/lib/supabase";
import { z } from "zod";

const schema = z.object({
  id: z.string().uuid(),
  action: z.enum(["approve", "reject", "suspend", "verify", "unverify", "plan", "delete", "feature"]),
  plan: z.enum(["free", "featured", "premium"]).optional(),
});

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const cookieStore = cookies();
  const sb = createServerClient(url, anon, {
    cookies: { get: (n: string) => cookieStore.get(n)?.value, set() {}, remove() {} },
  });
  const { data: { user } } = await sb.auth.getUser();
  if (!user || !isAdminEmail(user.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Admin DB not configured" }, { status: 503 });

  const { id, action, plan } = parsed.data;
  let error = null;
  if (action === "approve") ({ error } = await admin.from("providers").update({ status: "approved" }).eq("id", id));
  else if (action === "reject") ({ error } = await admin.from("providers").update({ status: "rejected" }).eq("id", id));
  else if (action === "suspend") ({ error } = await admin.from("providers").update({ status: "suspended" }).eq("id", id));
  else if (action === "verify") ({ error } = await admin.from("providers").update({ verification_status: "verified" }).eq("id", id));
  else if (action === "unverify") ({ error } = await admin.from("providers").update({ verification_status: "unverified" }).eq("id", id));
  else if (action === "plan" || action === "feature") {
    if (!plan) return NextResponse.json({ error: "Missing plan" }, { status: 400 });
    ({ error } = await admin.from("providers").update({ plan }).eq("id", id));
  } else if (action === "delete") ({ error } = await admin.from("providers").delete().eq("id", id));

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
