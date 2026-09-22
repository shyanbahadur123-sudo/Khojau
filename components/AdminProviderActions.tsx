"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Row = {
  id: string;
  business_name: string;
  slug: string;
  city: string;
  area: string | null;
  phone: string;
  status: string;
  verification_status: string;
  plan: string;
};

export default function AdminProviderActions({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function act(id: string, action: string, extra?: Record<string, string>) {
    setBusy(id + action);
    const res = await fetch("/api/admin/providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, ...extra }),
    });
    setBusy(null);
    if (!res.ok) alert("Action failed");
    router.refresh();
  }

  return (
    <ul className="space-y-3">
      {rows.map((p) => (
        <li key={p.id} className="rounded-xl bg-[#FFFDF8] p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-bold">{p.business_name}</p>
              <p className="text-[#66706E]">{p.area ? `${p.area}, ` : ""}{p.city} · {p.phone}</p>
              <p className="text-[#66706E]">{p.status} · {p.verification_status} · {p.plan}</p>
            </div>
            <a href={`/provider/${p.slug}`} target="_blank" className="underline">View</a>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button disabled={busy !== null} onClick={() => act(p.id, "approve")} className="rounded-lg bg-[#0B7168] px-3 py-1.5 font-semibold text-white">Approve</button>
            <button disabled={busy !== null} onClick={() => act(p.id, "reject")} className="rounded-lg border px-3 py-1.5">Reject</button>
            <button disabled={busy !== null} onClick={() => act(p.id, "suspend")} className="rounded-lg border px-3 py-1.5">Suspend</button>
            <button disabled={busy !== null} onClick={() => act(p.id, "verify")} className="rounded-lg border px-3 py-1.5">Verify</button>
            <button disabled={busy !== null} onClick={() => act(p.id, "unverify")} className="rounded-lg border px-3 py-1.5">Unverify</button>
            <select
              defaultValue={p.plan}
              aria-label={`Plan for ${p.business_name}`}
              onChange={(e) => act(p.id, "plan", { plan: e.target.value })}
              className="rounded-lg border px-2 py-1.5"
            >
              <option value="free">free</option>
              <option value="featured">featured (Rs.299/mo)</option>
              <option value="premium">premium (Rs.499–999/mo)</option>
            </select>
            <button disabled={busy !== null} onClick={() => { if (confirm("Delete this provider?")) act(p.id, "delete"); }} className="rounded-lg border border-red-300 px-3 py-1.5 text-red-700">Delete</button>
          </div>
        </li>
      ))}
    </ul>
  );
}
