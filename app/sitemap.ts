import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/categories";
import { LOCATIONS } from "@/lib/locations";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const staticRoutes = ["/", "/search", "/services", "/locations", "/add-business", "/contact", "/privacy", "/terms", "/request-service", "/how-it-works"];
  return [
    ...staticRoutes.map((p) => ({ url: `${base}${p}`, lastModified: new Date() })),
    ...CATEGORIES.map((c) => ({ url: `${base}/services/${c.slug}`, lastModified: new Date() })),
    ...LOCATIONS.map((l) => ({ url: `${base}/locations/${l.slug}`, lastModified: new Date() })),
  ];
}
