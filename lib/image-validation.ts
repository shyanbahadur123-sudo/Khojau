// Pure client-side image validation. Dependency-free so it can be unit-tested
// in Node. Server-side, Storage RLS additionally enforces image MIME types.
//
// NOTE on spoofing: File.type/size come from the client and can be forged
// (rename x.exe → x.jpg). validateImageFile is a fast pre-check only —
// callers that upload must also verify magic bytes via validateImageBytes
// before sending anything to Storage.

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB — reasonable for Nepal mobile uploads
/** Leading bytes needed to sniff JPEG/PNG/WebP. */
export const IMAGE_MAGIC_BYTES = 12;

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

export type DetectedImageMime = "image/jpeg" | "image/png" | "image/webp";

/**
 * Sniff the true image type from leading magic bytes. Null when the bytes
 * match no known image format. Works on the first IMAGE_MAGIC_BYTES bytes.
 * - JPEG: FF D8 FF
 * - PNG:  89 50 4E 47 0D 0A 1A 0A
 * - WebP: "RIFF" xxxx "WEBP"
 */
export function detectImageMime(header: Uint8Array | readonly number[]): DetectedImageMime | null {
  const b = header;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (
    b.length >= 8 &&
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  )
    return "image/png";
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && // RIFF
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 // WEBP
  )
    return "image/webp";
  return null;
}

/**
 * Verify magic bytes agree with the claimed MIME type and the allowlist.
 * Returns an error message, or null when the content checks out. Catches
 * renamed executables/scripts (MZ, %PDF, <svg, GIF, BMP…) even when the
 * uploader claims image/jpeg.
 */
export function validateImageBytes(header: Uint8Array | readonly number[], claimedType: string): string | null {
  const detected = detectImageMime(header);
  if (!detected) {
    return "File contents are not a recognized JPG, PNG, or WebP image.";
  }
  if (detected !== claimedType) {
    const label = detected === "image/jpeg" ? "a JPEG" : detected === "image/png" ? "a PNG" : "a WebP";
    return `File contents look like ${label}, not the claimed type. Please re-export the image and try again.`;
  }
  return null;
}
