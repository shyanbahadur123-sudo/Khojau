export default function SearchLoading() {
  return (
    <div className="space-y-6 pt-6" aria-busy="true" aria-label="Loading search results">
      <div className="h-8 w-48 animate-pulse rounded bg-black/10" />
      <div className="h-12 w-full animate-pulse rounded-lg bg-black/10" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-36 animate-pulse rounded-xl bg-black/10" />
        ))}
      </div>
    </div>
  );
}
