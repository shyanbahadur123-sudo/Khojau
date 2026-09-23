// Single canonical admin-email list (§37: previously parsed in two places).
// Pure and dependency-free so middleware (edge) and server code share it.
export function adminEmails(envValue: string | undefined): string[] {
  return (envValue ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmailAddr(email: string | null | undefined, envValue: string | undefined): boolean {
  if (!email) return false;
  return adminEmails(envValue).includes(email.toLowerCase());
}
