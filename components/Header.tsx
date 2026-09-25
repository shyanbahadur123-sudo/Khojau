"use client";
import Link from "next/link";
import { BrandLogo } from "@/components/Sidebar";

interface HeaderProps {
  mobileOpen: boolean;
  onMenu: () => void;
}

// Mobile-only top bar. Desktop uses the sidebar shell (brand, nav,
// theme) so no top header renders at lg+.
export default function Header({ mobileOpen, onMenu }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-[#FFFFFF]/95 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2" aria-label="Khojau home">
          <BrandLogo compact />
          <span className="text-[15px] font-bold leading-tight">Khojau</span>
        </Link>
        <button
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          onClick={onMenu}
          className="grid h-11 w-11 cursor-pointer place-items-center rounded-lg border border-black/15 hover:bg-black/5"
        >
          <span aria-hidden="true" className="flex flex-col gap-[5px]">
            <span className="block h-[2px] w-5 rounded bg-current" />
            <span className="block h-[2px] w-5 rounded bg-current" />
            <span className="block h-[2px] w-5 rounded bg-current" />
          </span>
        </button>
      </div>
    </header>
  );
}
