import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProviderBySlug } from "@/lib/providers";
import { directionsUrl, whatsappUrl } from "@/lib/search";
import { VerifiedBadge } from "@/components/ProviderCard";
import ReportButton from "@/components/ReportButton";
import ContactTracker from "@/components/ContactTracker";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await getProviderBySlug(params.slug);
  if (!p) return { title: "Provider not found" };
  return {
    title: `${p.business_name} — ${p.city}`,
    description: p.description?.slice(0, 155) ?? `${p.business_name}, local service in ${p.city}, Nepal.`,
    alternates: { canonical: `/provider/${p.slug}` },
    openGraph: { title: p.business_name, description: p.description ?? undefined, type: "profile" },
  };
}

export default async function ProviderPage({ params }: { params: { slug: string } }) {
  const p = await getProviderBySlug(params.slug);
  if (!p) notFound();
  const wa = whatsappUrl(p.whatsapp ?? p.phone);
  const dir = directionsUrl(p);

  return (
    <div className="space-y-6 pt-6">
      <nav aria-label="Breadcrumb" className="text-sm text-[#66706E]">
        <a href="/" className="hover:underline">Home</a> / <a href="/search" className="hover:underline">Search</a> / <span aria-current="page">{p.business_name}</span>
      </nav>

      <header className="rounded-2xl bg-[#FFFDF8] p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">{p.business_name}</h1>
          {p.verification_status === "verified" && <VerifiedBadge />}
          {p.plan !== "free" && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">{p.plan}</span>
          )}
        </div>
        <p className="mt-1 text-sm text-[#66706E]">
          {p.categories?.name ?? "Local service"} · {p.area ? `${p.area}, ` : ""}{p.city}
        </p>
        {p.description && <p className="mt-3 max-w-2xl whitespace-pre-line text-[15px] leading-relaxed">{p.description}</p>}
        {(p.price_min != null || p.price_max != null) && (
          <p className="mt-3 text-sm"><strong>Price range:</strong> Rs.{p.price_min ?? "?"} – Rs.{p.price_max ?? "?"}</p>
        )}
      </header>

      <ContactTracker providerId={p.id} />

      {/* Sticky mobile contact bar */}
      <div className="sticky bottom-3 z-30 grid grid-cols-3 gap-2 rounded-xl border border-black/10 bg-[#FFFDF8] p-2 shadow-lg sm:static sm:flex sm:shadow-none">
        <a href={`tel:${p.phone}`} className="rounded-lg bg-[#0B7168] px-4 py-3 text-center font-semibold text-white" data-track="phone_click">
          Call
        </a>
        {wa ? (
          <a href={wa} target="_blank" rel="noopener" className="rounded-lg border border-[#0B7168] px-4 py-3 text-center font-semibold text-[#0B7168]" data-track="message_click">
            Message
          </a>
        ) : (
          <a href={`sms:${p.phone}`} className="rounded-lg border border-[#0B7168] px-4 py-3 text-center font-semibold text-[#0B7168]" data-track="message_click">
            Message
          </a>
        )}
        <a href={dir} target="_blank" rel="noopener" className="rounded-lg border border-black/15 px-4 py-3 text-center font-semibold" data-track="directions_click">
          Directions
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <section aria-labelledby="contact" className="rounded-xl bg-[#FFFDF8] p-5">
          <h2 id="contact" className="font-bold">Contact & address</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div><dt className="inline font-semibold">Phone: </dt><dd className="inline"><a href={`tel:${p.phone}`} className="text-[#0B7168] hover:underline">{p.phone}</a></dd></div>
            {p.address && <div><dt className="inline font-semibold">Address: </dt><dd className="inline">{p.address}{p.area ? `, ${p.area}` : ""}, {p.city}</dd></div>}
            {p.email && <div><dt className="inline font-semibold">Email: </dt><dd className="inline">{p.email}</dd></div>}
            {p.website && <div><dt className="inline font-semibold">Website: </dt><dd className="inline"><a href={p.website} target="_blank" rel="noopener" className="text-[#0B7168] hover:underline">{p.website}</a></dd></div>}
            {(p.facebook || p.instagram) && (
              <div className="flex gap-3 pt-1">
                {p.facebook && <a href={p.facebook} target="_blank" rel="noopener" className="text-[#0B7168] hover:underline">Facebook</a>}
                {p.instagram && <a href={p.instagram} target="_blank" rel="noopener" className="text-[#0B7168] hover:underline">Instagram</a>}
              </div>
            )}
          </dl>
        </section>
        <section aria-labelledby="map" className="rounded-xl bg-[#FFFDF8] p-5">
          <h2 id="map" className="font-bold">Map</h2>
          <p className="mt-2 text-sm text-[#66706E]">{p.address ?? `${p.area ?? ""} ${p.city}`.trim()}</p>
          <a href={dir} target="_blank" rel="noopener" className="mt-3 inline-block rounded-lg bg-[#17201F] px-4 py-2 text-sm font-semibold text-white">
            Open in Google Maps
          </a>
        </section>
      </div>

      <ReportButton providerId={p.id} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: p.business_name,
            description: p.description,
            telephone: p.phone,
            address: { "@type": "PostalAddress", addressLocality: p.city, streetAddress: p.address ?? undefined, addressCountry: "NP" },
            url: p.website ?? undefined,
          }),
        }}
      />
    </div>
  );
}
