import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getProviderBySlug } from "@/lib/providers";
import { directionsUrl, whatsappUrl } from "@/lib/search";
import { stringifyJsonLd } from "@/lib/validation";
import { sizedImageUrl } from "@/lib/storage";
import { WEEKDAYS } from "@/types/database";
import { VerifiedBadge } from "@/components/ProviderCard";
import ReportButton from "@/components/ReportButton";
import ContactTracker from "@/components/ContactTracker";
import { supabaseServer } from "@/lib/supabase-server";

async function requireMember(slug: string) {
  try {
    const sb = supabaseServer();
    if (!sb) redirect(`/login?next=/provider/${encodeURIComponent(slug)}`);
    const { data: { user } } = await sb.auth.getUser();
    if (!user) redirect(`/login?next=/provider/${encodeURIComponent(slug)}`);
  } catch (e) {
    if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) throw e;
    redirect(`/login?next=/provider/${encodeURIComponent(slug)}`);
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  // Don't leak business names / descriptions to guests via metadata.
  try {
    const sb = supabaseServer();
    if (!sb) return { title: "Log in required", robots: { index: false, follow: false } };
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return { title: "Log in required", robots: { index: false, follow: false } };
  } catch {
    return { title: "Log in required", robots: { index: false, follow: false } };
  }
  const p = await getProviderBySlug(params.slug);
  if (!p) return { title: "Provider not found" };
  return {
    title: `${p.business_name} — ${p.city}`,
    description: p.description?.slice(0, 155) ?? `${p.business_name}, local service in ${p.city}, Nepal.`,
    alternates: { canonical: `/provider/${p.slug}` },
    openGraph: { title: p.business_name, description: p.description ?? undefined, type: "profile" },
  };
}

export const revalidate = 60;

