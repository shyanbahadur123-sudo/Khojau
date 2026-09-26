import Link from "next/link";
export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Page not found</h1>
      <p className="mt-2 text-[#6B7280]">Try searching for a service instead.</p>
      <Link href="/" className="mt-4 inline-block rounded-full bg-[#C9A227] px-5 py-3 font-semibold text-black">Back home</Link>
    </div>
  );
}
