import Link from "next/link";

// Shown instead of silently bouncing to /login when an admin page is
// unreachable for a signed-in visitor. Three distinct, honest states:
// signed-in-but-not-admin (fail-closed 403) vs server key missing (setup
// guide). Never prints secrets or internal config values.
export default function AdminNotice({
  reason,
  email,
}: {
  reason: "forbidden" | "unconfigured";
  email?: string;
}) {
  return (
    <div className="mx-auto max-w-xl pt-6">
      <div className="rounded-2xl border border-black/10 bg-[#FFFFFF] p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7A5C00]">Admin</p>
        {reason === "forbidden" ? (
          <>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">Admin access required</h1>
            <p className="mt-2 text-sm text-[#6B7280]">
              {email ? (
                <>You are signed in as <strong className="text-[#0A0A0A]">{email}</strong>, which is not an admin account. </>
              ) : (
                <>This account is not an admin account. </>
              )}
              Moderation stays locked rather than failing open. If you run Khojau, add this email to <code>ADMIN_EMAILS</code>.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/dashboard" className="rounded-lg bg-[#C9A227] px-4 py-2 text-sm font-semibold text-black">
                Back to dashboard
              </Link>
              <Link href="/" className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold">
                Home
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">Admin is not configured yet</h1>
            <p className="mt-2 text-sm text-[#6B7280]">
              The moderation dashboard needs two server settings before anyone{email ? <> (including <strong className="text-[#0A0A0A]">{email}</strong>)</> : ""} can approve
              listings. Nothing is broken — nothing can be approved until setup is done.
            </p>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
              <li>
                In Supabase: project <strong>Settings → API</strong>, copy the <code>service_role</code> key into{" "}
                <code>.env.local</code> as <code>SUPABASE_SERVICE_ROLE_KEY</code> (server-only, never commit it).
              </li>
              <li>
                In <code>.env.local</code>, set <code>ADMIN_EMAILS</code> to the owner&rsquo;s login email.
              </li>
              <li>Restart the server and open <code>/admin</code> signed in as that email.</li>
            </ol>
          </>
        )}
      </div>
    </div>
  );
}
