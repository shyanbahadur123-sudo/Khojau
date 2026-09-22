import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { safeRedirectPath } from "@/lib/validation";

// OAuth callback: exchanges the provider `code` for a session and redirects.
// The `next` target is re-validated server-side (never trust the query string).
export async function GET(req: Request) {
  const url = new URL(req.url);
  const providerError = url.searchParams.get("error");
  if (providerError) {
    const kind = providerError === "access_denied" ? "oauth_cancelled" : "oauth_failed";
    return NextResponse.redirect(new URL(`/login?error=${kind}`, req.url));
  }

  const next = safeRedirectPath(url.searchParams.get("next"));
  const fail = () => NextResponse.redirect(new URL("/login?error=oauth_failed", req.url));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const code = url.searchParams.get("code");
  if (!supabaseUrl || !supabaseAnon || !code) return fail();

  const res = NextResponse.redirect(new URL(next, req.url));
  const sb = createServerClient(supabaseUrl, supabaseAnon, {
    cookies: {
      get: (n: string) => cookies().get(n)?.value,
      set: (n: string, v: string, o?: object) => res.cookies.set(n, v, o as never),
      remove: (n: string, o?: object) => res.cookies.set(n, "", o as never),
    },
  });
  const { error } = await sb.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("oauth code exchange failed:", error.message);
    return fail();
  }
  return res;
}
