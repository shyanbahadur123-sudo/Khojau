import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminEmailAddr } from "@/lib/admin-emails";

const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/add-business", "/saved", "/account", "/requests", "/recent", "/provider"];
const AUTH_PAGES = new Set(["/login", "/register"]);

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return res;
  const sb = createServerClient(url, anon, {
    cookies: {
      get: (n: string) => req.cookies.get(n)?.value,
      // Pin session-cookie attributes explicitly instead of inheriting
      // library defaults silently. Library options (expiry) are preserved.
      set: (n: string, v: string, o?: object) =>
        res.cookies.set(n, v, { ...(o as object), path: "/", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" } as never),
      remove: (n: string, o?: object) =>
        res.cookies.set(n, "", { ...(o as object), path: "/", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" } as never),
    },
  });
  // Refreshes expired tokens and sets renewed cookies on the response.
  // A missing/invalid/expired session yields user === null.
  const {
    data: { user },
  } = await sb.auth.getUser();
  const path = req.nextUrl.pathname;
  // Proxy-aware base (duplicated from lib/validation to keep middleware
  // edge-light with zero imports): guests must land on the login page of
  // the address they opened, never the internal origin.
  const fwdProto = req.headers.get("x-forwarded-proto")?.split(",")[0].trim();
  const fwdHost =
    req.headers.get("x-forwarded-host")?.split(",")[0].trim() || req.headers.get("host")?.split(",")[0].trim();
  const base =
    fwdHost && !/[\s\\]/.test(fwdHost)
      ? `${fwdProto || req.nextUrl.protocol.replace(":", "")}://${fwdHost}`
      : req.nextUrl.origin;
  const isProtected = PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
  if (!user && isProtected) {
    const login = new URL("/login", base);
    login.searchParams.set("next", path);
    return NextResponse.redirect(login);
  }
  // Edge-layer admin gate (fail closed in production, graceful in dev):
  // a signed-in non-admin never reaches /admin UI. Page-level
  // getAdminStatus() remains the authoritative check.
  const isAdminPath = path === "/admin" || path.startsWith("/admin/");
  if (user && isAdminPath && process.env.ADMIN_EMAILS && !isAdminEmailAddr(user.email, process.env.ADMIN_EMAILS)) {
    return NextResponse.redirect(new URL("/", base));
  }
  if (user && AUTH_PAGES.has(path)) {
    // Role-aware landing: admins start in the moderation hub, everyone
    // else on the app home. Emails come from server env only.
    const isAdmin = isAdminEmailAddr(user.email, process.env.ADMIN_EMAILS);
    return NextResponse.redirect(new URL(isAdmin ? "/admin" : "/", base));
  }
  return res;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico)).*)"] };
