import Link from "next/link";
import type { Provider } from "@/types/database";
import { sizedImageUrl } from "@/lib/storage";

export function VerifiedBadge() {
  return (
    <Link
      href="/how-it-works#verification"
      title="Verified: this business passed Khojau's contact and business-detail checks. Learn more."
      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#0B7168]/10 px-2 py-0.5 text-xs font-semibold text-[#0B7168] hover:bg-[#0B7168]/20"
    >
      <span aria-hidden>✓</span> Verified
    </Link>
  );
}

export default function ProviderCard({ provider }: { provider: Provider }) {
  return (
    <article className="group flex gap-3 rounded-xl border border-black/10 bg-[#FFFDF8] p-4 shadow-sm transition-all duration-200 ease-out hover:shadow-md hover:-translate-y-[2px] hover:border-[#0B7168]/30">
      {provider.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={sizedImageUrl(provider.logo_url, 200)}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="h-14 w-14 shrink-0 rounded-lg border border-black/10 object-cover"
        />
      ) : (
        <span aria-hidden="true" className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-[#0B7168]/10 text-xl font-bold text-[#0B7168]">
          {provider.business_name.charAt(0).toUpperCase()}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-base font-semibold leading-snug">
            <Link href={`/provider/${provider.slug}`} className="hover:underline">
              {provider.business_name}
            </Link>
          </h3>
          {provider.verification_status === "verified" && <VerifiedBadge />}
        </div>
        <p className="mt-0.5 truncate text-sm text-[#66706E]">
          {provider.categories?.name ?? "Local service"} · {provider.area ? `${provider.area}, ` : ""}{provider.city}
        </p>
        {provider.description && (
          <p className="mt-1 line-clamp-2 text-sm text-[#17201F]/80">{provider.description}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <a href={`tel:${provider.phone}`} className="inline-flex min-h-[40px] items-center rounded-lg bg-[#0B7168] px-3 py-2 font-semibold text-white">
            Call
          </a>
          <Link href={`/provider/${provider.slug}`} className="inline-flex min-h-[40px] items-center rounded-lg border border-black/15 px-3 py-2 font-medium">
            View
          </Link>
          {provider.price_min != null && (
            <span className="ml-auto text-xs text-[#66706E]">
              Rs.{provider.price_min}{provider.price_max ? `–${provider.price_max}` : "+"}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
