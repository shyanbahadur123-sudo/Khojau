import { NextResponse } from "next/server";
import { audit, getAdminContext } from "@/lib/admin";
import { isSameOriginRequest } from "@/lib/validation";
import { z } from "zod";

const schema = z.object({
  id: z.string().uuid(),
  action: z.enum(["reviewed", "dismissed"]),
});

export async function POST(req: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!isSameOriginRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { data: row } = await ctx.admin.from("reports").select("id,status").eq("id", parsed.data.id).single();
  if (!row) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  const { error } = await ctx.admin.from("reports").update({ status: parsed.data.action }).eq("id", parsed.data.id);
  if (error) {
    console.error("admin report update failed:", error.code);
    return NextResponse.json({ error: "Operation failed. Please try again." }, { status: 500 });
  }

  const auditLogged = await audit(ctx.admin, {
    actor_id: ctx.userId,
    action: `report.${parsed.data.action}`,
    target_type: "report",
    target_id: parsed.data.id,
    metadata: {},
  });
  return NextResponse.json({ ok: true, auditLogged });
}
