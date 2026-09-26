"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ConfirmDialog";

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
  const [notes, setNotes] = useState<Record<string, { ok: boolean; action?: string; text: string }>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<Row | null>(null);
  const inFlight = useRef(false);

  async function act(id: string, action: string, extra?: Record<string, string>) {
    // Ref guard: rapid double-taps before re-render must not fire twice
    // (duplicate approve audits were observed from exactly this).
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(id + action);
    setNotes((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    try {
      const res = await fetch("/api/admin/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, ...extra }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Action failed");
      const done: Record<string, string> = {
        approve: "Approved — now public.",
        reject: "Rejected — hidden from public.",
        suspend: "Suspended — hidden from public.",
        verify: "Marked verified.",
        unverify: "Verification removed.",
        plan: `Plan set to ${extra?.plan ?? ""}.`,
        delete: "Deleted.",
      };
      setNotes((prev) => ({ ...prev, [id]: { ok: true, action, text: done[action] ?? "Done." } }));
      router.refresh();
    } catch (err) {
      setNotes((prev) => ({ ...prev, [id]: { ok: false, text: err instanceof Error ? err.message : "Action failed. Try again." } }));
    } finally {
      inFlight.current = false;
      setBusy(null);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteConfirm) return;
    const row = deleteConfirm;
    setDeleteConfirm(null);
    await act(row.id, "delete");
  }

  return (
    <>
    <ul className="space-y-3">
      {rows.map((p) => (
        <li key={p.id} className="rounded-xl bg-[#FFFFFF] p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-bold">{p.business_name}</p>
              <p className="text-[#6B7280]">{p.area ? `${p.area}, ` : ""}{p.city} · {p.phone}</p>
              <p className="text-[#6B7280]">{p.status} · {p.verification_status} · {p.plan}</p>
            </div>
            <a href={`/provider/${p.slug}`} target="_blank" className="underline">View</a>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button disabled={busy !== null} onClick={() => act(p.id, "approve")} className="rounded-full bg-[#C9A227] px-3 py-1.5 font-semibold text-black disabled:opacity-60">{busy === p.id + "approve" ? "Working…" : "Approve"}</button>
            <button disabled={busy !== null} onClick={() => act(p.id, "reject")} className="rounded-lg border px-3 py-1.5">Reject</button>
            <button disabled={busy !== null} onClick={() => act(p.id, "suspend")} className="rounded-lg border px-3 py-1.5">Suspend</button>
            <button disabled={busy !== null} onClick={() => act(p.id, "verify")} className="rounded-lg border px-3 py-1.5">Verify</button>
            <button disabled={busy !== null} onClick={() => act(p.id, "unverify")} className="rounded-lg border px-3 py-1.5">Unverify</button>
            <select
              defaultValue={p.plan}
              disabled={busy !== null}
              aria-label={`Plan for ${p.business_name}`}
              onChange={(e) => act(p.id, "plan", { plan: e.target.value })}
              className="rounded-lg border px-2 py-1.5 disabled:opacity-60"
            >
              <option value="free">free</option>
              <option value="featured">featured (Rs.299/mo)</option>
              <option value="premium">premium (Rs.499–999/mo)</option>
            </select>
            <button disabled={busy !== null} onClick={() => setDeleteConfirm(p)} className="rounded-lg border border-red-300 px-3 py-1.5 text-red-700 disabled:opacity-60">
              {busy === p.id + "delete" ? "Working…" : "Delete"}
            </button>
          </div>
          {notes[p.id] && (
            <p role="status" className={`mt-2 rounded-lg p-2 text-xs font-medium ${notes[p.id].ok ? "bg-[#C9A227]/15 text-[#7A5C00]" : "bg-red-500/10 text-red-700 dark:text-red-400"}`}>
              {notes[p.id].text}
              {notes[p.id].ok && (notes[p.id].action === "approve" || notes[p.id].action === "verify") && (
                <> <a href={`/provider/${p.slug}`} target="_blank" rel="noopener" className="underline underline-offset-2">View live page</a></>
              )}
            </p>
          )}
        </li>
      ))}
    </ul>
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => void handleDeleteConfirm()}
        title="Delete provider"
        message={deleteConfirm ? `Delete ${deleteConfirm.business_name}? This action cannot be undone.` : "Delete this provider?"}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        pending={busy !== null}
        disabled={busy !== null}
      />
    </>
  );
}
