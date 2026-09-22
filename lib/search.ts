import type { Provider } from "@/types/database";

// Ranking: text relevance → location relevance → verified → completeness → featured.
// Featured/premium boost visibility but never fully override relevance.
export function rankProviders(providers: Provider[], query: string, location: string): Provider[] {
  const q = query.trim().toLowerCase();
  const loc = location.trim().toLowerCase();
  const scored = providers.map((p) => {
    let score = 0;
    const hay = `${p.business_name} ${p.description ?? ""} ${p.categories?.name ?? ""}`.toLowerCase();
    if (q) {
      if (p.business_name.toLowerCase().includes(q)) score += 50;
      else if ((p.categories?.name ?? "").toLowerCase().includes(q)) score += 35;
      else if (hay.includes(q)) score += 20;
      else {
        const terms = q.split(/\s+/);
        for (const t of terms) if (t.length > 2 && hay.includes(t)) score += 6;
      }
    } else {
      score += 10;
    }
    const place = `${p.city} ${p.area ?? ""}`.toLowerCase();
    if (loc) {
      if (place.includes(loc)) score += 30;
    }
    if (p.verification_status === "verified") score += 15;
    if (p.plan === "premium") score += 8;
    else if (p.plan === "featured") score += 5;
    let completeness = 0;
    if (p.description && p.description.length > 40) completeness += 2;
    if (p.logo_url || p.cover_image_url) completeness += 2;
    if (p.website) completeness += 1;
    if (p.price_min != null) completeness += 1;
    score += Math.min(completeness, 6);
    return { p, score };
  });
  return scored.sort((a, b) => b.score - a.score).map((s) => s.p);
}

export function filterProviders(
  providers: Provider[],
  opts: { verifiedOnly?: boolean; plan?: string; minPrice?: number; maxPrice?: number }
): Provider[] {
  return providers.filter((p) => {
    if (opts.verifiedOnly && p.verification_status !== "verified") return false;
    if (opts.plan && p.plan !== opts.plan) return false;
    if (opts.minPrice != null && (p.price_max ?? Infinity) < opts.minPrice) return false;
    if (opts.maxPrice != null && (p.price_min ?? 0) > opts.maxPrice) return false;
    return true;
  });
}

export function directionsUrl(p: Pick<Provider, "latitude" | "longitude" | "address" | "city">) {
  if (p.latitude != null && p.longitude != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`;
  }
  const q = encodeURIComponent(`${p.address ?? ""} ${p.city}`.trim());
  return `https://www.google.com/maps/dir/?api=1&destination=${q}`;
}

export function whatsappUrl(phone: string | null, text = "Hello! I found you on Khojau.") {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export interface TrendEvent {
  event: string;
  meta?: { providerId?: unknown } | null;
}

// Weight real engagement for "trending" ranking: passive views count less
// than contact taps. Pure and unit-tested; callers decide display thresholds
// so a handful of views never masquerades as a crowd.
const TREND_WEIGHTS: Record<string, number> = {
  provider_view: 1,
  phone_click: 3,
  message_click: 3,
  directions_click: 3,
};

export function tallyTrendScores(rows: TrendEvent[]): Map<string, number> {
  const scores = new Map<string, number>();
  for (const r of rows ?? []) {
    const w = TREND_WEIGHTS[r.event];
    const id = typeof r.meta?.providerId === "string" ? r.meta.providerId : "";
    if (!w || !id || id.length > 100) continue;
    scores.set(id, (scores.get(id) ?? 0) + w);
  }
  return scores;
}
