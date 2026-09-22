"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser, isSupabaseConfigured } from "@/lib/supabase";
import { providerSchema, slugify } from "@/lib/validation";
import { CATEGORIES } from "@/lib/categories";
import { LOCATIONS } from "@/lib/locations";

export default function AddBusinessPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inFlight = useRef(false);

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
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7A5C00]">Free basic listing</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Add your business</h1>
      <p className="mt-1 text-sm text-[#6B7280]">Submissions are reviewed before going public. It takes a few minutes.</p>
      <ol aria-label="How listing works" className="mt-4 grid gap-2 sm:grid-cols-3">
        {[
          ["1", "Submit", "Your business details"],
          ["2", "Review", "Usually a day or two"],
          ["3", "Go live", "Customers contact you"],
        ].map(([n, t, d]) => (
          <li key={n} className="flex items-center gap-3 rounded-xl border border-black/10 bg-[#FFFFFF] p-3">
            <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#C9A227]/15 text-sm font-bold text-[#7A5C00]">{n}</span>
            <span>
              <span className="block text-sm font-semibold leading-tight">{t}</span>
              <span className="block text-xs text-[#6B7280]">{d}</span>
            </span>
          </li>
        ))}
      </ol>
      <form
        className="mt-4 space-y-6 rounded-2xl border border-black/10 bg-[#FFFFFF] p-6 shadow-sm sm:p-8"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          // Ref guard: double submit would create duplicate listings.
          if (inFlight.current) return;
          inFlight.current = true;
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
            inFlight.current = false;
            setLoading(false);
          }
        }}
      >
        <fieldset>
          <legend className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6B7280]">The basics</legend>
          <div className="mt-3 space-y-3">
        <div>
          <label htmlFor="business_name" className="text-sm font-semibold">Business name *</label>
          <input id="business_name" name="business_name" required minLength={2} maxLength={120} placeholder="e.g. Sharma Electricals" className="mt-1 h-12 w-full rounded-lg border border-black/15 bg-transparent px-3 transition-colors focus:border-black/30" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="category_slug" className="text-sm font-semibold">Category *</label>
            <select id="category_slug" name="category_slug" required className="mt-1 h-12 w-full rounded-lg border border-black/15 bg-transparent px-3">
              {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="phone" className="text-sm font-semibold">Phone *</label>
            <input id="phone" name="phone" required placeholder="98XXXXXXXX" className="mt-1 h-12 w-full rounded-lg border border-black/15 bg-transparent px-3 transition-colors focus:border-black/30" />
          </div>
        </div>
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6B7280]">Location</legend>
          <div className="mt-3 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="city" className="text-sm font-semibold">City *</label>
            <input id="city" name="city" required list="cities" placeholder="e.g. Kathmandu" className="mt-1 h-12 w-full rounded-lg border border-black/15 bg-transparent px-3" />
            <datalist id="cities">{LOCATIONS.map((l) => <option key={l.slug} value={l.city} />)}</datalist>
          </div>
          <div>
            <label htmlFor="area" className="text-sm font-semibold">Area</label>
            <input id="area" name="area" placeholder="e.g. Baneshwor" className="mt-1 h-12 w-full rounded-lg border border-black/15 bg-transparent px-3 transition-colors focus:border-black/30" />
          </div>
        </div>
        <div>
          <label htmlFor="address" className="text-sm font-semibold">Street address</label>
          <input id="address" name="address" maxLength={200} placeholder="House no., street" className="mt-1 h-12 w-full rounded-lg border border-black/15 bg-transparent px-3 transition-colors focus:border-black/30" />
        </div>
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6B7280]">Description</legend>
          <div className="mt-3">
        <div>
          <label htmlFor="description" className="text-sm font-semibold">What do you offer? * <span className="font-normal text-[#6B7280]">(min 10 characters)</span></label>
          <textarea id="description" name="description" required minLength={10} maxLength={2000} rows={4} placeholder="Services, experience, working hours…" className="mt-1 w-full rounded-lg border border-black/15 bg-transparent p-3 transition-colors focus:border-black/30" />
        </div>
          </div>
        </fieldset>
        <details className="rounded-xl border border-black/10 bg-black/5 p-4 text-sm">
          <summary className="cursor-pointer font-semibold">Optional details — WhatsApp, links, prices</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input name="whatsapp" placeholder="WhatsApp number" aria-label="WhatsApp number" className="h-12 rounded-lg border border-black/15 bg-[#FFFFFF] px-3" />
            <input name="email" type="email" placeholder="Email" aria-label="Email" className="h-12 rounded-lg border border-black/15 bg-[#FFFFFF] px-3" />
            <input name="website" placeholder="Website https://…" aria-label="Website" className="h-12 rounded-lg border border-black/15 bg-[#FFFFFF] px-3" />
            <input name="facebook" placeholder="Facebook URL" aria-label="Facebook URL" className="h-12 rounded-lg border border-black/15 bg-[#FFFFFF] px-3" />
            <input name="instagram" placeholder="Instagram URL" aria-label="Instagram URL" className="h-12 rounded-lg border border-black/15 bg-[#FFFFFF] px-3" />
            <input name="price_min" type="number" min={0} placeholder="Price min Rs." aria-label="Minimum price" className="h-12 rounded-lg border border-black/15 bg-[#FFFFFF] px-3" />
            <input name="price_max" type="number" min={0} placeholder="Price max Rs." aria-label="Maximum price" className="h-12 rounded-lg border border-black/15 bg-[#FFFFFF] px-3" />
          </div>
        </details>
        {error && <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400">{error}</p>}
        <button disabled={loading} className="h-12 w-full rounded-lg bg-[#C9A227] font-semibold text-black transition-colors hover:bg-[#B8941F] disabled:opacity-60">
          {loading ? "Submitting…" : "Submit for review"}
        </button>
        <p className="text-center text-xs text-[#6B7280]">Track approval status in your <a href="/dashboard" className="underline underline-offset-2">dashboard</a>.</p>
      </form>
    </div>
  );
}
