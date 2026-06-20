import { SiteShell } from "@/components/site-shell";

export const metadata = { title: "Terms & Conditions — Radiant Rays" };

export default function TermsPage() {
  return (
    <SiteShell title="Terms & Conditions" subtitle="Please read these terms carefully before placing an order.">
      <div className="max-w-3xl text-slate-600 space-y-6 my-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-4 text-sm leading-relaxed">
          <h2 className="text-base font-bold text-slate-900">1. Products & Specifications</h2>
          <p>All product specifications, dimensions, and technical parameters listed on this website are indicative. Custom orders are manufactured to buyer-provided specifications. Radiant Rays Pvt. Ltd. reserves the right to update product designs without prior notice.</p>

          <h2 className="text-base font-bold text-slate-900">2. Pricing</h2>
          <p>B2C prices are listed inclusive of product cost but exclusive of GST (18%) and shipping charges. B2B pricing is always on-request and subject to quotation validity.</p>

          <h2 className="text-base font-bold text-slate-900">3. Payment</h2>
          <p>100% advance payment is required for B2C orders. B2B orders may be subject to negotiated payment terms as per the purchase order agreement.</p>

          <h2 className="text-base font-bold text-slate-900">4. Order Cancellation</h2>
          <p>Orders may be cancelled before dispatch. Custom-manufactured B2B equipment cannot be cancelled once production has commenced.</p>

          <h2 className="text-base font-bold text-slate-900">5. Warranty</h2>
          <p>All products carry a 12-month warranty against manufacturing defects from the date of delivery. Warranty does not cover damage due to misuse, improper installation, or unauthorized modifications.</p>

          <h2 className="text-base font-bold text-slate-900">6. Governing Law</h2>
          <p>These terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in Gurugram, Haryana.</p>

          <h2 className="text-base font-bold text-slate-900">7. Contact</h2>
          <p>Questions? Email us at <a href="mailto:info@radiantraysindia.com" className="text-brand font-semibold hover:underline">info@radiantraysindia.com</a></p>
        </section>
      </div>
    </SiteShell>
  );
}
