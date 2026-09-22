import { supabasePublic } from "@/lib/supabase";
import type { Provider } from "@/types/database";

export async function getApprovedProviders(opts: {
  search?: string;
  categorySlug?: string;
  limit?: number;
}): Promise<Provider[]> {
  const db = supabasePublic();
  if (!db) return [];
  let query = db
    .from("providers")
    .select("*, categories(name,slug)")
    .eq("status", "approved")
    .order("plan", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(opts.limit ?? 50);
  if (opts.categorySlug) {
    const { data: cat } = await db.from("categories").select("id").eq("slug", opts.categorySlug).single();
    if (!cat) return [];
    query = query.eq("category_id", (cat as { id: string }).id);
  }
  if (opts.search) {
    const s = opts.search.trim();
    if (s) query = query.or(`business_name.ilike.%${s}%,city.ilike.%${s}%,area.ilike.%${s}%,description.ilike.%${s}%`);
  }
  const { data, error } = await query;
  if (error) {
    console.error("Supabase providers error:", error.message);
    return [];
  }
  return (data ?? []) as unknown as Provider[];
}

export async function getProviderBySlug(slug: string): Promise<Provider | null> {
  const db = supabasePublic();
  if (!db) return null;
  const { data, error } = await db
    .from("providers")
    .select("*, categories(name,slug)")
    .eq("slug", slug)
    .eq("status", "approved")
    .single();
  if (error) return null;
  return data as unknown as Provider;
}
