"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabaseBrowser, isSupabaseConfigured } from "@/lib/supabase";
import { ClockIcon, GridIcon, HeartIcon, HomeIcon, LogoutIcon, PanelLeftCloseIcon, PanelLeftOpenIcon, PinIcon, PlusIcon, SearchIcon, UserIcon } from "@/components/UiIcon";
import ThemeToggle from "@/components/ThemeToggle";

// Khojau dark-luxury sidebar. The rail is intentionally always dark
// (#0B0D10): it is a persistent app frame, not page content, so it does
// not follow the page light/dark theme. Content areas keep the theme.

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt=""
      aria-hidden="true"
      width={compact ? 32 : 40}
      height={compact ? 31 : 39}
      className={
        compact
          ? "h-8 w-8 shrink-0 rounded-[10px] bg-white/90 object-contain p-0.5"
          : "h-10 w-10 shrink-0 rounded-[14px] bg-white/90 object-contain p-1"
      }
    />
  );
}

function useSession(): boolean | null {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setSignedIn(false);
      return;
    }
    const sb = supabaseBrowser();
    let live = true;
    sb.auth.getSession().then(({ data }) => {
      if (live && data.session) setSignedIn(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      if (live) setSignedIn(Boolean(session));
    });
    return () => {
      live = false;
      sub.subscription.unsubscribe();
    };
  }, []);
  return signedIn;
}

function useSessionEmail(): string | null {
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const sb = supabaseBrowser();
    let live = true;
    sb.auth.getSession().then(({ data }) => {
      if (live) setEmail(data.session?.user?.email ?? null);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      if (live) setEmail(session?.user?.email ?? null);
    });
    return () => {
      live = false;
      sub.subscription.unsubscribe();
    };
  }, []);
  return email;
}

// Real saved-providers count for the signed-in user. Guests see no badge.
// Never invent a number: unknown state renders nothing.
function useSavedCount(signedIn: boolean | null): number | null {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    if (!signedIn) {
      setCount(null);
      return;
    }
    let live = true;
    (async () => {
      try {
        const { count: c } = await supabaseBrowser()
          .from("saved_providers")
          .select("id", { count: "exact", head: true });
        if (live) setCount(typeof c === "number" ? c : null);
      } catch {
        if (live) setCount(null);
      }
    })();
    return () => {
      live = false;
    };
  }, [signedIn]);
  return count;
}

// Every entry maps to a real route. There is intentionally no "Nearby":
// Khojau has no geolocation feature, and a dead link would be fake functionality.
const NAV = [
  { href: "/dashboard", label: "Dashboard", Icon: HomeIcon, kbd: null },
  { href: "/search", label: "Search", Icon: SearchIcon, kbd: "⌘K" },
  { href: "/services", label: "Services", Icon: GridIcon, kbd: null },
  { href: "/locations", label: "Locations", Icon: PinIcon, kbd: null },
  { href: "/saved", label: "Saved", Icon: HeartIcon, kbd: null },
  { href: "/recent", label: "Recent", Icon: ClockIcon, kbd: null },
] as const;

