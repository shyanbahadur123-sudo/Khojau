import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin";
import { CATEGORIES } from "@/lib/categories";
import CategoryIcon from "@/components/CategoryIcon";

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
      <p className="text-sm text-[#6B7280]">Canonical list has 22 categories. Run the seed in supabase/migrations/0001_init.sql to sync the DB.</p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {CATEGORIES.map((c) => (
          <li key={c.slug} className="flex items-center justify-between rounded-xl bg-[#FFFFFF] p-3 text-sm">
            <span className="flex items-center gap-2"><CategoryIcon slug={c.slug} className="h-4 w-4 text-[#111111]" /><strong>{c.name}</strong> <code className="text-[#6B7280]">{c.slug}</code></span>
            <span className={inDb.has(c.slug) ? "text-[#111111]" : "text-amber-700"}>{inDb.has(c.slug) ? "in DB" : "missing"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
