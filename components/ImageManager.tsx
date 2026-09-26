"use client";

import { useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { validateImageFile, validateImageBytes, IMAGE_MAGIC_BYTES } from "@/lib/image-validation";
import {
  deleteProviderImage,
  sizedImageUrl,
  storagePathFromPublicUrl,
  uploadProviderImage,
  type ImageKind,
} from "@/lib/storage";
import type { ProviderImage } from "@/types/database";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface Props {
  providerId: string;
  businessName: string;
  status: string;
  initialLogo: string | null;
  initialCover: string | null;
  initialImages: ProviderImage[];
}

export default function ImageManager({ providerId, businessName, status, initialLogo, initialCover, initialImages }: Props) {
  const [logo, setLogo] = useState(initialLogo);
  const [cover, setCover] = useState(initialCover);
  const [images, setImages] = useState<ProviderImage[]>([...initialImages].sort((a, b) => a.sort - b.sort));
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ProviderImage | null>(null);
  const inFlight = useRef(false);

  // Magic-byte check: File.type is client-claimed and forgeable, so read the
  // leading bytes and confirm they match the claimed image format before any
  // upload. Returns an error message, or null when content checks out.
  async function checkImageContent(file: File): Promise<string | null> {
    try {
      const buf = await file.slice(0, IMAGE_MAGIC_BYTES).arrayBuffer();
      return validateImageBytes(new Uint8Array(buf), file.type);
    } catch {
      return "Could not read this file. Please try a different image.";
    }
  }

  async function uploadSingle(kind: "logo" | "cover", file: File) {
    if (inFlight.current) return;
    const problem = validateImageFile(file);
    if (problem) {
      setError(problem);
      return;
    }
    const spoofed = await checkImageContent(file);
    if (spoofed) {
      setError(spoofed);
      return;
    }
    setError(null);
    setBusy(kind);
    inFlight.current = true;
    try {
      const sb = supabaseBrowser();
      const { publicUrl } = await uploadProviderImage(sb, providerId, kind, file, file.type);
      const column = kind === "logo" ? "logo_url" : "cover_image_url";
      const old = kind === "logo" ? logo : cover;
      const { error: upErr } = await sb.from("providers").update({ [column]: publicUrl }).eq("id", providerId);
      if (upErr) throw new Error(upErr.message);
      if (kind === "logo") setLogo(publicUrl);
      else setCover(publicUrl);
      // Replace: remove the old object after the new one is referenced.
      const oldPath = old ? storagePathFromPublicUrl(old) : null;
      if (oldPath) {
        try {
          await deleteProviderImage(sb, oldPath);
        } catch {
          // Old file already gone or foreign — new image is live, so don't fail.
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      inFlight.current = false;
      setBusy(null);
    }
  }

  async function uploadGallery(files: FileList | null) {
    if (!files || files.length === 0 || inFlight.current) return;
    setError(null);
    setBusy("gallery");
    inFlight.current = true;
    try {
      const sb = supabaseBrowser();
      let nextSort = images.length === 0 ? 0 : Math.max(...images.map((i) => i.sort)) + 1;
      const added: ProviderImage[] = [];
      for (const file of Array.from(files)) {
        const problem = validateImageFile(file);
        if (problem) throw new Error(`${file.name}: ${problem}`);
        const spoofed = await checkImageContent(file);
        if (spoofed) throw new Error(`${file.name}: ${spoofed}`);
        const { publicUrl } = await uploadProviderImage(sb, providerId, "gallery", file, file.type);
        const { data, error: insErr } = await sb
          .from("provider_images")
          .insert({ provider_id: providerId, url: publicUrl, sort: nextSort })
          .select("id,url,caption,sort")
          .single();
        if (insErr) {
          // Don't orphan the file if metadata fails.
          await deleteProviderImage(sb, storagePathFromPublicUrl(publicUrl) ?? "");
          throw new Error(insErr.message);
        }
        added.push(data as ProviderImage);
        nextSort += 1;
      }
      setImages((prev) => [...prev, ...added].sort((a, b) => a.sort - b.sort));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gallery upload failed.");
    } finally {
      inFlight.current = false;
      setBusy(null);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteConfirm || inFlight.current) return;
    const image = deleteConfirm;
    setDeleteConfirm(null);
    setError(null);
    setBusy(`del-${image.id}`);
    inFlight.current = true;
    try {
      const sb = supabaseBrowser();
      const path = storagePathFromPublicUrl(image.url);
      const { error: rowErr } = await sb.from("provider_images").delete().eq("id", image.id);
      if (rowErr) throw new Error(rowErr.message);
      if (path) await deleteProviderImage(sb, path);
      setImages((prev) => prev.filter((i) => i.id !== image.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      inFlight.current = false;
      setBusy(null);
    }
  }

  async function moveGallery(id: string, dir: -1 | 1) {
    if (inFlight.current) return;
    const ordered = [...images].sort((a, b) => a.sort - b.sort);
    const idx = ordered.findIndex((i) => i.id === id);
    const other = ordered[idx + dir];
    if (!other) return;
    setError(null);
    setBusy(`move-${id}`);
    inFlight.current = true;
    try {
      const sb = supabaseBrowser();
      const a = ordered[idx];
      // Swap sort values; unique sorts aren't enforced so a transient tie is fine.
      const { error: e1 } = await sb.from("provider_images").update({ sort: other.sort }).eq("id", a.id);
      if (e1) throw new Error(e1.message);
      const { error: e2 } = await sb.from("provider_images").update({ sort: a.sort }).eq("id", other.id);
      if (e2) throw new Error(e2.message);
      setImages((prev) =>
        prev
          .map((i) => (i.id === a.id ? { ...i, sort: other.sort } : i.id === other.id ? { ...i, sort: a.sort } : i))
          .sort((x, y) => x.sort - y.sort)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reorder failed.");
    } finally {
      inFlight.current = false;
      setBusy(null);
    }
  }

  async function saveCaption(id: string, caption: string) {
    if (inFlight.current) return;
    setError(null);
    setBusy(`cap-${id}`);
    inFlight.current = true;
    try {
      const sb = supabaseBrowser();
      const { error } = await sb.from("provider_images").update({ caption: caption || null }).eq("id", id);
      if (error) throw new Error(error.message);
      setImages((prev) => prev.map((i) => (i.id === id ? { ...i, caption } : i)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Caption save failed.");
    } finally {
      inFlight.current = false;
      setBusy(null);
    }
  }

  const disabled = busy !== null;
  // Storage RLS only permits uploads while the listing is approved; the
  // notice below explains this before the server rejects anything.
  const canUpload = status === "approved";

  return (
    <section aria-label={`Photos for ${businessName}`} className="mt-3 rounded-xl border border-black/10 bg-white/60 p-4">
      <h4 className="text-sm font-bold">Photos — visible publicly once the listing is approved</h4>
      {!canUpload && (
        <p className="mt-2 text-sm text-[#6B7280]">
          Photos can be added after this listing is approved. Current status: <strong>{status}</strong>.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {(["logo", "cover"] as const).map((kind) => {
          const current = kind === "logo" ? logo : cover;
          return (
            <div key={kind}>
              <p className="text-sm font-semibold capitalize">{kind}</p>
              {current ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={sizedImageUrl(current, 400)} alt={`${businessName} ${kind}`} className="mt-1 h-24 w-full rounded-lg border object-cover" loading="lazy" />
              ) : (
                <p className="mt-1 rounded-lg border border-dashed p-4 text-xs text-[#6B7280]">No {kind} yet.</p>
              )}
              <label className="mt-2 inline-block min-h-[44px] cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-[#111111]">
                {busy === kind ? "Uploading…" : current ? `Replace ${kind}` : `Upload ${kind}`}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  aria-label={`Upload ${kind} image`}
                  className="sr-only"
                  disabled={disabled || !canUpload}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) void uploadSingle(kind, f);
                  }}
                />
              </label>
            </div>
          );
        })}
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Gallery ({images.length})</p>
          <label className="min-h-[44px] cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-[#111111]">
            {busy === "gallery" ? "Uploading…" : "Add photos"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              aria-label="Upload gallery photos"
              className="sr-only"
              disabled={disabled || !canUpload}
              onChange={(e) => {
                const fs = e.target.files;
                e.target.value = "";
                void uploadGallery(fs);
              }}
            />
          </label>
        </div>
        {images.length === 0 ? (
          <p className="mt-2 text-xs text-[#6B7280]">No gallery photos yet. JPG, PNG, or WebP up to 2 MB each.</p>
        ) : (
          <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((img, i) => (
              <li key={img.id} className="rounded-lg border p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sizedImageUrl(img.url, 400)} alt={img.caption || `${businessName} photo ${i + 1}`} className="h-24 w-full rounded object-cover" loading="lazy" />
                <input
                  aria-label={`Caption for photo ${i + 1}`}
                  defaultValue={img.caption ?? ""}
                  placeholder="Caption (optional)"
                  className="mt-1 min-h-[44px] w-full rounded border border-black/15 px-2 py-1 text-xs"
                  onBlur={(e) => {
                    if (e.target.value !== (img.caption ?? "")) void saveCaption(img.id, e.target.value);
                  }}
                />
                <div className="mt-1 flex gap-2 text-xs">
                  <button disabled={disabled || i === 0} onClick={() => void moveGallery(img.id, -1)} className="min-h-[44px] rounded border px-3 py-1 disabled:opacity-40" aria-label={`Move photo ${i + 1} earlier`}>←</button>
                  <button disabled={disabled || i === images.length - 1} onClick={() => void moveGallery(img.id, 1)} className="min-h-[44px] rounded border px-3 py-1 disabled:opacity-40" aria-label={`Move photo ${i + 1} later`}>→</button>
                  <button disabled={disabled} onClick={() => setDeleteConfirm(img)} className="ml-auto min-h-[44px] rounded border border-red-300 px-3 py-1 text-red-700" aria-label={`Delete photo ${i + 1}`}>
                    {busy === `del-${img.id}` ? "…" : "Delete"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => void handleDeleteConfirm()}
        title="Delete photo"
        message={`Delete this photo from ${businessName}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        pending={busy?.startsWith("del-")}
        disabled={disabled}
      />
    </section>
  );
}
