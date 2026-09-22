"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import type { RequestStatus, ServiceRequestRow } from "@/types/database";

const NEXT_ACTIONS: Record<RequestStatus, { label: string; to: RequestStatus }[]> = {
  open: [
    { label: "Start progress", to: "in_progress" },
    { label: "Cancel", to: "cancelled" },
  ],
  in_progress: [
    { label: "Mark completed", to: "completed" },
    { label: "Cancel", to: "cancelled" },
  ],
  completed: [],
  cancelled: [],
};

const STATUS_LABEL: Record<RequestStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

function RequestCard({ r, children }: { r: ServiceRequestRow; children?: React.ReactNode }) {
  return (
    <li className="rounded-lg border border-black/10 p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">{r.service}</p>
        <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-semibold">{STATUS_LABEL[r.status]}</span>
      </div>
      <p className="mt-1 text-[#66706E]">{r.location}{r.preferred_time ? ` · ${r.preferred_time}` : ""}</p>
      <p className="mt-1 whitespace-pre-line">{r.description}</p>
      <p className="mt-1">Phone: <a href={`tel:${r.phone}`} className="text-[#0B7168] hover:underline">{r.phone}</a></p>
      {r.providers && <p className="mt-1 text-xs text-[#66706E]">Provider: {r.providers.business_name}</p>}
      {children}
    </li>
  );
}

export default function RequestManager({ incoming, mine }: { incoming: ServiceRequestRow[]; mine: ServiceRequestRow[] }) {
  const [rows, setRows] = useState(incoming);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(id: string, to: RequestStatus) {
    setError(null);
    setBusy(`${id}-${to}`);
    try {
      const sb = supabaseBrowser();
      // RLS + the status-flow trigger authorize this; anything else is rejected.
      const { error: upErr } = await sb.from("service_requests").update({ status: to }).eq("id", id);
      if (upErr) throw new Error(upErr.message);
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: to } : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <section aria-label="Incoming service requests" className="rounded-xl bg-[#FFFDF8] p-4">
        <h2 className="font-bold">Incoming requests {rows.length > 0 && `(${rows.length})`}</h2>
        {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
        {rows.length === 0 ? (
          <p className="mt-2 text-sm text-[#66706E]">No requests for your listings yet. Share your provider page or list services so customers can reach you.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {rows.map((r) => (
              <RequestCard key={r.id} r={r}>
                {NEXT_ACTIONS[r.status].length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {NEXT_ACTIONS[r.status].map((a) => (
                      <button
                        key={a.to}
                        disabled={busy !== null}
                        onClick={() => void setStatus(r.id, a.to)}
                        className="rounded-lg bg-[#0B7168] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
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
      <section aria-label="My submitted requests" className="rounded-xl bg-[#FFFDF8] p-4">
        <h2 className="font-bold">My submitted requests {mine.length > 0 && `(${mine.length})`}</h2>
        {mine.length === 0 ? (
          <p className="mt-2 text-sm text-[#66706E]">You haven&apos;t submitted any requests while signed in. <a href="/request-service" className="underline">Request a service</a>.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {mine.map((r) => <RequestCard key={r.id} r={r} />)}
          </ul>
        )}
      </section>
    </div>
  );
}
