import { SiteShell } from "@/components/site-shell";

export const metadata = { title: "Refund & Returns Policy — Radiant Rays" };

export default function RefundPolicyPage() {
  return (
    <SiteShell title="Refund & Returns Policy" subtitle="Our commitment to quality means returns are rarely needed, but we've got you covered.">
      <div className="max-w-3xl text-slate-600 space-y-6 my-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-4 text-sm leading-relaxed">
          <h2 className="text-base font-bold text-slate-900">Eligibility for Returns</h2>
          <p>Returns are accepted within 7 days of delivery for B2C products if the item is damaged, defective, or significantly different from the listed specification. Custom-manufactured B2B equipment is not eligible for return unless defective.</p>

          <h2 className="text-base font-bold text-slate-900">Return Process</h2>
          <p>To initiate a return, email <a href="mailto:info@radiantraysindia.com" className="text-brand font-semibold hover:underline">info@radiantraysindia.com</a> with your order number, photographs of the issue, and a brief description. Our team will respond within 2 business days.</p>

          <h2 className="text-base font-bold text-slate-900">Refund Timeline</h2>
          <p>Once the return is approved and the item is received at our facility, refunds are processed within 5–7 business days to the original payment method.</p>

          <h2 className="text-base font-bold text-slate-900">Non-Returnable Items</h2>
          <ul className="list-disc ml-5 space-y-1">
            <li>Custom-engineered B2B equipment manufactured to buyer specifications</li>
            <li>Items with signs of use, installation, or modification</li>
            <li>Products where the original packaging has been damaged beyond normal opening</li>
          </ul>

          <h2 className="text-base font-bold text-slate-900">Damaged in Transit</h2>
          <p>If your product arrives visibly damaged, please refuse delivery and contact us immediately. We will arrange a replacement at no additional charge.</p>
        </section>
      </div>
    </SiteShell>
  );
}
