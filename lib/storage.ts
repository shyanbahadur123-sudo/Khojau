import type { SupabaseClient } from "@supabase/supabase-js";
import { extForType } from "@/lib/image-validation";

export const PROVIDER_IMAGES_BUCKET = "provider-images";

export type ImageKind = "logo" | "cover" | "gallery";

/** Storage path: <providerId>/<kind>-<timestamp>-<rand>.<ext> — ownership comes from the folder. */
export function providerImagePath(providerId: string, kind: ImageKind, mime: string): string {
  const rand = Math.random().toString(36).slice(2, 9);
  return `${providerId}/${kind}-${Date.now()}-${rand}.${extForType(mime)}`;
}

export function publicImageUrl(supabaseUrl: string, path: string): string {
  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${PROVIDER_IMAGES_BUCKET}/${path}`;
}

/** Extract the in-bucket path back from one of our public URLs (for deletes). Null when foreign. */
export function storagePathFromPublicUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${PROVIDER_IMAGES_BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  const path = url.slice(i + marker.length).split("?")[0];
  if (!path || path.includes("..")) return null;
  return path;
}

export async function uploadProviderImage(
  db: SupabaseClient,
  providerId: string,
  kind: ImageKind,
  file: File | Blob,
  mime: string
): Promise<{ path: string; publicUrl: string }> {
  const path = providerImagePath(providerId, kind, mime);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const { error } = await db.storage.from(PROVIDER_IMAGES_BUCKET).upload(path, file, {
    contentType: mime,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return { path, publicUrl: publicImageUrl(supabaseUrl, path) };
}

export async function deleteProviderImage(db: SupabaseClient, path: string): Promise<void> {
  const { error } = await db.storage.from(PROVIDER_IMAGES_BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}
