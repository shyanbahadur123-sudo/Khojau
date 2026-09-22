export const metadata = { title: "Contact", alternates: { canonical: "/contact" } };
export default function ContactPage() {
  return (
    <div className="max-w-2xl space-y-4 pt-6">
      <h1 className="text-2xl font-bold">Contact Khojau</h1>
      <p className="text-[15px] text-[#66706E]">For listing help, corrections, removals, or advertising (Featured Rs.299/mo, Premium Rs.499–999/mo).</p>
      <div className="rounded-2xl bg-[#FFFDF8] p-6 text-[15px]">
        <p><strong>Email:</strong> hello@khojau.com</p>
        <p className="mt-1"><strong>Hours:</strong> Sun–Fri, 10am–6pm NPT</p>
        <p className="mt-1 text-sm text-[#66706E]">Payments are manual for the MVP — contact us and the admin activates Featured/Premium after verification.</p>
      </div>
    </div>
  );
}
