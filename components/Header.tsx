import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-[#FFFDF8]/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-[#0B7168]" aria-label="Khojau home">
          <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-[#0B7168] text-white">
            ख
          </span>
          <span className="text-lg tracking-tight">Khojau</span>
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-1 text-sm sm:flex sm:gap-2">
          <Link href="/services" className="rounded-md px-2 py-2 hover:bg-black/5 sm:px-3">
            Services
          </Link>
          <Link href="/locations" className="hidden rounded-md px-3 py-2 hover:bg-black/5 sm:inline">
            Locations
          </Link>
          <Link href="/login" className="hidden rounded-md px-3 py-2 hover:bg-black/5 sm:inline">
            Log in
          </Link>
          <Link
            href="/add-business"
            className="rounded-md bg-[#0B7168] px-3 py-2 font-semibold text-white hover:bg-[#095A53]"
          >
            Add Business
          </Link>
        </nav>
        <div className="flex items-center gap-2 sm:hidden">
          <Link
            href="/add-business"
            className="rounded-md bg-[#0B7168] px-3 py-2 text-sm font-semibold text-white hover:bg-[#095A53]"
          >
            Add Business
          </Link>
          <details className="relative">
            <summary
              aria-label="Open menu"
              className="grid h-10 w-10 cursor-pointer place-items-center rounded-lg border border-black/15 text-xl [&::-webkit-details-marker]:hidden"
            >
              <span aria-hidden>☰</span>
            </summary>
            <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-black/10 bg-[#FFFDF8] p-2 shadow-lg">
              <nav aria-label="Mobile">
                <ul className="space-y-1 text-sm font-medium">
                  <li><Link href="/search" className="block rounded-lg px-3 py-2.5 hover:bg-black/5">Search</Link></li>
                  <li><Link href="/services" className="block rounded-lg px-3 py-2.5 hover:bg-black/5">Services</Link></li>
                  <li><Link href="/locations" className="block rounded-lg px-3 py-2.5 hover:bg-black/5">Locations</Link></li>
                  <li><Link href="/how-it-works" className="block rounded-lg px-3 py-2.5 hover:bg-black/5">How it works</Link></li>
                  <li><Link href="/login" className="block rounded-lg px-3 py-2.5 hover:bg-black/5">Log in</Link></li>
                  <li><Link href="/dashboard" className="block rounded-lg px-3 py-2.5 hover:bg-black/5">Dashboard</Link></li>
                </ul>
              </nav>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
