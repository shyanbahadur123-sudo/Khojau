"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RequestStatus } from "@/types/database";

const OPTIONS: RequestStatus[] = ["open", "in_progress", "completed", "cancelled"];

export default function AdminRequestActions({ id, current }: { id: string; current: RequestStatus }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(to: RequestStatus) {
    if (to === current) return;
    setBusy(true);
    const res = await fetch("/api/admin/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, to }),
    });
    setBusy(false);
    if (!res.ok) alert("Action failed");
    router.refresh();
  }

  return (
    <span className="flex flex-wrap gap-1">
      {OPTIONS.filter((o) => o !== current).map((o) => (
        <button key={o} disabled={busy} onClick={() => void act(o)} className="rounded border px-2 py-1 text-xs disabled:opacity-60">
          → {o.replace("_", " ")}
        </button>
      ))}
    </span>
  );
}
