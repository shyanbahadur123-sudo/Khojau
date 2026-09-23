import type { MetadataRoute } from "next";

// Web app manifest: makes Khojau installable (Add to Home Screen) with a
// standalone app-like window. Icons reuse the brand logo; purpose "any"
// (not maskable — the artwork has no safe padding zone).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Khojau — Find Trusted Local Services Near You",
    short_name: "Khojau",
    description: "Find trusted local services near you, across Nepal.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FAFAFA",
    theme_color: "#0A0A0A",
    icons: [
      { src: "/logo.png", sizes: "355x340", type: "image/png", purpose: "any" },
    ],
  };
}
