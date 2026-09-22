"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { providerSchema } from "@/lib/validation";
import { CATEGORIES } from "@/lib/categories";

export interface EditableProvider {
  id: string;
  business_name: string;
  category_slug: string | null;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  city: string;
  area: string | null;
  address: string | null;
  description: string | null;
  price_min: number | null;
  price_max: number | null;
}

export default function ProviderEditor({ provider }: { provider: EditableProvider }) {
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <form
      aria-label={`Edit ${provider.business_name}`}
      className="mt-3 space-y-3 rounded-xl border border-black/10 bg-white/60 p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setSaved(null);
        setLoading(true);
        try {
          const form = new FormData(e.currentTarget as HTMLFormElement);
          const raw = Object.fromEntries(form.entries());
          const parsed = providerSchema.safeParse(raw);
          if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? "Invalid input");
          const sb = supabaseBrowser();
          const { data: cat } = await sb.from("categories").select("id").eq("slug", parsed.data.category_slug).single();
          if (!cat) throw new Error("Unknown category");
          // Only editable columns are sent. status / verification_status /
          // plan are never included, and the DB trigger rejects any attempt.
          const { error: upErr } = await sb
            .from("providers")
            .update({
              business_name: parsed.data.business_name,
              category_id: (cat as { id: string }).id,
              phone: parsed.data.phone,
              whatsapp: parsed.data.whatsapp || null,
              email: parsed.data.email || null,
              website: parsed.data.website || null,
              facebook: parsed.data.facebook || null,
              instagram: parsed.data.instagram || null,
              city: parsed.data.city,
              area: parsed.data.area || null,
              address: parsed.data.address || null,
              description: parsed.data.description,
              price_min: parsed.data.price_min ?? null,
              price_max: parsed.data.price_max ?? null,
            })
            .eq("id", provider.id);
          if (upErr) throw new Error(upErr.message);
          setSaved("Saved. Changes are live on your listing.");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Save failed.");
        } finally {
          setLoading(false);
        }
      }}
    >
      <h3 className="text-sm font-bold">Business information</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-semibold" htmlFor={`bn-${provider.id}`}>Business name *</label>
          <input id={`bn-${provider.id}`} name="business_name" required minLength={2} maxLength={120} defaultValue={provider.business_name} className="mt-1 h-11 w-full rounded-lg border border-black/15 px-3" />
        </div>
        <div>
          <label className="text-sm font-semibold" htmlFor={`cat-${provider.id}`}>Category *</label>
          <select id={`cat-${provider.id}`} name="category_slug" defaultValue={provider.category_slug ?? "other"} className="mt-1 h-11 w-full rounded-lg border border-black/15 px-3">
            {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold" htmlFor={`ph-${provider.id}`}>Phone *</label>
          <input id={`ph-${provider.id}`} name="phone" required defaultValue={provider.phone} className="mt-1 h-11 w-full rounded-lg border border-black/15 px-3" />
        </div>
        <div>
          <label className="text-sm font-semibold" htmlFor={`wa-${provider.id}`}>WhatsApp</label>
          <input id={`wa-${provider.id}`} name="whatsapp" defaultValue={provider.whatsapp ?? ""} className="mt-1 h-11 w-full rounded-lg border border-black/15 px-3" />
        </div>
        <div>
          <label className="text-sm font-semibold" htmlFor={`city-${provider.id}`}>City *</label>
          <input id={`city-${provider.id}`} name="city" required defaultValue={provider.city} className="mt-1 h-11 w-full rounded-lg border border-black/15 px-3" />
        </div>
        <div>
          <label className="text-sm font-semibold" htmlFor={`area-${provider.id}`}>Area</label>
          <input id={`area-${provider.id}`} name="area" defaultValue={provider.area ?? ""} className="mt-1 h-11 w-full rounded-lg border border-black/15 px-3" />
        </div>
      </div>
      <div>
        <label className="text-sm font-semibold" htmlFor={`addr-${provider.id}`}>Street address</label>
        <input id={`addr-${provider.id}`} name="address" maxLength={200} defaultValue={provider.address ?? ""} className="mt-1 h-11 w-full rounded-lg border border-black/15 px-3" />
      </div>
      <div>
        <label className="text-sm font-semibold" htmlFor={`desc-${provider.id}`}>Description *</label>
        <textarea id={`desc-${provider.id}`} name="description" required minLength={10} maxLength={2000} rows={3} defaultValue={provider.description ?? ""} className="mt-1 w-full rounded-lg border border-black/15 p-3" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-semibold" htmlFor={`em-${provider.id}`}>Email</label>
          <input id={`em-${provider.id}`} name="email" type="email" defaultValue={provider.email ?? ""} className="mt-1 h-11 w-full rounded-lg border border-black/15 px-3" />
        </div>
        <div>
          <label className="text-sm font-semibold" htmlFor={`web-${provider.id}`}>Website</label>
          <input id={`web-${provider.id}`} name="website" defaultValue={provider.website ?? ""} placeholder="https://…" className="mt-1 h-11 w-full rounded-lg border border-black/15 px-3" />
        </div>
        <div>
          <label className="text-sm font-semibold" htmlFor={`fb-${provider.id}`}>Facebook</label>
          <input id={`fb-${provider.id}`} name="facebook" defaultValue={provider.facebook ?? ""} className="mt-1 h-11 w-full rounded-lg border border-black/15 px-3" />
        </div>
        <div>
          <label className="text-sm font-semibold" htmlFor={`ig-${provider.id}`}>Instagram</label>
          <input id={`ig-${provider.id}`} name="instagram" defaultValue={provider.instagram ?? ""} className="mt-1 h-11 w-full rounded-lg border border-black/15 px-3" />
        </div>
        <div>
          <label className="text-sm font-semibold" htmlFor={`pmin-${provider.id}`}>Price min (Rs.)</label>
          <input id={`pmin-${provider.id}`} name="price_min" type="number" min={0} defaultValue={provider.price_min ?? ""} className="mt-1 h-11 w-full rounded-lg border border-black/15 px-3" />
        </div>
        <div>
          <label className="text-sm font-semibold" htmlFor={`pmax-${provider.id}`}>Price max (Rs.)</label>
          <input id={`pmax-${provider.id}`} name="price_max" type="number" min={0} defaultValue={provider.price_max ?? ""} className="mt-1 h-11 w-full rounded-lg border border-black/15 px-3" />
        </div>
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {saved && <p role="status" className="text-sm font-medium text-[#111111]">{saved}</p>}
      <button disabled={loading} className="h-11 rounded-lg bg-[#111111] px-5 font-semibold text-white disabled:opacity-60">
        {loading ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
