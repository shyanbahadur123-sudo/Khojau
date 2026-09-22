import { NextResponse } from "next/server";
import { audit, getAdminContext } from "@/lib/admin";
import { z } from "zod";

const schema = z.object({
  id: z.string().uuid(),
  to: z.enum(["open", "in_progress", "completed", "cancelled"]),
});

export async function POST(req: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { data: row } = await ctx.admin.from("service_requests").select("id,status").eq("id", parsed.data.id).single();
  if (!row) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  // Service-role bypasses RLS and the status-flow trigger exempts
  // service_role, so operators may set any valid status directly.
  const { error } = await ctx.admin.from("service_requests").update({ status: parsed.data.to }).eq("id", parsed.data.id);
  if (error) {
    console.error("admin request update failed:", error.code);
    return NextResponse.json({ error: "Operation failed. Please try again." }, { status: 500 });
  }

  await audit(ctx.admin, {
    actor_id: ctx.userId,
    action: `request.${parsed.data.to}`,
    target_type: "service_request",
    target_id: parsed.data.id,
    metadata: { from: (row as { status: string }).status },
  });
  return NextResponse.json({ ok: true });
}
