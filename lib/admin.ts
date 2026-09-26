import "server-only";

import { supabaseServer } from "@/lib/supabase-server";
import { supabaseAdmin, isAdminEmail } from "@/lib/supabase";

export interface AdminContext {
  userId: string;
  email: string;
  admin: NonNullable<ReturnType<typeof supabaseAdmin>>;
}

/** Server-only admin gate. Returns null when the caller is not an admin. */
export async function getAdminContext(): Promise<AdminContext | null> {
  const status = await getAdminStatus();
  return status.ok ? status.ctx : null;
}

export type AdminStatus =
  | { ok: true; ctx: AdminContext }
  | { ok: false; reason: "signed-out" | "forbidden" | "unconfigured" | "mfa-required"; email?: string };

/**
 * Fine-grained gate for admin PAGES (API routes keep using getAdminContext).
 * Distinguishes three very different situations that must never share one
 * message: not signed in (→ login), signed in without admin rights (→ 403
 * explanation, fail-closed), and admin email present but server key missing
 * (→ setup instructions, no secret material).
 */
export async function getAdminStatus(): Promise<AdminStatus> {
  const sb = supabaseServer();
  if (!sb) return { ok: false, reason: "unconfigured" };
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, reason: "signed-out" };
  const email = user.email ?? "";
  if (!isAdminEmail(user.email)) return { ok: false, reason: "forbidden", email };
  const admin = supabaseAdmin();
  if (!admin) return { ok: false, reason: "unconfigured", email };
  // K-03: admins hold destructive power (approve/reject/suspend/delete), so a
  // password alone is not enough once the owner enables MFA enforcement.
  // Gated on ADMIN_REQUIRE_MFA so existing deployments keep working until the
  // owner has: (1) enabled MFA in the Supabase dashboard (Authentication →
  // Sign In / Providers → MFA), (2) enrolled an authenticator app on the
  // admin account(s), (3) set ADMIN_REQUIRE_MFA=true and restarted.
  // Fail-closed: an unverifiable factor state never yields an admin context.
  if (process.env.ADMIN_REQUIRE_MFA === "true") {
    const { data: factors, error: mfaErr } = await sb.auth.mfa.listFactors();
    const verified =
      (factors?.totp ?? []).some((f) => f.status === "verified") ||
      (factors?.phone ?? []).some((f) => f.status === "verified");
    if (mfaErr || !verified) return { ok: false, reason: "mfa-required", email };
  }
  return { ok: true, ctx: { userId: user.id, email, admin } };
}

export async function audit(
  admin: NonNullable<ReturnType<typeof supabaseAdmin>>,
  entry: { actor_id: string; action: string; target_type: string; target_id: string; metadata?: Record<string, unknown> }
): Promise<boolean> {
  // Decision: audit failures must never block moderation (an urgent suspend
  // must go through even if the audit table hiccups), but they must never be
  // silent either — the admin UI claims every action is logged. Callers keep
  // succeeding while this returns false AND logs server-side for follow-up.
  const { error } = await admin.from("admin_audit_log").insert({
    actor_id: entry.actor_id,
    action: entry.action,
    target_type: entry.target_type,
    target_id: entry.target_id,
    metadata: entry.metadata ?? {},
  });
  if (error) {
    console.error("admin audit insert failed:", error.code, entry.action, entry.target_type);
    return false;
  }
  return true;
}
