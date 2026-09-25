/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // NOTE: no `images` optimizer configuration. The app renders provider
  // photos with plain <img> tags (Supabase-served), so the /_next/image
  // optimizer endpoint would be pure attack surface with zero benefit.
  // If next/image is ever adopted, restrict remotePatterns to the exact
  // Supabase storage hostname instead of a wildcard.
  async headers() {
    // Supabase origin: single source of truth is NEXT_PUBLIC_SUPABASE_URL
    // (§37 — F-01 happened because a dead host was hardcoded here).
    // Falls back to the current project, never to the retired one.
    // No wildcards: the exact project origin only.
    const supabaseOrigin = (() => {
      try {
        const u = new URL((process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim());
        if (u.protocol !== "https:") throw new Error("non-https");
        return u.origin;
      } catch {
        return "https://ilcdfjsquftqxhhdlvve.supabase.co";
      }
    })();
    // Next.js dev needs 'unsafe-eval' for React Refresh / HMR. Without it,
    // the dev runtime throws EvalError and ALL client interactivity breaks
    // (ThemeToggle, Show password, menus). Production never needs eval, so
    // keep it strict there.
    const isDev = process.env.NODE_ENV !== "production";
    const scriptSrc = ["script-src 'self' 'unsafe-inline' https://accounts.google.com"];
    if (isDev) scriptSrc.push("'unsafe-eval'");
    const csp = [
      "default-src 'self'",
      scriptSrc.join(" "),
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' data: ${supabaseOrigin}`,
      "font-src 'self' data:",
      `connect-src 'self' ${supabaseOrigin} https://accounts.google.com`,
      "frame-src https://accounts.google.com",
      "form-action 'self' https://accounts.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
    ].join("; ");
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
