"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

const STORAGE_KEY = "khojau-sidebar-collapsed";

// One app shell: collapsible sidebar + header + content.
// Desktop sidebar state persists across reloads (no sensitive data).
// NOTE: collapsed initializes false so server and client render identically;
// the stored preference applies in an effect to avoid a hydration mismatch.
export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

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
        <Header />
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 sm:px-6 sm:pb-16">
          {children}
        </main>
      </div>
    </div>
  );
}
