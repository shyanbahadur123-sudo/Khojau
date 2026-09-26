"use client";

import { useEffect, useState } from "react";
import {
  BoltIcon,
  BookIcon,
  MoonIcon,
  SunIcon,
} from "@/components/UiIcon";

const KEY = "khojau-theme";

export const THEMES = [
  { id: "gold-light", label: "Gold Light" },
  { id: "gold-dark", label: "Gold Dark" },
  { id: "mono-light", label: "Mono Light" },
  { id: "mono-dark", label: "Mono Dark" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

// Quick-pick dock: one tap per theme. Icons are mnemonic, labels are
// exposed via aria-label/title so meaning never depends on the glyph.
const DOCK: { id: ThemeId; label: string; Icon: (p: { className?: string }) => React.ReactNode }[] = [
  { id: "gold-dark", label: "Gold Dark", Icon: MoonIcon },
  { id: "gold-light", label: "Gold Light", Icon: SunIcon },
  { id: "mono-dark", label: "Mono Dark", Icon: BoltIcon },
  { id: "mono-light", label: "Mono Light", Icon: BookIcon },
];

function readTheme(): ThemeId {
  const t = document.documentElement.dataset.theme === "mono" ? "mono" : "gold";
  const dark = document.documentElement.classList.contains("dark");
  return `${t}-${dark ? "dark" : "light"}` as ThemeId;
}

function applyTheme(id: ThemeId) {
  document.documentElement.dataset.theme = id.startsWith("mono") ? "mono" : "gold";
  document.documentElement.classList.toggle("dark", id.endsWith("dark"));
  try {
    localStorage.setItem(KEY, id);
  } catch {
    // Private mode: theme still applies for this visit.
  }
}

// Four themes: Gold Light/Dark (brand) + Mono Light/Dark (Apple monochrome).
// Persists the choice; first visit follows the OS preference (gold family).
// The pre-paint script in app/layout.tsx sets the initial theme.
export default function ThemeToggle({ variant = "icon" }: { variant?: "icon" | "row" }) {
  const [theme, setTheme] = useState<ThemeId>("gold-light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setTheme(readTheme());
    setReady(true);
  }, []);

  function choose(id: ThemeId) {
    applyTheme(id);
    setTheme(id);
  }

  if (variant === "row") {
    return (
      <div>
        <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Theme</p>
        <div role="group" aria-label="Color theme" className="mx-3 flex items-center justify-between rounded-2xl border border-white/10 p-2">
          {DOCK.map(({ id, label, Icon }) => {
            const active = ready && theme === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => choose(id)}
                aria-pressed={active}
                aria-label={label}
                title={label}
                className={`grid h-10 w-10 place-items-center rounded-full transition-all duration-200 ${
                  active
                    ? "border border-[#D4AF37] text-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.8)]"
                    : "bg-white/[0.06] text-zinc-400 hover:bg-white/[0.1] hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const idx = THEMES.findIndex((t) => t.id === theme);
  const next = THEMES[(idx + 1) % THEMES.length];
  const dark = theme.endsWith("dark");
  return (
    <button
      type="button"
      onClick={() => choose(next.id)}
      aria-label={`Theme: ${THEMES[idx]?.label ?? "Gold Light"} — switch to ${next.label}`}
      title={`Theme: ${ready ? theme : ""}`}
      className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-zinc-300 transition-all duration-200 hover:bg-white/[0.06] hover:text-white"
    >
      {/* Render neutrally until mounted to avoid a flash of the wrong glyph. */}
      {ready && (dark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />)}
    </button>
  );
}
