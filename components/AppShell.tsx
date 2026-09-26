"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { SidebarNav } from "@/components/Sidebar";

const STORAGE_KEY = "khojau-sidebar-collapsed";

// One app shell: collapsible sidebar + header + content.
// Desktop sidebar state persists across reloads (no sensitive data).
// NOTE: collapsed initializes false so server and client render identically;
// the stored preference applies in an effect to avoid a hydration mismatch.
export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);

  // Modal drawer a11y: focus trapped inside while open, Escape closes,
  // focus moves in on open and back to the menu trigger on close.
  // Background content is inert + page scroll locked while open.
  useEffect(() => {
    if (!mobileOpen) return;
    drawerCloseRef.current?.focus();
    const shell = document.getElementById("app-shell-content");
    shell?.setAttribute("inert", "");
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const root = document.getElementById("mobile-nav");
      if (!root) return;
      const items = Array.from(
        root.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
      ).filter((el) => el.getClientRects().length > 0);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      shell?.removeAttribute("inert");
      document.body.style.overflow = prevOverflow;
      // While open the trigger reads "Close menu"; query both labels.
      document.querySelector<HTMLElement>('header button[aria-label="Close menu"], header button[aria-label="Open menu"]')?.focus();
    };
  }, [mobileOpen]);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") setCollapsed(true);
    } catch {
      // Private mode: default to expanded.
    }
  }, []);

  // Global ⌘K / Ctrl+K jumps to search. Never hijacks typing in inputs.
  // [ toggles the desktop sidebar rail (same typing guard).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "k") {
        if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey && e.key === "[") {
          e.preventDefault();
          toggle();
        }
        return;
      }
      if (typing) return;
      e.preventDefault();
      router.push("/search");
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [router]);

  function toggle() {
    setCollapsed((c) => {
      try {
        if (!c) window.localStorage.setItem(STORAGE_KEY, "1");
        else window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Private mode: state still toggles for this visit.
      }
      return !c;
    });
  }

  return (
    <div className="flex min-h-screen items-stretch">
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <div id="app-shell-content" className="flex min-w-0 flex-1 flex-col">
        <Header mobileOpen={mobileOpen} onMenu={() => setMobileOpen((v) => !v)} />
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 sm:px-6 sm:pb-16">
          {children}
        </main>
      </div>
      {mobileOpen && (
        <>
          <div onClick={() => setMobileOpen(false)} aria-hidden="true" className="fixed inset-0 z-50 bg-black/40 lg:hidden" />
          <div role="dialog" aria-modal="true" aria-label="Site menu" id="mobile-nav" className="fixed bottom-0 left-0 top-0 z-50 flex w-72 max-w-[85vw] flex-col bg-[#0B0D10] p-3 shadow-2xl animate-slide-in lg:hidden">
            <div className="flex items-center justify-between px-1 pb-2">
              <span className="text-sm font-bold text-white">Menu</span>
              <button ref={drawerCloseRef} onClick={() => setMobileOpen(false)} className="grid h-11 w-11 place-items-center rounded-lg text-zinc-400 hover:bg-white/[0.06] hover:text-white" aria-label="Close menu"><span aria-hidden="true">✕</span></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarNav collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
