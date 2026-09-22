"use client";

import { useState } from "react";

export default function ReportButton({ providerId }: { providerId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  return (
    <section aria-label="Report listing" className="rounded-xl bg-[#FFFFFF] p-5 text-sm">
      {!open ? (
        <button onClick={() => setOpen(true)} className="text-[#6B7280] underline">Report this listing</button>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setStatus("Sending…");
            const res = await fetch("/api/reports", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ provider_id: providerId, reason }),
            });
            setStatus(res.ok ? "Thanks — our team will review it." : "Could not submit. Please try again.");
            if (res.ok) { setReason(""); setOpen(false); }
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
            <button type="submit" className="rounded-lg bg-[#0A0A0A] px-4 py-2 font-semibold text-white">Submit</button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg border px-4 py-2">Cancel</button>
          </div>
          {status && <p role="status" className="mt-2 text-[#6B7280]">{status}</p>}
        </form>
      )}
    </section>
  );
}
