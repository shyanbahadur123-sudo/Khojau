import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminEmailAddr } from "@/lib/admin-emails";

const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/add-business"];
const AUTH_PAGES = new Set(["/login", "/register"]);

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return res;
  const sb = createServerClient(url, anon, {
    cookies: {
      get: (n: string) => req.cookies.get(n)?.value,
      set: (n: string, v: string, o?: object) => res.cookies.set(n, v, o as never),
      remove: (n: string, o?: object) => res.cookies.set(n, "", o as never),
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
  if (user && AUTH_PAGES.has(path)) {
    // Role-aware landing: admins start in the moderation hub, everyone
    // else on their personal dashboard. Emails come from server env only.
    const isAdmin = isAdminEmailAddr(user.email, process.env.ADMIN_EMAILS);
    return NextResponse.redirect(new URL(isAdmin ? "/admin" : "/dashboard", base));
  }
  return res;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico)).*)"] };
