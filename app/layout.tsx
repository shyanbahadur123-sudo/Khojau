import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthCodeHandler from "@/components/AuthCodeHandler";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Khojau — Find Trusted Local Services Near You", template: "%s | Khojau" },
  description:
    "Discover electricians, plumbers, repair technicians, tutors, photographers and other local service providers across Nepal.",
  openGraph: {
    type: "website",
    siteName: "Khojau",
    title: "Khojau — Find Trusted Local Services Near You",
    description: "Nepal-focused local service discovery and business directory.",
  },
  twitter: { card: "summary_large_image", title: "Khojau", description: "Find trusted local services near you." },
  robots: { index: true, follow: true },
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23C9A227'/%3E%3Ctext x='29' y='45' font-size='36' font-weight='bold' text-anchor='middle' fill='%23000'%3E%E0%A4%96%3C/text%3E%3C/svg%3E",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAFA" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0A" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Script
          id="khojau-theme"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("khojau-theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})();`,
          }}
        />
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Header />
        <Suspense>
          <AuthCodeHandler />
        </Suspense>
        <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
