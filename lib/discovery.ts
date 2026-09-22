import "server-only";

import { supabaseAdmin } from "@/lib/supabase";
import { getApprovedProviders } from "@/lib/providers";
import { tallyTrendScores } from "@/lib/search";
import type { Provider } from "@/types/database";

export interface UrgentNeed {
  id: string;
  service: string;
  location: string;
  created_at: string;
}

const TREND_EVENTS = ["provider_view", "phone_click", "message_click", "directions_click"];

/**
 * Providers ranked by REAL engagement (views + contact taps, last 14 days).
 * Never invents popularity: empty events, missing service key, or fewer than
 * two distinct providers with signal all yield [] and the section hides.
 */
export async function getTrendingProviders(limit = 6, days = 14): Promise<Provider[]> {
  try {
    const admin = supabaseAdmin();
    if (!admin) return [];
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await admin
      .from("events")
      .select("event,meta")
      .gte("created_at", since)
      .in("event", TREND_EVENTS)
      .limit(2000);
    if (error || !data) return [];
    const scores = tallyTrendScores(data as { event: string; meta?: { providerId?: unknown } | null }[]);
    if (scores.size < 2) return [];
    const approved = await getApprovedProviders({ limit: 60 });
    return approved
      .filter((p) => scores.has(p.id))
      .sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0))
      .slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Open customer requests, scrubbed for public display: service + location +
 * time only. Phone, description, and linkage ids are NEVER selected, so they
 * cannot leak even if rendering changes. Empty on any failure.
 */
export async function getUrgentNeeds(limit = 6): Promise<UrgentNeed[]> {
  try {
    const admin = supabaseAdmin();
    if (!admin) return [];
    const { data, error } = await admin
      .from("service_requests")
      .select("id,service,location,created_at")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return (data as UrgentNeed[]).map((r) => ({
      id: r.id,
      service: String(r.service ?? "").slice(0, 120),
      location: String(r.location ?? "").slice(0, 120),
      created_at: r.created_at,
    }));
  } catch {
    return [];
  }
}
