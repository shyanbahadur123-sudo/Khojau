"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { hoursItemSchema } from "@/lib/validation";
import { WEEKDAYS, type ProviderHourItem } from "@/types/database";

interface DayState {
  is_closed: boolean;
  open_time: string;
  close_time: string;
}

const DEFAULT_DAY: DayState = { is_closed: true, open_time: "10:00", close_time: "18:00" };

export default function HoursManager({ providerId, initial }: { providerId: string; initial: ProviderHourItem[] }) {
  const seed = new Map<number, DayState>();
  for (const h of initial) {
    seed.set(h.weekday, {
      is_closed: h.is_closed,
      open_time: h.open_time ?? "10:00",
      close_time: h.close_time ?? "18:00",
    });
  }
  const [days, setDays] = useState<Map<number, DayState>>(seed);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  async function saveDay(weekday: number) {
    const d = days.get(weekday) ?? DEFAULT_DAY;
    const parsed = hoursItemSchema.safeParse({
      weekday,
      open_time: d.is_closed ? null : d.open_time,
      close_time: d.is_closed ? null : d.close_time,
      is_closed: d.is_closed,
    });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Invalid hours.");
      return;
    }
    setError(null);
    setSaved(null);
    setBusy(weekday);
    try {
      const sb = supabaseBrowser();
      const { error: upErr } = await sb.from("provider_hours").upsert(
        {
          provider_id: providerId, // authorized via providers.owner_id
          weekday: parsed.data.weekday,
          open_time: parsed.data.open_time,
          close_time: parsed.data.close_time,
          is_closed: parsed.data.is_closed,
        },
        { onConflict: "provider_id,weekday" }
      );
      if (upErr) throw new Error(upErr.message);
      setSaved(`${WEEKDAYS[weekday]} hours saved.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setBusy(null);
    }
  }

  async function clearDay(weekday: number) {
    if (!confirm(`Clear hours for ${WEEKDAYS[weekday]}?`)) return;
    setError(null);
    setSaved(null);
    setBusy(weekday);
    try {
      const sb = supabaseBrowser();
      const { error: delErr } = await sb.from("provider_hours").delete().eq("provider_id", providerId).eq("weekday", weekday);
      if (delErr) throw new Error(delErr.message);
      setDays((prev) => {
        const next = new Map(prev);
        next.delete(weekday);
        return next;
      });
      setSaved(`${WEEKDAYS[weekday]} hours cleared.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Clear failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section aria-label="Manage opening hours" className="mt-3 rounded-xl border border-black/10 bg-white/60 p-4">
      <h3 className="text-sm font-bold">Opening hours</h3>
      <p className="mt-1 text-xs text-[#6B7280]">Days without saved hours are shown as unspecified on your public page.</p>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
      {saved && <p role="status" className="mt-2 text-sm font-medium text-[#111111]">{saved}</p>}
      <ul className="mt-2 space-y-2">
        {WEEKDAYS.map((label, weekday) => {
          const d = days.get(weekday);
          const closed = d?.is_closed ?? true;
          const hasRow = days.has(weekday);
          return (
            <li key={weekday} className="flex flex-wrap items-center gap-2 rounded-lg border border-black/10 p-2 text-sm">
              <span className="w-24 font-medium">{label}</span>
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={closed}
                  onChange={(e) => setDays((prev) => new Map(prev).set(weekday, { ...(prev.get(weekday) ?? DEFAULT_DAY), is_closed: e.target.checked }))}
                />
                Closed
              </label>
              {!closed && (
                <>
                  <input
                    aria-label={`${label} opens at`}
                    type="time"
                    value={d?.open_time ?? "10:00"}
                    onChange={(e) => setDays((prev) => new Map(prev).set(weekday, { ...(prev.get(weekday) ?? DEFAULT_DAY), open_time: e.target.value }))}
                    className="h-10 rounded-lg border border-black/15 px-2"
                  />
                  <span aria-hidden>–</span>
                  <input
                    aria-label={`${label} closes at`}
                    type="time"
                    value={d?.close_time ?? "18:00"}
                    onChange={(e) => setDays((prev) => new Map(prev).set(weekday, { ...(prev.get(weekday) ?? DEFAULT_DAY), close_time: e.target.value }))}
                    className="h-10 rounded-lg border border-black/15 px-2"
                  />
                </>
              )}
              {!hasRow && closed && <span className="text-xs text-[#6B7280]">unspecified</span>}
              <span className="ml-auto flex gap-1">
                <button disabled={busy !== null} onClick={() => void saveDay(weekday)} className="rounded bg-[#C9A227] px-2 py-1 text-xs font-semibold text-black disabled:opacity-60">
                  {busy === weekday ? "…" : "Save"}
                </button>
                {hasRow && (
                  <button disabled={busy !== null} onClick={() => void clearDay(weekday)} className="rounded border px-2 py-1 text-xs">
                    Clear
                  </button>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
