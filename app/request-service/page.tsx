"use client";

import { useState } from "react";

export default function RequestServicePage() {
  const [status, setStatus] = useState<string | null>(null);
  return (
    <div className="mx-auto max-w-xl pt-6">
      <h1 className="text-2xl font-bold">Request a service</h1>
      <p className="mt-1 text-sm text-[#66706E]">Tell us what you need — the Khojau team will manually match you with providers.</p>
      <form
        className="mt-4 space-y-3 rounded-2xl bg-[#FFFDF8] p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setStatus("Sending…");
          const f = new FormData(e.currentTarget as HTMLFormElement);
          const res = await fetch("/api/service-requests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(Object.fromEntries(f.entries())),
          });
          setStatus(res.ok ? "Received! We’ll contact you soon." : "Could not submit. Check your inputs.");
        }}
      >
        <div><label htmlFor="service" className="text-sm font-semibold">Service needed *</label><input id="service" name="service" required maxLength={120} placeholder="e.g. Laptop repair" className="mt-1 h-11 w-full rounded-lg border border-black/15 px-3" /></div>
        <div><label htmlFor="location" className="text-sm font-semibold">Location *</label><input id="location" name="location" required maxLength={120} placeholder="e.g. Baneshwor, Kathmandu" className="mt-1 h-11 w-full rounded-lg border border-black/15 px-3" /></div>
        <div><label htmlFor="description" className="text-sm font-semibold">Description *</label><textarea id="description" name="description" required minLength={10} maxLength={2000} rows={4} placeholder="Laptop won't turn on…" className="mt-1 w-full rounded-lg border border-black/15 p-3" /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label htmlFor="preferred_time" className="text-sm font-semibold">Preferred time</label><input id="preferred_time" name="preferred_time" maxLength={120} placeholder="e.g. Tomorrow morning" className="mt-1 h-11 w-full rounded-lg border border-black/15 px-3" /></div>
          <div><label htmlFor="phone" className="text-sm font-semibold">Phone *</label><input id="phone" name="phone" required placeholder="98XXXXXXXX" className="mt-1 h-11 w-full rounded-lg border border-black/15 px-3" /></div>
        </div>
        <button className="h-12 w-full rounded-lg bg-[#0B7168] font-semibold text-white">Submit request</button>
        {status && <p role="status" className="text-sm text-[#66706E]">{status}</p>}
      </form>
    </div>
  );
}
