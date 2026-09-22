"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminReportActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(action: "reviewed" | "dismissed") {
    setBusy(true);
    const res = await fetch("/api/admin/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    setBusy(false);
    if (!res.ok) alert("Action failed");
    router.refresh();
  }

  return (
    <span className="flex gap-2">
      <button disabled={busy} onClick={() => void act("reviewed")} className="rounded-lg border px-3 py-1.5 text-xs">Mark reviewed</button>
      <button disabled={busy} onClick={() => void act("dismissed")} className="rounded-lg border px-3 py-1.5 text-xs">Dismiss</button>
    </span>
  );
}
