import { NextResponse } from "next/server";
import { getAdminStatus } from "@/lib/admin";

// Returns only the CALLER's own admin flag — no emails, keys, or lists leak.
// Lets the login form land admins in /admin and members on the app home.
export async function GET() {
  const status = await getAdminStatus();
  return NextResponse.json({ admin: status.ok });
}
