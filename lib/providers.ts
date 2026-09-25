import { supabasePublic } from "@/lib/supabase";
import type { Provider } from "@/types/database";

// Intentionally public columns only. NEVER expose owner_id, status,
// created_at/updated_at, or anything moderation-internal to browsers.
const PUBLIC_COLUMNS =
  "id,business_name,slug,description,category_id,phone,whatsapp,email,website,facebook,instagram,city,area,address,latitude,longitude,price_min,price_max,verification_status,plan,logo_url,cover_image_url,categories(name,slug)";

const MAX_ROWS = 60;

function cleanLike(input: string): string {
  // Strip LIKE wildcards AND PostgREST `or()` syntax characters (`,` `(` `)`
  // `;` `\`) so user input cannot reshape the filter expression. The query
  // stays ANDed to status='approved' regardless.
  return input.replace(/[%_,;()\\]/g, "").trim().slice(0, 100);
}

export type ProvidersResult = { providers: Provider[]; error: boolean };

// Error-aware variant: list pages need to distinguish "database failed"
// from "genuinely no providers" so the UI doesn't lie with an empty state.
export async function getApprovedProvidersResult(opts: {
  search?: string;
  categorySlug?: string;
  location?: string;
  limit?: number;
}): Promise<ProvidersResult> {
  const db = supabasePublic();
  if (!db) return { providers: [], error: true };
  try {
    return { providers: await getApprovedProviders(opts), error: false };
  } catch {
    return { providers: [], error: true };
  }
}

export async function getApprovedProviders(opts: {
  search?: string;
  categorySlug?: string;
  location?: string;
  limit?: number;
}): Promise<Provider[]> {
  const db = supabasePublic();
  if (!db) return [];
  const limit = Math.min(opts.limit ?? MAX_ROWS, MAX_ROWS);
  const byId = new Map<string, Provider>();

  let categoryId: string | null = null;
  if (opts.categorySlug) {
    const { data: cat } = await db.from("categories").select("id").eq("slug", opts.categorySlug).single();
    if (!cat) return [];
    categoryId = (cat as { id: string }).id;
  }

  const loc = cleanLike(opts.location ?? "");
  const q = opts.search?.trim().slice(0, 100) ?? "";

  const baseSelect = () => {
    let query = db.from("providers").select(PUBLIC_COLUMNS).eq("status", "approved").limit(limit);
    if (categoryId) query = query.eq("category_id", categoryId);
    if (loc) query = query.or(`city.ilike.%${loc}%,area.ilike.%${loc}%`);
    return query;
  };

  if (q) {
    // Full-text first (uses providers_search_tsv_idx). websearch type safely
    // handles quotes, dashes, and other user input server-side.
    const { data, error } = await baseSelect()
      .textSearch("search_tsv", q, { type: "websearch", config: "english" })
      .order("updated_at", { ascending: false });
    if (!error) {
      for (const p of (data ?? []) as unknown as Provider[]) byId.set(p.id, p);
    }
    // Service-name matches: bounded lookup, then approved-only provider fetch.
    const svcQ = cleanLike(q);
    if (svcQ) {
      const { data: svcRows } = await db.from("services").select("provider_id").ilike("name", `%${svcQ}%`).limit(20);
      const seen: Record<string, true> = {};
      const ids: string[] = [];
      ((svcRows ?? []) as { provider_id: string }[]).forEach((r) => {
        if (!seen[r.provider_id]) {
          seen[r.provider_id] = true;
          ids.push(r.provider_id);
        }
      });
      if (ids.length > 0) {
        let extra = db.from("providers").select(PUBLIC_COLUMNS).eq("status", "approved").in("id", ids).limit(20);
        if (categoryId) extra = extra.eq("category_id", categoryId);
        const { data: extraRows } = await extra;
        for (const p of (extraRows ?? []) as unknown as Provider[]) {
          if (!byId.has(p.id)) byId.set(p.id, p);
        }
      }
    }
  } else {
    const { data, error } = await baseSelect().order("updated_at", { ascending: false });
    if (error) throw error;
    for (const p of (data ?? []) as unknown as Provider[]) byId.set(p.id, p);
  }

  const out: Provider[] = [];
  byId.forEach((p) => {
    out.push(p);
  });
  return out.slice(0, limit);
}

export async function getProviderBySlug(slug: string): Promise<Provider | null> {
  const db = supabasePublic();
  if (!db) return null;
  const { data, error } = await db
    .from("providers")
    .select(`${PUBLIC_COLUMNS},provider_images(id,url,caption,sort),services(id,name,price_min,price_max),provider_hours(weekday,open_time,close_time,is_closed)`)
    .eq("slug", slug)
    .eq("status", "approved")
    .order("sort", { referencedTable: "provider_images", ascending: true })
    .order("weekday", { referencedTable: "provider_hours", ascending: true })
    .single();
  if (error) return null;
  return data as unknown as Provider;
}
