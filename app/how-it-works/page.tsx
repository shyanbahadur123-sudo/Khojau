import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How Khojau works",
  description: "How customers find local services, how businesses join Khojau, and what verification means.",
  alternates: { canonical: "/how-it-works" },
};

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 pt-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">How Khojau works</h1>
        <p className="mt-2 text-[#6B7280]">Khojau connects people in Nepal with local service providers — directly, without middlemen.</p>
      </div>

      <section aria-labelledby="for-customers">
        <h2 id="for-customers" className="text-xl font-bold">For customers</h2>
        <ol className="mt-3 space-y-3">
          <li className="rounded-xl bg-[#FFFFFF] p-4"><p className="font-semibold">1. Search or browse</p><p className="mt-1 text-sm text-[#6B7280]">Type a service like “plumber” plus your area, or browse categories and locations.</p></li>
          <li className="rounded-xl bg-[#FFFFFF] p-4"><p className="font-semibold">2. Compare providers</p><p className="mt-1 text-sm text-[#6B7280]">Open profiles to see services, price ranges, opening hours, photos, and contact details.</p></li>
          <li className="rounded-xl bg-[#FFFFFF] p-4"><p className="font-semibold">3. Contact or request</p><p className="mt-1 text-sm text-[#6B7280]">Call, message on WhatsApp, get directions — or send a service request with your phone number and the provider will call you back.</p></li>
        </ol>
        <Link href="/search" className="mt-4 inline-block rounded-lg bg-[#111111] px-5 py-3 font-semibold text-white">Start searching</Link>
      </section>

      <section aria-labelledby="for-businesses">
        <h2 id="for-businesses" className="text-xl font-bold">For businesses</h2>
        <ol className="mt-3 space-y-3">
          <li className="rounded-xl bg-[#FFFFFF] p-4"><p className="font-semibold">1. List your business — free</p><p className="mt-1 text-sm text-[#6B7280]">Submit your business name, category, phone, and location. It takes a few minutes.</p></li>
          <li className="rounded-xl bg-[#FFFFFF] p-4"><p className="font-semibold">2. We review it</p><p className="mt-1 text-sm text-[#6B7280]">Our team checks every submission before it goes public. You can track the status (pending, approved, rejected) in your dashboard.</p></li>
          <li className="rounded-xl bg-[#FFFFFF] p-4"><p className="font-semibold">3. Get discovered</p><p className="mt-1 text-sm text-[#6B7280]">Add your services, hours, and photos. Receive calls and service requests directly — no commission.</p></li>
        </ol>
        <Link href="/add-business" className="mt-4 inline-block rounded-lg bg-[#111111] px-5 py-3 font-semibold text-white">Add your business</Link>
      </section>

      <section aria-labelledby="verification">
        <h2 id="verification" className="text-xl font-bold">What “verified” means</h2>
        <div className="mt-3 rounded-xl bg-[#FFFFFF] p-4 text-[15px]">
          <p>A <strong>verified</strong> badge means the business has passed Khojau&apos;s current verification process: contact-number confirmation and a review of the submitted business details by our team.</p>
          <p className="mt-2 text-[#6B7280]">Verified does not guarantee service quality. Always confirm pricing, timing, and scope with the provider directly before hiring — and use the report link on any listing if details look wrong.</p>
        </div>
      </section>

      <section aria-labelledby="reports">
        <h2 id="reports" className="text-xl font-bold">Reporting a listing</h2>
        <p className="mt-2 text-[15px] text-[#6B7280]">Wrong phone number, closed business, or misleading information? Use <strong>Report this listing</strong> at the bottom of any provider page. Reports go to our moderation team — reporting is free and you don&apos;t need an account.</p>
      </section>
    </div>
  );
}
