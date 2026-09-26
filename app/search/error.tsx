"use client";

export default function SearchError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="space-y-4 pt-6 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Search is temporarily unavailable</h1>
      <p className="text-[#6B7280]">Please try again in a moment.</p>
      <button onClick={() => reset()} className="rounded-full bg-[#C9A227] px-5 py-3 font-semibold text-black">
        Try again
      </button>
    </div>
  );
}
