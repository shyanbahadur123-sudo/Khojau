"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CloseIcon } from "@/components/UiIcon";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);
  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-[#FFFFFF]/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-[#111111]" aria-label="Khojau home">
          <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-[#111111] text-white">
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
            className="rounded-md bg-[#111111] px-3 py-2 font-semibold text-white hover:bg-[#000000]"
          >
            Add Business
          </Link>
        </nav>
        <button
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(true)}
          className="grid h-10 w-10 cursor-pointer place-items-center gap-0 rounded-lg border border-black/15 hover:bg-black/5 sm:hidden"
        >
          <span aria-hidden="true" className="flex flex-col gap-[5px]">
            <span className="block h-[2px] w-5 rounded bg-current" />
            <span className="block h-[2px] w-5 rounded bg-current" />
            <span className="block h-[2px] w-5 rounded bg-current" />
          </span>
        </button>
        {mobileOpen && (
          <>
            <div onClick={() => setMobileOpen(false)} className="fixed inset-0 z-50 bg-black/20 sm:hidden" aria-hidden="true" />
            <nav aria-label="Mobile" className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-black/10 bg-[#FFFFFF] p-2 shadow-2xl sm:hidden">
              <ul className="space-y-1 text-sm font-medium">
                <li><Link onClick={() => setMobileOpen(false)} href="/search" className="block rounded-lg px-3 py-2.5 hover:bg-black/5">Search</Link></li>
                <li><Link onClick={() => setMobileOpen(false)} href="/services" className="block rounded-lg px-3 py-2.5 hover:bg-black/5">Services</Link></li>
                <li><Link onClick={() => setMobileOpen(false)} href="/locations" className="block rounded-lg px-3 py-2.5 hover:bg-black/5">Locations</Link></li>
                <li><Link onClick={() => setMobileOpen(false)} href="/how-it-works" className="block rounded-lg px-3 py-2.5 hover:bg-black/5">How it works</Link></li>
                <li><Link onClick={() => setMobileOpen(false)} href="/login" className="block rounded-lg px-3 py-2.5 hover:bg-black/5">Log in</Link></li>
                <li><Link onClick={() => setMobileOpen(false)} href="/dashboard" className="block rounded-lg px-3 py-2.5 hover:bg-black/5">Dashboard</Link></li>
                <li><Link onClick={() => setMobileOpen(false)} href="/add-business" className="block rounded-lg bg-[#111111] px-3 py-2.5 font-semibold text-white">Add Business — it&apos;s free</Link></li>
                <li><button onClick={() => setMobileOpen(false)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left hover:bg-black/5" aria-label="Close menu"><CloseIcon className="h-4 w-4" /> Close</button></li>
              </ul>
            </nav>
          </>
        )}
      </div>
    </header>
  );
}
