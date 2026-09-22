import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"));
  const cookieStore = cookies();
  const sb = createServerClient(url, anon, {
    cookies: {
      get: (n: string) => cookieStore.get(n)?.value,
      set: (n: string, v: string, o?: object) => { try { cookieStore.set(n, v, o as never); } catch {} },
      remove: (n: string, o?: object) => { try { cookieStore.set(n, "", o as never); } catch {} },
    },
  });
  await sb.auth.signOut();
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"));
}
