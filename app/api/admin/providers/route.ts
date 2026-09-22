import { NextResponse } from "next/server";
import { audit, getAdminContext } from "@/lib/admin";
import { z } from "zod";

// Generic failure message: never leak constraint/DB internals to the browser.
const FAILED = "Operation failed. Please try again.";

const schema = z.object({
  id: z.string().uuid(),
  action: z.enum(["approve", "reject", "suspend", "verify", "unverify", "plan", "delete"]),
  plan: z.enum(["free", "featured", "premium"]).optional(),
});

export async function POST(req: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { id, action, plan } = parsed.data;

  // Never trust the id: the row must exist, otherwise report 404 (previously
  // returned ok:true for phantom ids).
  const { data: row } = await ctx.admin
    .from("providers")
    .select("id,status,verification_status,plan")
    .eq("id", id)
    .single();
  if (!row) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

  let patch: Record<string, string> | null = null;
  if (action === "approve") patch = { status: "approved" };
  else if (action === "reject") patch = { status: "rejected" };
  else if (action === "suspend") patch = { status: "suspended" };
  else if (action === "verify") patch = { verification_status: "verified" };
  else if (action === "unverify") patch = { verification_status: "unverified" };
  else if (action === "plan") {
    if (!plan) return NextResponse.json({ error: "Missing plan" }, { status: 400 });
    patch = { plan };
  }

  if (patch) {
    const { error } = await ctx.admin.from("providers").update(patch).eq("id", id);
    if (error) {
      console.error("admin provider update failed:", error.code);
      return NextResponse.json({ error: FAILED }, { status: 500 });
    }
  } else {
    // delete
    const { error } = await ctx.admin.from("providers").delete().eq("id", id);
    if (error) {
      console.error("admin provider delete failed:", error.code);
      return NextResponse.json({ error: FAILED }, { status: 500 });
    }
  }

  await audit(ctx.admin, {
    actor_id: ctx.userId,
    action: `provider.${action}`,
    target_type: "provider",
    target_id: id,
    metadata: { plan: plan ?? null },
  });
  return NextResponse.json({ ok: true });
}
