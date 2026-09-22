import { z } from "zod";

export const providerSchema = z.object({
  business_name: z.string().min(2).max(120),
  category_slug: z.string().min(2).max(60),
  phone: z.string().regex(/^(\+?977[- ]?)?9[678]\d{8}$/, "Enter a valid Nepal mobile number"),
  whatsapp: z.string().max(20).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  facebook: z.string().url().optional().or(z.literal("")),
  instagram: z.string().url().optional().or(z.literal("")),
  city: z.string().min(2).max(80),
  area: z.string().max(80).optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  description: z.string().min(10).max(2000),
  price_min: z.coerce.number().int().min(0).max(1000000).optional(),
  price_max: z.coerce.number().int().min(0).max(1000000).optional(),
});

export const searchParamsSchema = z.object({
  q: z.string().max(100).optional().default(""),
  service: z.string().max(100).optional().default(""),
  location: z.string().max(100).optional().default(""),
  category: z.string().max(60).optional().default(""),
  verified: z.string().optional().default(""),
  plan: z.string().optional().default(""),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  page: z.coerce.number().int().min(1).default(1),
});

export const reportSchema = z.object({
  provider_id: z.string().uuid(),
  reason: z.string().min(3).max(500),
  contact: z.string().max(50).optional().or(z.literal("")),
});

export const serviceItemSchema = z.object({
  name: z.string().min(2).max(80),
  price_min: z.coerce.number().int().min(0).max(1000000).optional(),
  price_max: z.coerce.number().int().min(0).max(1000000).optional(),
});

export const hoursItemSchema = z.object({
  weekday: z.coerce.number().int().min(0).max(6),
  open_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM").nullable(),
  close_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM").nullable(),
  is_closed: z.boolean(),
});

export const serviceRequestSchema = z.object({
  service: z.string().min(2).max(120),
  location: z.string().min(2).max(120),
  description: z.string().min(10).max(2000),
  preferred_time: z.string().max(120).optional().or(z.literal("")),
  phone: z.string().regex(/^(\+?977[- ]?)?9[678]\d{8}$/, "Enter a valid Nepal mobile number"),
  provider_id: z.string().uuid().optional().or(z.literal("")),
  service_id: z.string().uuid().optional().or(z.literal("")),
});

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}

/**
 * Allow only same-origin relative redirect targets ("/dashboard", "/search?...").
 * Rejects absolute URLs, protocol-relative URLs, backslashes, and control chars,
 * closing the open-redirect hole in `?next=` handling. Pure and unit-testable.
 */
export function safeRedirectPath(raw: string | null | undefined, fallback = "/dashboard"): string {
  if (!raw || raw.length > 200) return fallback;
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//")) return fallback;
  if (raw.includes("\\")) return fallback;
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1f\x7f]/.test(raw)) return fallback;
  try {
    const u = new URL(raw, "http://localhost");
    if (u.origin !== "http://localhost") return fallback;
    return u.pathname + u.search + u.hash;
  } catch {
    return fallback;
  }
}
