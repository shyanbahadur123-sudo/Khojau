export default function Loading() {
  return (
    <div aria-hidden="true" className="space-y-6 pt-6">
      <div className="h-6 w-40 animate-pulse rounded bg-black/5" />
      <div className="h-24 animate-pulse rounded-2xl bg-black/5" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-44 animate-pulse rounded-xl bg-black/5" />
        <div className="h-44 animate-pulse rounded-xl bg-black/5" />
      </div>
    </div>
  );
}
