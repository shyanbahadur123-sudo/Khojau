import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase-server";
import { isAdminEmail } from "@/lib/supabase";

export const metadata = { title: "Account", alternates: { canonical: "/account" } };

// Personal account hub: identity, security, and shortcuts to member areas.
// Everything shown comes from the caller's own session — nothing internal.
export default async function AccountPage() {
  const sb = supabaseServer();
  if (!sb) redirect("/login");
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const memberSince = user.created_at ? new Date(user.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : null;
  const shortcuts = [
    { href: "/dashboard", title: "My listings", desc: "Manage your businesses, services, hours and photos." },
    { href: "/saved", title: "Saved providers", desc: "Providers you kept for later." },
    { href: "/requests", title: "My requests", desc: "Track your service requests and their status." },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6 pt-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7A5C00]">Account</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Your account</h1>
      </div>

      <section aria-labelledby="profile" className="rounded-2xl border border-black/10 bg-[#FFFFFF] p-6 shadow-sm">
        <h2 id="profile" className="font-bold">Profile</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-2">
            <dt className="text-[#6B7280]">Email</dt>
            <dd className="min-w-0 truncate font-semibold">{user.email}</dd>
          </div>
          {memberSince && (
            <div className="flex items-center justify-between gap-2">
              <dt className="text-[#6B7280]">Member since</dt>
              <dd className="font-semibold">{memberSince}</dd>
            </div>
          )}
          {isAdminEmail(user.email) && (
            <div className="flex items-center justify-between gap-2">
              <dt className="text-[#6B7280]">Role</dt>
              <dd className="font-semibold">Admin · <Link href="/admin" className="underline underline-offset-2">Open dashboard</Link></dd>
            </div>
          )}
        </dl>
      </section>

      <section aria-labelledby="shortcuts" className="rounded-2xl border border-black/10 bg-[#FFFFFF] p-6 shadow-sm">
        <h2 id="shortcuts" className="font-bold">Your areas</h2>
        <ul className="mt-3 divide-y divide-black/10">
          {shortcuts.map((s) => (
            <li key={s.href}>
              <Link href={s.href} className="flex items-center justify-between gap-2 py-3">
                <span>
                  <span className="block font-semibold">{s.title}</span>
                  <span className="block text-sm text-[#6B7280]">{s.desc}</span>
                </span>
                <span aria-hidden="true" className="text-[#6B7280]">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="security" className="rounded-2xl border border-black/10 bg-[#FFFFFF] p-6 shadow-sm">
        <h2 id="security" className="font-bold">Security</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/forgot-password" className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold transition-colors hover:bg-black/5">
            Reset password
          </Link>
          <form action="/api/auth/signout" method="post">
            <button className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold transition-colors hover:bg-black/5">
              Sign out
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
