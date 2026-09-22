import Link from "next/link";
export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-[#6B7280]">Try searching for a service instead.</p>
      <Link href="/" className="mt-4 inline-block rounded-lg bg-[#111111] px-5 py-3 font-semibold text-white">Back home</Link>
    </div>
  );
}
