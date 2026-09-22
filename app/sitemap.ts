import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/categories";
import { LOCATIONS } from "@/lib/locations";
import { supabasePublic } from "@/lib/supabase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const staticRoutes = ["/", "/search", "/services", "/locations", "/add-business", "/contact", "/privacy", "/terms", "/request-service", "/how-it-works"];
  const db = supabasePublic();
  let providerUrls: MetadataRoute.Sitemap = [];
  if (db) {
    // Approved public listings only, bounded. Empty DB → no provider entries.
    const { data } = await db.from("providers").select("slug,updated_at").eq("status", "approved").order("updated_at", { ascending: false }).limit(1000);
    providerUrls = ((data ?? []) as { slug: string; updated_at: string }[]).map((p) => ({
      url: `${base}/provider/${p.slug}`,
      lastModified: new Date(p.updated_at),
    }));
  }
  return [
    ...staticRoutes.map((p) => ({ url: `${base}${p}`, lastModified: new Date() })),
    ...CATEGORIES.map((c) => ({ url: `${base}/services/${c.slug}`, lastModified: new Date() })),
    ...LOCATIONS.map((l) => ({ url: `${base}/locations/${l.slug}`, lastModified: new Date() })),
    ...providerUrls,
  ];
}
