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

export interface ProviderImage {
  id: string;
  url: string;
  caption: string | null;
  sort: number;
}

export interface ServiceItem {
  id: string;
  name: string;
  price_min: number | null;
  price_max: number | null;
}

export interface ProviderHourItem {
  weekday: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
}

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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
  provider_images?: ProviderImage[];
  services?: ServiceItem[];
  provider_hours?: ProviderHourItem[];
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

export type RequestStatus = "open" | "in_progress" | "completed" | "cancelled";

export interface ServiceRequestRow {
  id: string;
  service: string;
  location: string;
  description: string;
  preferred_time: string | null;
  phone: string;
  status: RequestStatus;
  provider_id: string | null;
  service_id: string | null;
  customer_id: string | null;
  created_at: string;
  providers?: { business_name: string; slug: string } | null;
}

export interface SavedProviderRow {
  provider_id: string;
  created_at: string;
}
