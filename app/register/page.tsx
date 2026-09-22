import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";
export const metadata = { title: "Register" };
export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div aria-hidden="true" className="mx-auto mt-6 w-full max-w-md animate-pulse rounded-2xl border border-black/10 bg-[#FFFFFF] p-6 sm:p-8">
          <div className="h-7 w-44 rounded bg-black/5" />
          <div className="mt-4 h-12 rounded-lg bg-black/5" />
          <div className="mt-3 h-12 rounded-lg bg-black/5" />
          <div className="mt-3 h-12 rounded-lg bg-black/5" />
        </div>
      }
    >
      <AuthForm mode="register" />
    </Suspense>
  );
}
