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
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
