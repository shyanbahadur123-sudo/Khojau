import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/categories";
import { LOCATIONS } from "@/lib/locations";

// Provider URLs refresh hourly; static routes are timeless.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  // /recent and /provider/* are members-only (login gate) — never list them
  // for crawlers. Search / Services / Locations browsing stays public.
  const staticRoutes = ["/", "/search", "/services", "/locations", "/add-business", "/contact", "/privacy", "/terms", "/request-service", "/how-it-works"];
  const providerUrls: MetadataRoute.Sitemap = [];
  return [
    ...staticRoutes.map((p) => ({ url: `${base}${p}`, lastModified: new Date() })),
    ...CATEGORIES.map((c) => ({ url: `${base}/services/${c.slug}`, lastModified: new Date() })),
    ...LOCATIONS.map((l) => ({ url: `${base}/locations/${l.slug}`, lastModified: new Date() })),
    ...providerUrls,
  ];
}
