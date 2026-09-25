export default function Loading() {
  return (
    <div aria-hidden="true" className="space-y-6 pt-6">
      <div className="h-6 w-36 animate-pulse rounded bg-black/5" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-2xl bg-black/5" />
        ))}
      </div>
    </div>
  );
}