export default async function ProviderPage({ params }: { params: { slug: string } }) {
  // Members-only (defense in depth: middleware already redirects guests).
  await requireMember(params.slug);
  const p = await getProviderBySlug(params.slug);
  if (!p) notFound();
  const wa = whatsappUrl(p.whatsapp ?? p.phone);
  const dir = directionsUrl(p);

  return (
    <div className="space-y-6 pt-6">
      <nav aria-label="Breadcrumb" className="break-words text-sm text-[#6B7280]">
        <Link href="/" className="hover:underline">Home</Link> / <Link href="/search" className="hover:underline">Search</Link> / <span aria-current="page">{p.business_name}</span>
      </nav>

      <header className="rounded-2xl bg-[#FFFFFF] p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">{p.business_name}</h1>
          {p.verification_status === "verified" && <VerifiedBadge />}
          {p.plan !== "free" && (
            <span className="rounded-full bg-[#C9A227] px-2 py-0.5 text-xs font-semibold text-black">{p.plan}</span>
          )}
        </div>
        <p className="mt-1 text-sm text-[#6B7280]">
          {p.categories?.name ?? "Local service"} · {p.area ? `${p.area}, ` : ""}{p.city}
        </p>
        <p className="mt-2 text-xs text-[#6B7280]">
          {p.verification_status === "verified" ? (
            <>Verified business — contact and business details checked by Khojau. <a href="/how-it-works#verification" className="underline">What does this mean?</a></>
          ) : (
            <>Listing reviewed by Khojau. Always confirm details directly before hiring.</>
          )}
        </p>
        {(p.price_min != null || p.price_max != null) && (
          <p className="mt-3 text-sm"><strong>Price range:</strong> Rs.{p.price_min ?? "?"} – Rs.{p.price_max ?? "?"}</p>
        )}
      </header>

      <ContactTracker providerId={p.id} />

      {/* Sticky mobile contact bar: stacked Call + side-by-side pair on small screens */}
      <div className="sticky bottom-3 z-30 flex flex-col gap-2 rounded-xl border border-black/10 bg-[#FFFFFF] p-2 shadow-lg sm:static sm:grid sm:grid-cols-3 sm:shadow-none">
        <a href={`tel:${p.phone}`} className="rounded-lg bg-[#C9A227] px-4 py-3 text-center font-semibold text-black" data-track="phone_click">
          Call {p.phone}
        </a>
        <div className="grid grid-cols-2 gap-2 sm:contents">
        {wa ? (
          <a href={wa} target="_blank" rel="noopener" className="rounded-lg border border-black/25 px-4 py-3 text-center font-semibold" data-track="message_click">
            Message
          </a>
        ) : (
          <a href={`sms:${p.phone}`} className="rounded-lg border border-black/25 px-4 py-3 text-center font-semibold" data-track="message_click">
            Message
          </a>
        )}
        <a href={dir} target="_blank" rel="noopener" className="rounded-lg border border-black/15 px-4 py-3 text-center font-semibold" data-track="directions_click">
          Directions
        </a>
        </div>
      </div>

      {p.description && (
        <section aria-labelledby="about" className="rounded-2xl bg-[#FFFFFF] p-6 shadow-sm">
          <h2 id="about" className="text-lg font-bold">About {p.business_name}</h2>
          <p className="mt-2 max-w-2xl whitespace-pre-line text-[15px] leading-relaxed">{p.description}</p>
        </section>
      )}

      {((p.services ?? []).length > 0 || (p.provider_hours ?? []).length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {(p.services ?? []).length > 0 && (
            <section aria-labelledby="services" className="rounded-xl bg-[#FFFFFF] p-5">
              <h2 id="services" className="font-bold">Services & prices</h2>
              <ul className="mt-2 divide-y divide-black/10 text-sm">
                {(p.services ?? []).map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 py-2">
                    <span className="min-w-0 flex-1 break-words">{s.name}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      {(s.price_min != null || s.price_max != null) && (
                        <span className="text-[#6B7280]">Rs.{s.price_min ?? "?"}–{s.price_max ?? "?"}</span>
                      )}
                      <a href={`/request-service?provider=${p.slug}&service=${s.id}`} className="font-semibold text-[#111111] hover:underline">Request</a>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {(p.provider_hours ?? []).length > 0 && (
            <section aria-labelledby="hours" className="rounded-xl bg-[#FFFFFF] p-5">
              <h2 id="hours" className="font-bold">Opening hours</h2>
              <ul className="mt-2 divide-y divide-black/10 text-sm">
                {(p.provider_hours ?? []).map((h) => (
                  <li key={h.weekday} className="flex items-center justify-between gap-2 py-2">
                    <span>{WEEKDAYS[h.weekday] ?? `Day ${h.weekday}`}</span>
                    <span className="text-[#6B7280]">
                      {h.is_closed || !h.open_time ? "Closed" : `${h.open_time}–${h.close_time ?? ""}`}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {(p.cover_image_url || p.logo_url || (p.provider_images ?? []).length > 0) && (
        <section aria-label={`Photos of ${p.business_name}`} className="overflow-hidden rounded-2xl bg-[#FFFFFF] shadow-sm">
          {p.cover_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={sizedImageUrl(p.cover_image_url, 1200)} srcSet={`${sizedImageUrl(p.cover_image_url, 400)} 400w, ${sizedImageUrl(p.cover_image_url, 800)} 800w, ${sizedImageUrl(p.cover_image_url, 1200)} 1200w`} sizes="(max-width: 640px) 100vw, 1024px" alt={`${p.business_name} cover photo`} className="aspect-[16/9] w-full object-cover sm:aspect-[21/9]" loading="eager" fetchPriority="high" decoding="async" />
          )}
          <div className="flex flex-wrap items-center gap-4 p-6">
            {p.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sizedImageUrl(p.logo_url, 200)} alt={`${p.business_name} logo`} className="aspect-square h-20 w-20 rounded-xl border object-cover" loading="lazy" />
            )}
            {(p.provider_images ?? []).length > 0 && (
              <ul className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3">
                {(p.provider_images ?? []).map((img, i) => (
                  <li key={img.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sizedImageUrl(img.url, 800)} alt={img.caption || `${p.business_name} photo ${i + 1}`} className="aspect-[4/3] w-full rounded-lg object-cover" loading="lazy" />
                    {img.caption && <p className="mt-1 text-xs text-[#6B7280]">{img.caption}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <section aria-labelledby="contact" className="rounded-xl bg-[#FFFFFF] p-5">
          <h2 id="contact" className="font-bold">Contact & address</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div><dt className="inline font-semibold">Phone: </dt><dd className="inline"><a href={`tel:${p.phone}`} className="text-[#111111] hover:underline">{p.phone}</a></dd></div>
            {p.address && <div><dt className="inline font-semibold">Address: </dt><dd className="inline break-words">{p.address}{p.area ? `, ${p.area}` : ""}, {p.city}</dd></div>}
            {p.email && <div><dt className="inline font-semibold">Email: </dt><dd className="inline"><a href={`mailto:${p.email}`} className="break-all text-[#111111] hover:underline">{p.email}</a></dd></div>}
            {p.website && <div><dt className="inline font-semibold">Website: </dt><dd className="inline"><a href={p.website} target="_blank" rel="noopener" className="break-all text-[#111111] hover:underline">{p.website}</a></dd></div>}
            {(p.facebook || p.instagram) && (
              <div className="flex gap-3 pt-1">
                {p.facebook && <a href={p.facebook} target="_blank" rel="noopener" className="text-[#111111] hover:underline">Facebook</a>}
                {p.instagram && <a href={p.instagram} target="_blank" rel="noopener" className="text-[#111111] hover:underline">Instagram</a>}
              </div>
            )}
          </dl>
        </section>
        <section aria-labelledby="map" className="rounded-xl bg-[#FFFFFF] p-5">
          <h2 id="map" className="font-bold">Map</h2>
          <p className="mt-2 text-sm text-[#6B7280]">{p.address ?? `${p.area ?? ""} ${p.city}`.trim()}</p>
          <a href={dir} target="_blank" rel="noopener" className="mt-3 inline-block min-h-[44px] rounded-lg bg-[#0A0A0A] px-4 py-2 text-sm font-semibold text-white">
            Open in Google Maps
          </a>
        </section>
      </div>

      <div className="rounded-xl border border-[#C9A227]/40 bg-[#C9A227]/10 p-4 text-sm sm:flex sm:items-center sm:justify-between sm:gap-4">
        <p className="font-semibold">Prefer to send details instead of calling? The provider will call you back.</p>
        <a href={`/request-service?provider=${p.slug}`} className="mt-2 inline-block min-h-[44px] rounded-lg bg-[#C9A227] px-4 py-2 font-semibold text-black sm:mt-0 sm:shrink-0">
          Request this service
        </a>
      </div>

      <ReportButton providerId={p.id} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: stringifyJsonLd({
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
