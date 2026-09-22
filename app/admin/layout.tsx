import AdminNav from "@/components/AdminNav";
import { getAdminStatus } from "@/lib/admin";

// Distinct admin shell: section nav with active state + quick exits to the
// personal dashboard and the public site. Pages keep their own gates
// (defense in depth); the nav only renders for verified admins.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const status = await getAdminStatus();
  return (
    <div>
      {status.ok && (
        <div className="rounded-2xl border border-black/10 bg-[#FFFFFF] px-4 pb-4 shadow-sm">
          <p className="px-2 pt-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#7A5C00]">
            Administration · {status.ctx.email}
          </p>
          <AdminNav />
        </div>
      )}
      {children}
    </div>
  );
}
