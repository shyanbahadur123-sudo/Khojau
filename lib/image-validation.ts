// Pure client-side image validation. Dependency-free so it can be unit-tested
// in Node. Server-side, Storage RLS additionally enforces image MIME types.

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB — reasonable for Nepal mobile uploads

export interface PickedFile {
  name: string;
  type: string;
  size: number;
}

/** Returns an error message, or null when the file is acceptable. */
export function validateImageFile(file: PickedFile): string | null {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return "Only JPG, PNG, or WebP images are allowed.";
  }
  if (file.size <= 0) {
    return "This file appears to be empty.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return `Image is ${mb} MB — the limit is 2 MB. Please compress it and try again.`;
  }
  return null;
}

export function extForType(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}
