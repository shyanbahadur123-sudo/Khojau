"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { REQUEST_STATUS_LABEL, type RequestStatus } from "@/lib/request-status";

const OPTIONS: RequestStatus[] = ["open", "in_progress", "completed", "cancelled"];

export default function AdminRequestActions({ id, current }: { id: string; current: RequestStatus }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const inFlight = useRef(false);

  async function act(to: RequestStatus) {
    if (to === current || inFlight.current) return;
    inFlight.current = true;
    setBusy(to);
    setNote(null);
    try {
      const res = await fetch("/api/admin/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, to }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Action failed");
      setNote({ ok: true, text: `Status set to ${REQUEST_STATUS_LABEL[to]}.` });
      router.refresh();
    } catch (err) {
      setNote({ ok: false, text: err instanceof Error ? err.message : "Action failed. Try again." });
    } finally {
      inFlight.current = false;
      setBusy(null);
    }
  }

  return (
    <span>
      <span className="flex flex-wrap gap-1">
        {OPTIONS.filter((o) => o !== current).map((o) => (
          <button key={o} disabled={busy !== null} onClick={() => void act(o)} className="rounded border px-2 py-1 text-xs disabled:opacity-60">
            {busy === o ? "…" : `→ ${REQUEST_STATUS_LABEL[o]}`}
          </button>
        ))}
      </span>
      {note && (
        <span role="status" className={`mt-1 block text-xs font-medium ${note.ok ? "text-[#7A5C00]" : "text-red-700 dark:text-red-400"}`}>
          {note.text}
        </span>
      )}
    </span>
  );
}
