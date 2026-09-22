"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminReportActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const inFlight = useRef(false);

  async function act(action: "reviewed" | "dismissed") {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(action);
    setNote(null);
    try {
      const res = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Action failed");
      setNote({ ok: true, text: action === "reviewed" ? "Marked reviewed." : "Dismissed." });
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
      <span className="flex gap-2">
        <button disabled={busy !== null} onClick={() => void act("reviewed")} className="rounded-lg border px-3 py-1.5 text-xs disabled:opacity-60">
          {busy === "reviewed" ? "Working…" : "Mark reviewed"}
        </button>
        <button disabled={busy !== null} onClick={() => void act("dismissed")} className="rounded-lg border px-3 py-1.5 text-xs disabled:opacity-60">
          {busy === "dismissed" ? "Working…" : "Dismiss"}
        </button>
      </span>
      {note && (
        <span role="status" className={`mt-1 block text-xs font-medium ${note.ok ? "text-[#7A5C00]" : "text-red-700 dark:text-red-400"}`}>
          {note.text}
        </span>
      )}
    </span>
  );
}
