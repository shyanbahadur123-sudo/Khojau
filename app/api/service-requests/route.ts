import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { serviceRequestSchema } from "@/lib/validation";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// Server boundary for request submission: validates provider/service linkage
// explicitly for friendly errors (RLS WITH CHECK is the authorative backstop),
// forces status='open', and attaches customer_id from the session when signed in.
// Anonymous submissions are rate-limited per IP (see lib/rate-limit.ts).
export async function POST(req: Request) {
  if (!rateLimit(`service-requests:${clientIp(req)}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }
  const parsed = serviceRequestSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return NextResponse.json({ error: "Service not configured" }, { status: 503 });

  const cookieStore = cookies();
  const sb = createServerClient(url, anon, {
    cookies: { get: (n: string) => cookieStore.get(n)?.value, set() {}, remove() {} },
  });
  const {
    data: { user },
  } = await sb.auth.getUser();

  const d = parsed.data;
  const providerId = d.provider_id || null;
  const serviceId = d.service_id || null;

  // Server-side linkage validation (friendly errors; RLS enforces regardless).
  if (providerId) {
    const { data: p } = await sb.from("providers").select("id,status").eq("id", providerId).single();
    if (!p || (p as { status: string }).status !== "approved") {
      return NextResponse.json({ error: "Selected provider is not available." }, { status: 400 });
    }
  }
  if (serviceId) {
    if (!providerId) {
      return NextResponse.json({ error: "A service must belong to the selected provider." }, { status: 400 });
    }
    const { data: s } = await sb.from("services").select("id,provider_id").eq("id", serviceId).single();
    if (!s || (s as { provider_id: string }).provider_id !== providerId) {
      return NextResponse.json({ error: "Selected service does not belong to this provider." }, { status: 400 });
    }
  }

  const { error } = await sb.from("service_requests").insert({
    service: d.service,
    location: d.location,
    description: d.description,
    preferred_time: d.preferred_time || null,
    phone: d.phone,
    provider_id: providerId,
    service_id: serviceId,
    customer_id: user?.id ?? null,
    status: "open",
  });
  if (error) return NextResponse.json({ error: "Could not submit. Please try again." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
