"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  GridIcon,
  HeartIcon,
  HomeIcon,
  MenuIcon,
  PinIcon,
  PlusIcon,
  SearchIcon,
  ClockIcon,
  CloseIcon,
  UserIcon,
} from "@/components/UiIcon";
import ThemeToggle from "@/components/ThemeToggle";

const TABS = [
  { href: "/", label: "Home", Icon: HomeIcon, exact: true },
  { href: "/search", label: "Search", Icon: SearchIcon, exact: false },
  { href: "/saved", label: "Saved", Icon: HeartIcon, exact: true },
  { href: "/account", label: "Account", Icon: UserIcon, exact: true },
] as const;

const SHEET_LINKS = [
  { href: "/dashboard", label: "Dashboard", Icon: HomeIcon },
  { href: "/services", label: "Services", Icon: GridIcon },
  { href: "/locations", label: "Locations", Icon: PinIcon },
  { href: "/recent", label: "Recent", Icon: ClockIcon },
] as const;

// Mobile-only floating tab bar (sm:hidden): black pill, active tab is a
// white pill with icon + label. Menu opens a bottom sheet with everything
// else — there is no slide-over sidebar on mobile.
export default function BottomNav() {
  const path = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 sm:hidden"
      >
        <div className="mx-auto flex h-16 max-w-md items-center gap-1 rounded-full bg-[#0B0D10]/95 px-2 shadow-2xl backdrop-blur-md">
          <button
            ref={menuBtnRef}
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            aria-label="Open menu"
            className="flex min-h-[56px] flex-1 items-center justify-center rounded-full transition-colors"
          >
            {menuOpen ? (
              <span className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-black">
                <MenuIcon className="h-5 w-5" /> Menu
              </span>
            ) : (
              <MenuIcon className="h-6 w-6 text-zinc-400" />
            )}
          </button>
          {TABS.map(({ href, label, Icon, exact }) => {
            const active = exact ? path === href : path === href || path.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className="flex min-h-[56px] flex-1 items-center justify-center rounded-full transition-colors"
              >
                {active ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-black">
                    <Icon className="h-5 w-5" /> {label}
                  </span>
                ) : (
                  <Icon className="h-6 w-6 text-zinc-400" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
      {menuOpen && <MenuSheet onClose={() => setMenuOpen(false)} triggerRef={menuBtnRef} />}
    </>
  );
}

function MenuSheet({
  onClose,
  triggerRef,
}: {
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Sheet a11y: focus moves in on open and back to the Menu button on
  // close, Escape closes, page scroll locks while open.
  useEffect(() => {
    closeRef.current?.focus();
    const trigger = triggerRef.current;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      trigger?.focus();
    };
  }, [onClose, triggerRef, closeRef]);

  return (
    <div className="fixed inset-0 z-50 sm:hidden">
      <div aria-hidden="true" onClick={onClose} className="absolute inset-0 bg-black/50" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-[#FFFFFF] p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold tracking-tight text-[#0A0A0A]">Menu</p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="grid h-11 w-11 place-items-center rounded-full border border-black/10 text-[#0A0A0A]"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {SHEET_LINKS.map(({ href, label, Icon }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={onClose}
                className="flex min-h-[52px] items-center gap-3 rounded-2xl border border-black/10 px-4 text-[15px] font-semibold text-[#0A0A0A]"
              >
                <Icon className="h-5 w-5 shrink-0 text-[#6B7280]" /> {label}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/add-business"
          onClick={onClose}
          className="mt-2 flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[#C9A227] px-4 text-[15px] font-semibold text-black"
        >
          <PlusIcon className="h-5 w-5" /> Add your business
        </Link>
        <Link
          href="/account"
          onClick={onClose}
          className="mt-2 flex min-h-[52px] items-center gap-3 rounded-2xl border border-black/10 px-4 text-[15px] font-semibold text-[#0A0A0A]"
        >
          <UserIcon className="h-5 w-5 shrink-0 text-[#6B7280]" /> Account
        </Link>
        <div className="mt-2 rounded-2xl border border-black/10 px-1 py-1">
          <ThemeToggle variant="row" />
        </div>
      </div>
    </div>
  );
}
