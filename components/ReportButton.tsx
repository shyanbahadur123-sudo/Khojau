"use client";

import { useRef, useState } from "react";

export default function ReportButton({ providerId }: { providerId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setFailed(false);
    setStatus("Sending…");
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider_id: providerId, reason }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus("Thanks — our team will review it.");
      setReason("");
      setOpen(false);
    } catch {
      setFailed(true);
      setStatus("Could not submit. Please try again.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <section aria-label="Report listing" className="rounded-xl bg-[#FFFFFF] p-5 text-sm">
      <button
        ref={triggerRef}
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-controls={open ? "report-form" : undefined}
        className="min-h-[44px] rounded-lg px-2 text-[#6B7280] underline"
      >
        {open ? "Close report form" : "Report this listing"}
      </button>
      {open && (
        <form
          id="report-form"
          className="mt-2"
          onSubmit={submit}
          onKeyDown={(e) => {
            if (e.key === "Escape") close();
          }}
        >
          <label htmlFor="report-reason" className="font-semibold">Why are you reporting this?</label>
          <textarea
            id="report-reason"
            required
            minLength={3}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-2 w-full rounded-lg border border-black/15 p-3"
            placeholder="e.g. Wrong phone number, closed business…"
          />
          <div className="mt-2 flex gap-2">
            <button type="submit" disabled={busy} className="min-h-[44px] rounded-lg bg-[#0A0A0A] px-4 py-2 font-semibold text-white disabled:opacity-60">
              {busy ? "Sending…" : "Submit"}
            </button>
            <button type="button" onClick={close} className="min-h-[44px] rounded-lg border px-4 py-2">Cancel</button>
          </div>
        </form>
      )}
      {status && (
        <p role={failed ? "alert" : "status"} className="mt-2 text-[#6B7280]">
          {status}
        </p>
      )}
    </section>
  );
}
