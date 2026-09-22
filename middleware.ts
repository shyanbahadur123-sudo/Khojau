import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
  await sb.auth.getUser();
  return res;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico)).*)"] };
