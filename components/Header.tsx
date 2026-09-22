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
        <nav aria-label="Primary" className="flex items-center gap-1 text-sm sm:gap-2">
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
      </div>
    </header>
  );
}
