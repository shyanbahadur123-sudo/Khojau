import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicOrigin } from "@/lib/validation";

export async function POST(req: Request) {
  const base = publicOrigin(req);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return NextResponse.redirect(new URL("/login", base));
  const cookieStore = cookies();
  const sb = createServerClient(url, anon, {
    cookies: {
      get: (n: string) => cookieStore.get(n)?.value,
      set: (n: string, v: string, o?: object) => { try { cookieStore.set(n, v, o as never); } catch {} },
      remove: (n: string, o?: object) => { try { cookieStore.set(n, "", o as never); } catch {} },
    },
  });
  await sb.auth.signOut();
  return NextResponse.redirect(new URL("/", base));
}
