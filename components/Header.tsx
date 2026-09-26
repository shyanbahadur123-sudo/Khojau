"use client";
import Link from "next/link";
import { BrandLogo } from "@/components/Sidebar";

// Mobile-only top bar: brand only. Navigation lives in the bottom tab
// bar (+ menu sheet); desktop uses the sidebar shell. No top header at lg+.
export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-[#FFFFFF]/95 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2" aria-label="Khojau home">
          <BrandLogo compact />
          <span className="text-[15px] font-bold leading-tight">Khojau</span>
        </Link>
      </div>
    </header>
  );
}
