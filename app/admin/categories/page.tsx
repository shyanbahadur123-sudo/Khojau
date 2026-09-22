import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin";
import { CATEGORIES } from "@/lib/categories";

export const metadata = { title: "Admin — Categories" };

export default async function AdminCategoriesPage() {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/login");
  const admin = ctx.admin;
  const { data } = await admin.from("categories").select("name,slug");
  const inDb = new Set((data ?? []).map((c: { slug: string }) => c.slug));

  return (
    <div className="space-y-4 pt-6">
      <h1 className="text-2xl font-bold">Categories</h1>
      <p className="text-sm text-[#66706E]">Canonical list has 22 categories. Run the seed in supabase/migrations/0001_init.sql to sync the DB.</p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {CATEGORIES.map((c) => (
          <li key={c.slug} className="flex items-center justify-between rounded-xl bg-[#FFFDF8] p-3 text-sm">
            <span><span aria-hidden>{c.icon} </span><strong>{c.name}</strong> <code className="text-[#66706E]">{c.slug}</code></span>
            <span className={inDb.has(c.slug) ? "text-[#0B7168]" : "text-amber-700"}>{inDb.has(c.slug) ? "in DB" : "missing"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
