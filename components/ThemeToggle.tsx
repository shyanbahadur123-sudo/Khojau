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
export default function ThemeToggle() {
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

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      title={dark ? "Light theme" : "Dark theme"}
      className="grid h-10 w-10 place-items-center rounded-lg border border-black/15 transition-colors hover:bg-black/5"
    >
      {/* Render neutrally until mounted to avoid a flash of the wrong glyph. */}
      {ready && (dark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />)}
    </button>
  );
}
