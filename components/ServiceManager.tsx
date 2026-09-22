"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { serviceItemSchema } from "@/lib/validation";
import type { ServiceItem } from "@/types/database";

export default function ServiceManager({ providerId, initial }: { providerId: string; initial: ServiceItem[] }) {
  const [items, setItems] = useState<ServiceItem[]>(initial);
  const [name, setName] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [editing, setEditing] = useState<ServiceItem | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  async function add() {
    const parsed = serviceItemSchema.safeParse({ name, price_min: min === "" ? undefined : min, price_max: max === "" ? undefined : max });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Invalid service.");
      return;
    }
    setError(null);
    setSaved(null);
    setBusy("add");
    try {
      const sb = supabaseBrowser();
      const { data, error: insErr } = await sb
        .from("services")
        .insert({
          provider_id: providerId, // authorized server-side via providers.owner_id
          name: parsed.data.name,
          price_min: parsed.data.price_min ?? null,
          price_max: parsed.data.price_max ?? null,
        })
        .select("id,name,price_min,price_max")
        .single();
      if (insErr) throw new Error(insErr.message);
      setItems((prev) => [...prev, data as ServiceItem]);
      setName("");
      setMin("");
      setMax("");
      setSaved("Service added.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Add failed.");
    } finally {
      setBusy(null);
    }
  }

  async function saveEdit() {
    if (!editing) return;
    const parsed = serviceItemSchema.safeParse({ name: editing.name, price_min: editing.price_min ?? undefined, price_max: editing.price_max ?? undefined });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Invalid service.");
      return;
    }
    setError(null);
    setSaved(null);
    setBusy(`edit-${editing.id}`);
    try {
      const sb = supabaseBrowser();
      const { error: upErr } = await sb
        .from("services")
        .update({ name: parsed.data.name, price_min: parsed.data.price_min ?? null, price_max: parsed.data.price_max ?? null })
        .eq("id", editing.id);
      if (upErr) throw new Error(upErr.message);
      setItems((prev) => prev.map((i) => (i.id === editing.id ? { ...i, name: parsed.data.name, price_min: parsed.data.price_min ?? null, price_max: parsed.data.price_max ?? null } : i)));
      setEditing(null);
      setSaved("Service updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string, label: string) {
    if (!confirm(`Delete service "${label}"?`)) return;
    setError(null);
    setSaved(null);
    setBusy(`del-${id}`);
    try {
      const sb = supabaseBrowser();
      const { error: delErr } = await sb.from("services").delete().eq("id", id);
      if (delErr) throw new Error(delErr.message);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setSaved("Service deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusy(null);
    }
  }

  const disabled = busy !== null;

  return (
    <section aria-label="Manage services" className="mt-3 rounded-xl border border-black/10 bg-white/60 p-4">
      <h3 className="text-sm font-bold">Services</h3>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
      {saved && <p role="status" className="mt-2 text-sm font-medium text-[#0B7168]">{saved}</p>}
      {items.length === 0 ? (
        <p className="mt-2 text-xs text-[#66706E]">No services yet. Add what you offer with typical prices.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {items.map((s) => (
            <li key={s.id} className="rounded-lg border border-black/10 p-2 text-sm">
              {editing?.id === s.id ? (
                <div className="grid gap-2 sm:grid-cols-4">
                  <input aria-label="Service name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="h-10 rounded-lg border border-black/15 px-2 sm:col-span-2" />
                  <input aria-label="Minimum price" type="number" min={0} value={editing.price_min ?? ""} onChange={(e) => setEditing({ ...editing, price_min: e.target.value === "" ? null : Number(e.target.value) })} className="h-10 rounded-lg border border-black/15 px-2" />
                  <input aria-label="Maximum price" type="number" min={0} value={editing.price_max ?? ""} onChange={(e) => setEditing({ ...editing, price_max: e.target.value === "" ? null : Number(e.target.value) })} className="h-10 rounded-lg border border-black/15 px-2" />
                  <div className="flex gap-2 sm:col-span-4">
                    <button disabled={disabled} onClick={() => void saveEdit()} className="rounded-lg bg-[#0B7168] px-3 py-1.5 font-semibold text-white">Save</button>
                    <button disabled={disabled} onClick={() => setEditing(null)} className="rounded-lg border px-3 py-1.5">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-medium">{s.name}</span>
                  {(s.price_min != null || s.price_max != null) && (
                    <span className="text-xs text-[#66706E]">Rs.{s.price_min ?? "?"}–{s.price_max ?? "?"}</span>
                  )}
                  <span className="ml-auto flex gap-1">
                    <button disabled={disabled} onClick={() => setEditing(s)} className="rounded border px-2 py-1 text-xs">Edit</button>
                    <button disabled={disabled} onClick={() => void remove(s.id, s.name)} className="rounded border border-red-300 px-2 py-1 text-xs text-red-700">
                      {busy === `del-${s.id}` ? "…" : "Delete"}
                    </button>
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 grid gap-2 border-t border-black/10 pt-3 sm:grid-cols-4">
        <input aria-label="New service name" placeholder="e.g. Fan installation" value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-lg border border-black/15 px-3 sm:col-span-2" />
        <input aria-label="New service minimum price" type="number" min={0} placeholder="Min Rs." value={min} onChange={(e) => setMin(e.target.value)} className="h-11 rounded-lg border border-black/15 px-3" />
        <input aria-label="New service maximum price" type="number" min={0} placeholder="Max Rs." value={max} onChange={(e) => setMax(e.target.value)} className="h-11 rounded-lg border border-black/15 px-3" />
      </div>
      <button disabled={disabled || name.trim() === ""} onClick={() => void add()} className="mt-2 h-11 rounded-lg bg-[#17201F] px-5 font-semibold text-white disabled:opacity-60">
        {busy === "add" ? "Adding…" : "Add service"}
      </button>
    </section>
  );
}