function RowShell({ active, collapsed, href, label, onNavigate, children }: {
  active: boolean;
  collapsed: boolean;
  href: string;
  label: string;
  onNavigate?: () => void;
  children: React.ReactNode;
}) {
  if (collapsed) {
    return (
      <Link
        onClick={onNavigate}
        href={href}
        aria-label={label}
        title={label}
        aria-current={active ? "page" : undefined}
        className={`relative mx-auto grid h-11 w-11 place-items-center rounded-xl transition-all duration-200 hover:bg-white/[0.06] hover:text-white active:bg-white/10 ${active ? "bg-white/[0.08] text-[#D4AF37] shadow-[0_0_16px_-4px_rgba(212,175,55,0.5)]" : "text-zinc-400"}`}
      >
        {active && <span aria-hidden="true" className="absolute left-[-12px] h-5 w-1 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.8)]" />}
        {children}
      </Link>
    );
  }
  return (
    <Link
      onClick={onNavigate}
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative flex min-h-[44px] items-center gap-3 whitespace-nowrap rounded-xl px-3 text-sm font-medium transition-all duration-200 hover:bg-white/[0.06] hover:text-white active:bg-white/10 ${active ? "bg-white/[0.08] font-semibold text-white shadow-[0_0_20px_-8px_rgba(212,175,55,0.6)]" : "text-zinc-400"}`}
    >
      {active && <span aria-hidden="true" className="absolute left-[-12px] h-5 w-1 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.8)]" />}
      {children}
    </Link>
  );
}

// One source of truth for sidebar navigation.
export function SidebarNav({ collapsed, onToggle, onNavigate }: { collapsed: boolean; onToggle?: () => void; onNavigate?: () => void }) {
  const path = usePathname();
  const router = useRouter();
  const signedIn = useSession();
  const email = useSessionEmail();
  const savedCount = useSavedCount(signedIn);
  const [leaving, setLeaving] = useState(false);

  async function signOut() {
    if (leaving) return;
    setLeaving(true);
    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } finally {
      onNavigate?.();
      router.push("/");
      router.refresh();
    }
  }
  return (
    <div className="flex h-full flex-col overflow-hidden text-zinc-300">
      <div className={`flex items-center gap-3 pb-4 pt-1 ${collapsed ? "flex-col justify-center px-0" : "px-1"}`}>
        <span className="rounded-[14px] bg-white/[0.06] p-1 ring-1 ring-white/10 backdrop-blur-md">
          <BrandLogo compact={collapsed} />
        </span>
        {!collapsed && (
          <span className="min-w-0 flex-1 whitespace-nowrap leading-tight">
            <span className="block truncate text-[15px] font-bold tracking-tight text-white">Khojau</span>
            <span className="block truncate text-xs text-zinc-500">Find local services</span>
          </span>
        )}
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            aria-controls="khojau-sidebar"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            {collapsed ? <PanelLeftOpenIcon className="h-5 w-5" /> : <PanelLeftCloseIcon className="h-5 w-5" />}
          </button>
        )}
      </div>
      <ul className="mt-2 space-y-0.5">
        {NAV.map(({ href, label, Icon, kbd }) => {
          const active = path === href || path.startsWith(href + "/");
          return (
            <li key={href}>
              <RowShell active={active} collapsed={collapsed} href={href} label={label} onNavigate={onNavigate}>
                <Icon className={`h-5 w-5 shrink-0 transition-colors ${active ? "text-[#D4AF37]" : ""}`} />
                {!collapsed && <span className="flex-1">{label}</span>}
                {!collapsed && kbd && (
                  <kbd aria-hidden="true" className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[11px] font-semibold text-zinc-500">⌘K</kbd>
                )}
                {!collapsed && href === "/saved" && typeof savedCount === "number" && savedCount > 0 && (
                  <span className="rounded-full bg-[#D4AF37]/15 px-2 py-0.5 text-xs font-bold text-[#D4AF37]">{savedCount}</span>
                )}
              </RowShell>
            </li>
          );
        })}
      </ul>
      {!collapsed && (
        <p className="whitespace-nowrap px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-600">For providers</p>
      )}
      <Link
        onClick={onNavigate}
        href="/add-business"
        aria-label="Add your business"
        title={collapsed ? "Add your business" : undefined}
        className={
          collapsed
            ? "mx-auto grid h-11 w-11 place-items-center rounded-xl bg-[#D4AF37] text-[#0B0D10] shadow-[0_4px_20px_-6px_rgba(212,175,55,0.7)] transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
            : "flex min-h-[44px] items-center gap-3 whitespace-nowrap rounded-xl bg-[#D4AF37] px-3 text-sm font-semibold text-[#0B0D10] shadow-[0_4px_24px_-8px_rgba(212,175,55,0.8)] transition-all duration-200 hover:brightness-110 active:scale-[0.99]"
        }
      >
        <PlusIcon className="h-5 w-5 shrink-0" />
        {!collapsed && "Add your business"}
      </Link>
      <div className="mt-auto pt-3">
        {collapsed ? (
          <div className="mx-auto w-fit">
            <ThemeToggle />
          </div>
        ) : (
          <ThemeToggle variant="row" />
        )}
        <div className="pt-1">
          {signedIn === null ? (
            <span aria-hidden="true" className={`block animate-pulse rounded-xl bg-white/[0.06] ${collapsed ? "mx-auto h-11 w-11" : "h-[44px]"}`} />
          ) : !signedIn ? (
            collapsed ? (
              <Link
                onClick={onNavigate}
                href="/login"
                aria-label="Log in"
                title="Log in"
                className="mx-auto grid h-11 w-11 place-items-center rounded-xl text-zinc-400 transition-all duration-200 hover:bg-white/[0.06] hover:text-white"
              >
                <UserIcon className="h-5 w-5" />
              </Link>
            ) : (
              <Link
                onClick={onNavigate}
                href="/login"
                className="flex min-h-[44px] items-center gap-3 whitespace-nowrap rounded-xl px-3 text-sm font-medium text-zinc-400 transition-all duration-200 hover:bg-white/[0.06] hover:text-white"
              >
                <UserIcon className="h-5 w-5 shrink-0" />
                Log in
              </Link>
            )
          ) : collapsed ? (
            <button
              type="button"
              onClick={() => void signOut()}
              disabled={leaving}
              aria-label="Sign out"
              title="Sign out"
              className="mx-auto grid h-11 w-11 place-items-center rounded-xl text-zinc-400 transition-all duration-200 hover:bg-white/[0.06] hover:text-white disabled:opacity-60"
            >
              <LogoutIcon className="h-5 w-5" />
            </button>
          ) : (
            <>
              <Link
                onClick={onNavigate}
                href="/account"
                aria-label={email ?? "Account"}
                className="flex min-h-[44px] items-center gap-3 whitespace-nowrap rounded-xl px-3 text-sm font-medium text-zinc-400 transition-all duration-200 hover:bg-white/[0.06] hover:text-white"
              >
                <span aria-hidden="true" className="relative grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#D4AF37]/20 text-xs font-bold text-[#D4AF37]">
                  {(email ?? "?").charAt(0).toUpperCase()}
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0B0D10] bg-emerald-400" />
                </span>
                <span className="min-w-0 flex-1 truncate">{email}</span>
              </Link>
              <button
                type="button"
                onClick={() => void signOut()}
                disabled={leaving}
                className="mt-0.5 flex min-h-[44px] w-full items-center gap-3 whitespace-nowrap rounded-xl px-3 text-sm font-medium text-zinc-400 transition-all duration-200 hover:bg-white/[0.06] hover:text-white disabled:opacity-60"
              >
                <LogoutIcon className="h-5 w-5 shrink-0" />
                {leaving ? "Signing out…" : "Sign out"}
              </button>
            </>
          )}
        </div>
        {!collapsed && signedIn === false && (
          <p className="px-3 pb-1 pt-2 text-xs leading-snug text-zinc-600">Sign in to save services and see full provider details.</p>
        )}
      </div>
    </div>
  );
}

// Desktop sidebar: sticky full-height dark-luxury rail.
export default function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <aside
      id="khojau-sidebar"
      className={`sticky top-0 hidden h-screen shrink-0 flex-col transition-[width] duration-[250ms] ease-in-out lg:flex ${collapsed ? "w-[72px]" : "w-[280px]"}`}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_40%_at_50%_0%,rgba(212,175,55,0.08),transparent_70%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.05] bg-[url('data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 width=%27120%27 height=%27120%27><filter id=%27n%27><feTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27/></filter><rect width=%27120%27 height=%27120%27 filter=%27url(%23n)%27 opacity=%270.6%27/></svg>')]" />
      <nav aria-label="Sidebar" className="relative flex h-full flex-col overflow-y-hidden overflow-x-hidden border-r border-white/10 bg-[#0B0D10] p-3">
        <SidebarNav collapsed={collapsed} onToggle={onToggle} />
      </nav>
    </aside>
  );
}
