"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser, isSupabaseConfigured } from "@/lib/supabase";
import { providerSchema, slugify } from "@/lib/validation";
import { CATEGORIES } from "@/lib/categories";
import { LOCATIONS } from "@/lib/locations";

export default function AddBusinessPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isSupabaseConfigured()) {
    return (
      <div className="pt-6">
        <h1 className="text-2xl font-bold">Add your business</h1>
        <p className="mt-2 text-sm">Supabase is not configured yet. Add credentials to <code>.env.local</code> first.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl pt-6">
      <h1 className="text-2xl font-bold">Add your business</h1>
      <p className="mt-1 text-sm text-[#66706E]">Free basic listing. Submissions are reviewed before going public.</p>
      <div className="mt-3 rounded-xl border border-[#0B7168]/25 bg-[#0B7168]/5 p-4 text-sm">
        <p className="font-semibold">What happens next?</p>
        <ol className="mt-1 list-decimal space-y-1 pl-5 text-[#17201F]/85">
          <li>You submit your business details below.</li>
          <li>Our team reviews the listing (usually within a day or two).</li>
          <li>Once approved, customers can find and contact you. Track status in your dashboard.</li>
        </ol>
      </div>
      <form
        className="mt-4 space-y-3 rounded-2xl bg-[#FFFDF8] p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setLoading(true);
          try {
            const form = new FormData(e.currentTarget as HTMLFormElement);
            const raw = Object.fromEntries(form.entries());
            const parsed = providerSchema.safeParse(raw);
            if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? "Invalid input");
            const sb = supabaseBrowser();
            const { data: { user } } = await sb.auth.getUser();
            if (!user) { router.push("/login"); return; }
            const { data: cat } = await sb.from("categories").select("id").eq("slug", parsed.data.category_slug).single();
            if (!cat) throw new Error("Unknown category");
            const base = slugify(parsed.data.business_name);
            const slug = `${base}-${Math.random().toString(36).slice(2, 7)}`;
            const { error: ins } = await sb.from("providers").insert({
              owner_id: user.id,
              business_name: parsed.data.business_name,
              slug,
              description: parsed.data.description,
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
              price_min: parsed.data.price_min ?? null,
              price_max: parsed.data.price_max ?? null,
              status: "pending",
              verification_status: "unverified",
              plan: "free",
            });
            if (ins) throw new Error(ins.message);
            router.push("/dashboard");
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Submission failed";
            // The slug has a UNIQUE constraint as the final safety net. A
            // collision surfaces as a raw constraint message, so translate it
            // instead of leaking database internals to the user.
            if (/duplicate key|unique constraint|already exists/i.test(msg)) {
              setError("A business with a very similar name was just listed. Please tweak the name and try again.");
            } else {
              setError(msg);
            }
          } finally {
            setLoading(false);
          }
        }}
      >
        <div>
          <label htmlFor="business_name" className="text-sm font-semibold">Business name *</label>
          <input id="business_name" name="business_name" required minLength={2} maxLength={120} className="mt-1 h-11 w-full rounded-lg border border-black/15 px-3" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="category_slug" className="text-sm font-semibold">Category *</label>
            <select id="category_slug" name="category_slug" required className="mt-1 h-11 w-full rounded-lg border border-black/15 px-3">
              {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="phone" className="text-sm font-semibold">Phone *</label>
            <input id="phone" name="phone" required placeholder="98XXXXXXXX" className="mt-1 h-11 w-full rounded-lg border border-black/15 px-3" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="city" className="text-sm font-semibold">City *</label>
            <input id="city" name="city" required list="cities" className="mt-1 h-11 w-full rounded-lg border border-black/15 px-3" />
            <datalist id="cities">{LOCATIONS.map((l) => <option key={l.slug} value={l.city} />)}</datalist>
          </div>
          <div>
            <label htmlFor="area" className="text-sm font-semibold">Area</label>
            <input id="area" name="area" placeholder="e.g. Baneshwor" className="mt-1 h-11 w-full rounded-lg border border-black/15 px-3" />
          </div>
        </div>
        <div>
          <label htmlFor="address" className="text-sm font-semibold">Street address</label>
          <input id="address" name="address" maxLength={200} className="mt-1 h-11 w-full rounded-lg border border-black/15 px-3" />
        </div>
        <div>
          <label htmlFor="description" className="text-sm font-semibold">Description * (min 10 chars)</label>
          <textarea id="description" name="description" required minLength={10} maxLength={2000} rows={4} className="mt-1 w-full rounded-lg border border-black/15 p-3" />
        </div>
        <details className="rounded-lg border border-black/10 p-3 text-sm">
          <summary className="cursor-pointer font-semibold">Optional details</summary>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <input name="whatsapp" placeholder="WhatsApp number" className="h-11 rounded-lg border border-black/15 px-3" />
            <input name="email" type="email" placeholder="Email" className="h-11 rounded-lg border border-black/15 px-3" />
            <input name="website" placeholder="Website https://…" className="h-11 rounded-lg border border-black/15 px-3" />
            <input name="facebook" placeholder="Facebook URL" className="h-11 rounded-lg border border-black/15 px-3" />
            <input name="instagram" placeholder="Instagram URL" className="h-11 rounded-lg border border-black/15 px-3" />
            <input name="price_min" type="number" min={0} placeholder="Price min Rs." className="h-11 rounded-lg border border-black/15 px-3" />
            <input name="price_max" type="number" min={0} placeholder="Price max Rs." className="h-11 rounded-lg border border-black/15 px-3" />
          </div>
        </details>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button disabled={loading} className="h-12 w-full rounded-lg bg-[#0B7168] font-semibold text-white disabled:opacity-60">
          {loading ? "Submitting…" : "Submit for review"}
        </button>
      </form>
    </div>
  );
}
