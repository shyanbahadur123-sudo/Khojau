import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

export default function CategoryGrid({ limit }: { limit?: number }) {
  const list = limit ? CATEGORIES.slice(0, limit) : CATEGORIES;
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-label="Service categories">
      {list.map((c) => (
        <li key={c.slug}>
          <Link
            href={`/services/${c.slug}`}
            className="flex h-full flex-col gap-1 rounded-xl border border-black/10 bg-[#FFFDF8] p-4 hover:border-[#0B7168]"
          >
            <span aria-hidden className="text-2xl">{c.icon}</span>
            <span className="font-semibold">{c.name}</span>
            {c.description && <span className="text-xs text-[#66706E]">{c.description}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
