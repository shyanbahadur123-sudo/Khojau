"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CloseIcon } from "@/components/UiIcon";
import ThemeToggle from "@/components/ThemeToggle";
import { AuthMenuItems, AuthNavLink } from "@/components/AuthButton";

function NavLink({ href, children, mobile, onNavigate }: { href: string; children: React.ReactNode; mobile?: boolean; onNavigate?: () => void }) {
  const path = usePathname();
  const active = path === href;
  if (mobile) {
    return (
      <li>
        <Link
          onClick={onNavigate}
          href={href}
          aria-current={active ? "page" : undefined}
          className={`block rounded-lg px-3 py-2.5 transition-colors hover:bg-black/5 active:bg-black/10 ${active ? "bg-black/5 font-semibold" : ""}`}
        >
          {children}
        </Link>
      </li>
    );
  }
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-md px-2 py-2 transition-colors hover:bg-black/5 active:bg-black/10 sm:px-3 ${active ? "bg-black/5 font-semibold" : ""}`}
    >
      {children}
    </Link>
  );
}

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
        <Link href="/" className="flex items-center" aria-label="Khojau home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt=""
            aria-hidden="true"
            width={37}
            height={36}
            className="h-9 w-auto mix-blend-multiply dark:rounded-[10px] dark:bg-white dark:p-1 dark:mix-blend-normal"
          />
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-1 text-sm sm:flex sm:gap-2">
          <NavLink href="/services">Services</NavLink>
          <NavLink href="/recent">Recent</NavLink>
          <Link href="/locations" className="hidden rounded-md px-3 py-2 transition-colors hover:bg-black/5 active:bg-black/10 sm:inline">
            Locations
          </Link>
          <AuthNavLink />
          <Link
            href="/add-business"
            className="rounded-md bg-[#C9A227] px-3 py-2 font-semibold text-black hover:bg-[#B8941F]"
          >
            Add Business
          </Link>
          <ThemeToggle />
        </nav>
        <div className="flex items-center gap-2 sm:hidden">
          <ThemeToggle />
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
                <NavLink mobile onNavigate={() => setMobileOpen(false)} href="/search">Search</NavLink>
                <NavLink mobile onNavigate={() => setMobileOpen(false)} href="/services">Services</NavLink>
                <NavLink mobile onNavigate={() => setMobileOpen(false)} href="/recent">Recent</NavLink>
                <NavLink mobile onNavigate={() => setMobileOpen(false)} href="/locations">Locations</NavLink>
                <NavLink mobile onNavigate={() => setMobileOpen(false)} href="/how-it-works">How it works</NavLink>
                <AuthMenuItems onNavigate={() => setMobileOpen(false)} />
                <li><Link onClick={() => setMobileOpen(false)} href="/add-business" className="block rounded-lg bg-[#C9A227] px-3 py-2.5 font-semibold text-black">Add Business — it&apos;s free</Link></li>
                <li><button onClick={() => setMobileOpen(false)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left hover:bg-black/5" aria-label="Close menu"><CloseIcon className="h-4 w-4" /> Close</button></li>
              </ul>
            </nav>
          </>
        )}
        </div>
      </div>
    </header>
  );
}
