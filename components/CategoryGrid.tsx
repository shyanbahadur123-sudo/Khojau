import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import CategoryIcon from "@/components/CategoryIcon";

export default function CategoryGrid({ limit }: { limit?: number }) {
  const list = limit ? CATEGORIES.slice(0, limit) : CATEGORIES;
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {list.map((c) => (
        <li key={c.slug}>
          <Link
            href={`/services/${c.slug}`}
            className="group flex h-full items-start gap-3 rounded-xl border border-black/10 bg-[#FFFFFF] p-4 transition-colors hover:border-[#111111]/50"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#C9A227]/15 text-[#7A5C00] transition-colors group-hover:bg-[#C9A227]/25">
              <CategoryIcon slug={c.slug} className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block font-semibold leading-snug">{c.name}</span>
              {c.description && <span className="mt-0.5 hidden text-xs leading-snug text-[#6B7280] sm:block">{c.description}</span>}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
