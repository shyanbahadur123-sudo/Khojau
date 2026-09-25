"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "@/components/UiIcon";

const KEY = "khojau-theme";

function currentIsDark() {
  return document.documentElement.classList.contains("dark");
}

// Premium monochrome toggle: light (white) ↔ dark (true black).
// Persists the choice; first visit follows the OS preference.
// The pre-paint script in app/layout.tsx sets the initial class.
export default function ThemeToggle({ variant = "icon" }: { variant?: "icon" | "row" }) {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDark(currentIsDark());
    setReady(true);
  }, []);

  function toggle() {
    const next = !currentIsDark();
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(KEY, next ? "dark" : "light");
    } catch {
      // Private mode: theme still toggles for this visit.
    }
    setDark(next);
  }

  const label = dark ? "Switch to light theme" : "Switch to dark theme";
  if (variant === "row") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        title={label}
        className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-zinc-300 transition-all duration-200 hover:bg-white/[0.06] hover:text-white"
      >
        {/* Render neutrally until mounted to avoid a flash of the wrong glyph. */}
        {ready && (dark ? <SunIcon className="h-5 w-5 shrink-0" /> : <MoonIcon className="h-5 w-5 shrink-0" />)}
        Theme
        <span className="ml-auto text-xs text-zinc-400">{ready ? (dark ? "Dark" : "Light") : ""}</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 text-zinc-300 transition-all duration-200 hover:bg-white/[0.06] hover:text-white"
    >
      {/* Render neutrally until mounted to avoid a flash of the wrong glyph. */}
      {ready && (dark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />)}
    </button>
  );
}
