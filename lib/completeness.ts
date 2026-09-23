// Profile completeness: computed from ACTUAL listing fields, never invented.
// Each check is one honest capability (contactable, categorized, described,
// located, scheduled, illustrated, priced). Pure and unit-tested.
export interface CompletenessInput {
  business_name: string | null;
  phone: string | null;
  category_slug: string | null;
  description: string | null;
  city: string | null;
  area: string | null;
  has_hours: boolean;
  photo_count: number;
  service_count: number;
  has_whatsapp: boolean;
}

export interface CompletenessItem {
  label: string;
  done: boolean;
}

export function profileCompleteness(p: CompletenessInput): { percent: number; items: CompletenessItem[] } {
  const items: CompletenessItem[] = [
    { label: "Business name", done: Boolean(p.business_name && p.business_name.trim().length >= 2) },
    { label: "Phone number", done: Boolean(p.phone && p.phone.trim().length >= 5) },
    { label: "Category", done: Boolean(p.category_slug) },
    { label: "Description (10+ characters)", done: Boolean(p.description && p.description.trim().length >= 10) },
    { label: "City", done: Boolean(p.city && p.city.trim().length >= 2) },
    { label: "Opening hours", done: p.has_hours },
    { label: "At least one photo", done: p.photo_count > 0 },
    { label: "At least one service", done: p.service_count > 0 },
  ];
  const done = items.filter((i) => i.done).length;
  return { percent: Math.round((done / items.length) * 100), items };
}
