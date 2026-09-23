import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-black/10 bg-[#FFFFFF]">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:grid-cols-4 sm:px-6">
        <div>
          <p>
            <Link href="/" aria-label="Khojau home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt=""
                aria-hidden="true"
                width={74}
                height={72}
                className="h-[72px] w-auto mix-blend-multiply dark:rounded-2xl dark:bg-white dark:p-1.5 dark:mix-blend-normal"
              />
            </Link>
          </p>
          <p className="mt-2 text-sm text-[#6B7280]">Find trusted local services near you, across Nepal.</p>
        </div>
        <nav aria-label="Discover">
          <p className="text-sm font-semibold">Discover</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li><Link href="/services" className="hover:underline">All services</Link></li>
            <li><Link href="/locations" className="hover:underline">All locations</Link></li>
            <li><Link href="/search" className="hover:underline">Search</Link></li>
            <li><Link href="/how-it-works" className="hover:underline">How it works</Link></li>
          </ul>
        </nav>
        <nav aria-label="Business">
          <p className="text-sm font-semibold">Business</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li><Link href="/add-business" className="hover:underline">Add your business</Link></li>
            <li><Link href="/request-service" className="hover:underline">Request a service</Link></li>
            <li><Link href="/register" className="hover:underline">Create account</Link></li>
            <li><Link href="/dashboard" className="hover:underline">Dashboard</Link></li>
          </ul>
        </nav>
        <nav aria-label="Company">
          <p className="text-sm font-semibold">Company</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li><Link href="/contact" className="hover:underline">Contact</Link></li>
            <li><Link href="/privacy" className="hover:underline">Privacy</Link></li>
            <li><Link href="/terms" className="hover:underline">Terms</Link></li>
          </ul>
        </nav>
      </div>
      <p className="border-t border-black/10 py-4 text-center text-xs text-[#6B7280]">
        © {new Date().getFullYear()} Khojau. Made for Nepal.
      </p>
    </footer>
  );
}
