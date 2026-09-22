"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser, isSupabaseConfigured } from "@/lib/supabase";

function useSession(): boolean | null {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setSignedIn(false);
      return;
    }
    const sb = supabaseBrowser();
    sb.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user)));
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)));
    return () => sub.subscription.unsubscribe();
  }, []);
  return signedIn;
}

// Desktop nav slot: neutral skeleton while resolving (never flashes the
// wrong action), then Dashboard for members, Log in for guests.
export function AuthNavLink() {
  const signedIn = useSession();
  if (signedIn === null) {
    return <span aria-hidden="true" className="hidden h-10 w-[76px] animate-pulse rounded-md bg-black/5 sm:block" />;
  }
  return signedIn ? (
    <Link href="/dashboard" className="hidden rounded-md px-3 py-2 hover:bg-black/5 sm:inline">
      Dashboard
    </Link>
  ) : (
    <Link href="/login" className="hidden rounded-md px-3 py-2 hover:bg-black/5 sm:inline">
      Log in
    </Link>
  );
}

// Mobile menu items: Dashboard + working Sign out for members, Log in for guests.
export function AuthMenuItems({ onNavigate }: { onNavigate: () => void }) {
  const router = useRouter();
  const signedIn = useSession();

  async function signOut() {
    try {
      await supabaseBrowser().auth.signOut();
    } finally {
      onNavigate();
      router.push("/");
      router.refresh();
    }
  }

  if (signedIn === null) {
    return (
      <li aria-hidden="true">
        <span className="block h-[42px] animate-pulse rounded-lg bg-black/5" />
      </li>
    );
  }
  if (!signedIn) {
    return (
      <li>
        <Link onClick={onNavigate} href="/login" className="block rounded-lg px-3 py-2.5 hover:bg-black/5">
          Log in
        </Link>
      </li>
    );
  }
  return (
    <>
      <li>
        <Link onClick={onNavigate} href="/dashboard" className="block rounded-lg px-3 py-2.5 hover:bg-black/5">
          Dashboard
        </Link>
      </li>
      <li>
        <button onClick={() => void signOut()} className="w-full rounded-lg px-3 py-2.5 text-left hover:bg-black/5">
          Sign out
        </button>
      </li>
    </>
  );
}
