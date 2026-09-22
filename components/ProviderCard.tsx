import Link from "next/link";
import type { Provider } from "@/types/database";

export function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#0B7168]/10 px-2 py-0.5 text-xs font-semibold text-[#0B7168]">
      <span aria-hidden>✓</span> Verified
    </span>
  );
}

export default function ProviderCard({ provider }: { provider: Provider }) {
  return (
    <article className="rounded-xl border border-black/10 bg-[#FFFDF8] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold leading-snug">
            <Link href={`/provider/${provider.slug}`} className="hover:underline">
              {provider.business_name}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-[#66706E]">
            {provider.categories?.name ?? "Local service"} · {provider.area ? `${provider.area}, ` : ""}{provider.city}
          </p>
        </div>
        {provider.verification_status === "verified" && <VerifiedBadge />}
      </div>
      {provider.description && (
        <p className="mt-2 line-clamp-2 text-sm text-[#17201F]/80">{provider.description}</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <a href={`tel:${provider.phone}`} className="rounded-lg bg-[#0B7168] px-3 py-2 font-semibold text-white">
          Call
        </a>
        <Link href={`/provider/${provider.slug}`} className="rounded-lg border border-black/15 px-3 py-2 font-medium">
          View
        </Link>
        {provider.price_min != null && (
          <span className="ml-auto text-xs text-[#66706E]">
            Rs.{provider.price_min}{provider.price_max ? `–${provider.price_max}` : "+"}
          </span>
        )}
      </div>
    </article>
  );
}
