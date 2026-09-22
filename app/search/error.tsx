"use client";

export default function SearchError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="space-y-4 pt-6 text-center">
      <h1 className="text-2xl font-bold">Search is temporarily unavailable</h1>
      <p className="text-[#66706E]">Please try again in a moment.</p>
      <button onClick={() => reset()} className="rounded-lg bg-[#0B7168] px-5 py-3 font-semibold text-white">
        Try again
      </button>
    </div>
  );
}
