"use client";

import { useEffect, useState } from "react";
import {
  BoltIcon,
  BookIcon,
  ChevronDownIcon,
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
    const current = DOCK.find((d) => d.id === theme) ?? DOCK[0];
    const CurrentIcon = current.Icon;
    return (
      <div>
        <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Theme</p>
        <div className="relative px-3">
          <span aria-hidden="true" className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400">
            <CurrentIcon className="h-5 w-5" />
          </span>
          <select
            aria-label="Color theme"
            value={ready ? theme : "gold-light"}
            onChange={(e) => choose(e.target.value as ThemeId)}
            className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-transparent pl-11 pr-9 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60"
          >
            {THEMES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <span aria-hidden="true" className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 text-zinc-500">
            <ChevronDownIcon className="h-4 w-4" />
          </span>
        </div>
        <div role="group" aria-label="Quick theme" className="mx-3 mt-2 flex items-center justify-between rounded-2xl border border-white/10 p-2">
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
      className="grid h-11 w-11 place-items-center rounded-xl border border-white/15 text-zinc-300 transition-all duration-200 hover:bg-white/[0.06] hover:text-white"
    >
      {/* Render neutrally until mounted to avoid a flash of the wrong glyph. */}
      {ready && (dark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />)}
    </button>
  );
}
