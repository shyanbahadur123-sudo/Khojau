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
  const sb = supabaseServer();
  if (!sb) return null;
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user || !isAdminEmail(user.email)) return null;
  const admin = supabaseAdmin();
  if (!admin) return null;
  return { userId: user.id, email: user.email ?? "", admin };
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
