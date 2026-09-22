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
    // Single-project CSP (this deployment only serves ipnywyozktrzlvsxsyzh).
    // 'unsafe-inline' scripts/styles are required by Next.js hydration — the
    // policy still blocks objects, frames, and off-origin media/API calls.
    // If Khojau ever deploys per-environment, build this string from env.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://accounts.google.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://ipnywyozktrzlvsxsyzh.supabase.co",
      "font-src 'self' data:",
      "connect-src 'self' https://ipnywyozktrzlvsxsyzh.supabase.co https://accounts.google.com",
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
