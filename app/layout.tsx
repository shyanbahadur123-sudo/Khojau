import type { Metadata } from "next";
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
  themeColor: "#0A0A0A",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
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
