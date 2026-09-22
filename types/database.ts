export type ProviderStatus = "pending" | "approved" | "rejected" | "suspended";
export type VerificationStatus = "unverified" | "pending" | "verified";
export type PlanId = "free" | "featured" | "premium";

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string | null;
}

export interface Provider {
  id: string;
  owner_id: string | null;
  business_name: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  city: string;
  area: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  price_min: number | null;
  price_max: number | null;
  status: ProviderStatus;
  verification_status: VerificationStatus;
  plan: PlanId;
  logo_url: string | null;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
  categories?: Pick<Category, "name" | "slug"> | null;
}

export interface ProviderHour {
  id: string;
  provider_id: string;
  weekday: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
}

export interface ServiceRequest {
  service: string;
  location: string;
  description: string;
  preferred_time: string | null;
  phone: string;
}
