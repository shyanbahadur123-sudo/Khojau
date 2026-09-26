"use client";

import { useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { REQUEST_NEXT_ACTIONS, formatRequestStatus, type RequestStatus } from "@/lib/request-status";
import type { ServiceRequestRow } from "@/types/database";

function RequestCard({ r, children }: { r: ServiceRequestRow; children?: React.ReactNode }) {
  return (
    <li className="rounded-lg border border-black/10 p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">{r.service}</p>
        <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-semibold">{formatRequestStatus(r.status)}</span>
      </div>
      <p className="mt-1 break-words text-[#6B7280]">{r.location}{r.preferred_time ? ` · ${r.preferred_time}` : ""}</p>
      <p className="mt-1 break-words whitespace-pre-line">{r.description}</p>
      <p className="mt-1">Phone: <a href={`tel:${r.phone}`} className="text-[#111111] hover:underline">{r.phone}</a></p>
      {r.providers && <p className="mt-1 text-xs text-[#6B7280]">Provider: {r.providers.business_name}</p>}
      {children}
    </li>
  );
}

export default function RequestManager({ incoming, mine }: { incoming: ServiceRequestRow[]; mine: ServiceRequestRow[] }) {
  const [rows, setRows] = useState(incoming);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  async function setStatus(id: string, to: RequestStatus) {
    if (inFlight.current) return;
    setError(null);
    setBusy(`${id}-${to}`);
    inFlight.current = true;
    try {
      const sb = supabaseBrowser();
      // RLS + the status-flow trigger authorize this; anything else is rejected.
      const { error: upErr } = await sb.from("service_requests").update({ status: to }).eq("id", id);
      if (upErr) throw new Error(upErr.message);
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: to } : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed.");
    } finally {
      inFlight.current = false;
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <section aria-label="Incoming service requests" className="rounded-xl bg-[#FFFFFF] p-4">
        <h2 className="font-bold">Incoming requests {rows.length > 0 && `(${rows.length})`}</h2>
        {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
        {rows.length === 0 ? (
          <p className="mt-2 text-sm text-[#6B7280]">No requests for your listings yet. Share your provider page or list services so customers can reach you.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {rows.map((r) => (
              <RequestCard key={r.id} r={r}>
                {REQUEST_NEXT_ACTIONS[r.status].length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {REQUEST_NEXT_ACTIONS[r.status].map((a) => (
                      <button
                        key={a.to}
                        disabled={busy !== null}
                        onClick={() => void setStatus(r.id, a.to)}
                        className="min-h-[44px] rounded-full bg-[#C9A227] px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-60"
                      >
                        {busy === `${r.id}-${a.to}` ? "…" : a.label}
                      </button>
                    ))}
                  </div>
                )}
              </RequestCard>
            ))}
          </ul>
        )}
      </section>
      <section aria-label="My submitted requests" className="rounded-xl bg-[#FFFFFF] p-4">
        <h2 className="font-bold">My submitted requests {mine.length > 0 && `(${mine.length})`}</h2>
        {mine.length === 0 ? (
          <p className="mt-2 text-sm text-[#6B7280]">You haven&apos;t submitted any requests while signed in. <a href="/request-service" className="underline">Request a service</a>.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {mine.map((r) => <RequestCard key={r.id} r={r} />)}
          </ul>
        )}
      </section>
    </div>
  );
}
