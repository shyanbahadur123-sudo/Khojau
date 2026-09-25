"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") setCollapsed(true);
    } catch {
      // Private mode: default to expanded.
    }
  }, []);

  // Global ⌘K / Ctrl+K jumps to search. Never hijacks typing in inputs.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "k") return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
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
      <div className="flex min-w-0 flex-1 flex-col">
        <Header mobileOpen={mobileOpen} onMenu={() => setMobileOpen((v) => !v)} />
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 sm:px-6 sm:pb-16">
          {children}
        </main>
      </div>
      {mobileOpen && (
        <>
          <div onClick={() => setMobileOpen(false)} className="fixed inset-0 z-50 bg-black/40 lg:hidden" aria-hidden="true" />
          <nav aria-label="Mobile" className="fixed bottom-0 left-0 top-0 z-50 flex w-72 flex-col bg-[#0B0D10] p-3 shadow-2xl animate-slide-in lg:hidden">
            <div className="flex items-center justify-between px-1 pb-2">
              <span className="text-sm font-bold text-white">Menu</span>
              <button onClick={() => setMobileOpen(false)} className="grid h-10 w-10 place-items-center rounded-lg text-zinc-400 hover:bg-white/[0.06] hover:text-white" aria-label="Close menu">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarNav collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
