"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseBrowser, isSupabaseConfigured } from "@/lib/supabase";
import { CheckIcon } from "@/components/UiIcon";

interface ProviderOption {
  id: string;
  business_name: string;
  slug: string;
  city: string;
  services: { id: string; name: string }[];
}

function RequestForm() {
  const params = useSearchParams();
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [providerId, setProviderId] = useState(params.get("provider") ?? "");
  const [serviceId, setServiceId] = useState(params.get("service") ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    supabaseBrowser()
      .from("providers")
      .select("id,business_name,slug,city,services(id,name)")
      .eq("status", "approved")
      .order("business_name")
      .limit(200)
      .then(({ data }) => setProviders((data ?? []) as unknown as ProviderOption[]));
  }, []);

  // Resolve ?provider=<slug> to the provider id once the list loads.
  useEffect(() => {
    if (!providerId || providers.length === 0) return;
    if (providers.some((p) => p.id === providerId)) return;
    const match = providers.find((p) => p.slug === providerId);
    if (match) setProviderId(match.id);
    else setProviderId("");
  }, [providers, providerId]);

  const selected = providers.find((p) => p.id === providerId) ?? null;

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-xl pt-6">
        <h1 className="text-2xl font-bold">Request a service</h1>
        <p className="mt-2 text-sm">Service requests are not configured yet.</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl pt-6">
        <div className="rounded-2xl bg-[#FFFFFF] p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#111111]/10 text-[#111111]">
            <CheckIcon className="h-6 w-6" />
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight">Request received</h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            {selected ? `We shared your request with ${selected.business_name}. They will contact you on your phone.` : "The Khojau team will match you with providers and contact you on your phone."}
          </p>
          <a href="/" className="mt-4 inline-block rounded-lg bg-[#111111] px-5 py-3 font-semibold text-white">Back home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl pt-6">
      <h1 className="text-2xl font-bold">Request a service</h1>
      <p className="mt-1 text-sm text-[#6B7280]">Tell us what you need — {selected ? `${selected.business_name} will see it directly.` : "the Khojau team will manually match you with providers."}</p>
      <form
        className="mt-4 space-y-3 rounded-2xl bg-[#FFFFFF] p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setStatus("Sending…");
          setLoading(true);
          try {
            const f = new FormData(e.currentTarget as HTMLFormElement);
            const payload = { ...Object.fromEntries(f.entries()), provider_id: providerId || "", service_id: serviceId || "" };
            const res = await fetch("/api/service-requests", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body.error ?? "Could not submit.");
            setDone(true);
          } catch (err) {
            setStatus(err instanceof Error ? err.message : "Could not submit. Check your inputs.");
          } finally {
            setLoading(false);
          }
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="provider" className="text-sm font-semibold">Provider (optional)</label>
            <select id="provider" value={providerId} onChange={(e) => { setProviderId(e.target.value); setServiceId(""); }} className="mt-1 h-11 w-full rounded-lg border border-black/15 bg-white px-3">
              <option value="">Any provider — match me</option>
              {providers.map((p) => <option key={p.id} value={p.id}>{p.business_name} · {p.city}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="service_id" className="text-sm font-semibold">Specific service (optional)</label>
            <select id="service_id" value={serviceId} onChange={(e) => setServiceId(e.target.value)} disabled={!selected || selected.services.length === 0} className="mt-1 h-11 w-full rounded-lg border border-black/15 bg-white px-3 disabled:opacity-60">
              <option value="">{selected ? (selected.services.length === 0 ? "No listed services" : "General request") : "Pick a provider first"}</option>
              {(selected?.services ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <div><label htmlFor="service" className="text-sm font-semibold">Service needed *</label><input id="service" name="service" required maxLength={120} placeholder="e.g. Laptop repair" className="mt-1 h-11 w-full rounded-lg border border-black/15 px-3" /></div>
        <div><label htmlFor="location" className="text-sm font-semibold">Location *</label><input id="location" name="location" required maxLength={120} placeholder="e.g. Baneshwor, Kathmandu" className="mt-1 h-11 w-full rounded-lg border border-black/15 px-3" /></div>
        <div><label htmlFor="description" className="text-sm font-semibold">Description *</label><textarea id="description" name="description" required minLength={10} maxLength={2000} rows={4} placeholder="Laptop won't turn on…" className="mt-1 w-full rounded-lg border border-black/15 p-3" /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label htmlFor="preferred_time" className="text-sm font-semibold">Preferred time</label><input id="preferred_time" name="preferred_time" maxLength={120} placeholder="e.g. Tomorrow morning" className="mt-1 h-11 w-full rounded-lg border border-black/15 px-3" /></div>
          <div><label htmlFor="phone" className="text-sm font-semibold">Phone *</label><input id="phone" name="phone" required placeholder="98XXXXXXXX" className="mt-1 h-11 w-full rounded-lg border border-black/15 px-3" /></div>
        </div>
        <button disabled={loading} className="h-12 w-full rounded-lg bg-[#111111] font-semibold text-white disabled:opacity-60">
          {loading ? "Sending…" : "Submit request"}
        </button>
        {status && !done && <p role="status" className="text-sm text-[#6B7280]">{status}</p>}
      </form>
    </div>
  );
}

export default function RequestServicePage() {
  return (
    <Suspense>
      <RequestForm />
    </Suspense>
  );
}
