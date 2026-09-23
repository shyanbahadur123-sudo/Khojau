"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, SearchIcon, HeartIcon, UserIcon } from "@/components/UiIcon";

const TABS = [
  { href: "/", label: "Home", Icon: HomeIcon, exact: true },
  { href: "/search", label: "Search", Icon: SearchIcon, exact: false },
  { href: "/saved", label: "Saved", Icon: HeartIcon, exact: true },
  { href: "/account", label: "Account", Icon: UserIcon, exact: true },
];

// Mobile-only bottom tab bar (sm:hidden). Desktop keeps the header nav.
// Guests tapping Saved/Account land on login via middleware, then return.
export default function BottomNav() {
  const path = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-[#FFFFFF]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {TABS.map(({ href, label, Icon, exact }) => {
          const active = exact ? path === href : path === href || path.startsWith(href + "/");
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors ${
                  active ? "text-[#0A0A0A]" : "text-[#6B7280]"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
