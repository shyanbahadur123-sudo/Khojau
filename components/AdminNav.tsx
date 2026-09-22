"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/providers", label: "Providers" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/requests", label: "Requests" },
  { href: "/admin/categories", label: "Categories" },
];

export default function AdminNav() {
  const path = usePathname();
  return (
    <div className="flex flex-wrap items-center gap-2 pt-6">
      <nav aria-label="Admin sections" className="flex flex-wrap gap-2">
        {ITEMS.map((i) => {
          const active = i.href === "/admin" ? path === "/admin" : path === i.href || path.startsWith(i.href + "/");
          return (
            <Link
              key={i.href}
              href={i.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                active ? "bg-[#0A0A0A] text-white dark:bg-[#f5f5f5] dark:text-black" : "bg-black/5 hover:bg-black/10"
              }`}
            >
              {i.label}
            </Link>
          );
        })}
      </nav>
      <span className="mx-1 hidden h-5 w-px bg-black/10 sm:block" aria-hidden="true" />
      <Link href="/dashboard" className="rounded-full px-3 py-2 text-sm font-semibold hover:underline">
        My listings
      </Link>
      <Link href="/" className="rounded-full px-3 py-2 text-sm font-semibold hover:underline">
        View site
      </Link>
    </div>
  );
}
