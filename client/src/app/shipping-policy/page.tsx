import { SiteShell } from "@/components/site-shell";

export const metadata = { title: "Shipping Policy — Radiant Rays" };

export default function ShippingPolicyPage() {
  return (
    <SiteShell title="Shipping Policy" subtitle="Pan-India delivery for all cleanroom equipment and furniture.">
      <div className="max-w-3xl text-slate-600 space-y-6 my-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-4 text-sm leading-relaxed">
          <h2 className="text-base font-bold text-slate-900">Delivery Coverage</h2>
          <p>We ship across all states and union territories in India. Remote or restricted locations may require additional lead time.</p>

          <h2 className="text-base font-bold text-slate-900">Processing Time</h2>
          <p>B2C stainless steel modular furniture: 3–5 business days for dispatch. B2B industrial equipment (biosafety cabinets, LAF, pass boxes): 7–21 business days depending on specifications and customization requirements.</p>

          <h2 className="text-base font-bold text-slate-900">Shipping Partner</h2>
          <p>We use Shiprocket-integrated courier partners for B2C deliveries. B2B heavy equipment is shipped via dedicated freight and logistics partners with door-to-door delivery.</p>

          <h2 className="text-base font-bold text-slate-900">Shipping Charges</h2>
          <p>Shipping costs are calculated at checkout based on delivery location and product weight/dimensions. B2B freight costs are quoted separately as part of the purchase order.</p>

          <h2 className="text-base font-bold text-slate-900">Tracking</h2>
          <p>Once dispatched, you will receive a tracking number via email and SMS. You can track your order from the Account section on this website.</p>

          <h2 className="text-base font-bold text-slate-900">Installation Support</h2>
          <p>For B2B installations, our technical team can arrange on-site installation and commissioning support. Contact us at <a href="mailto:info@radiantraysindia.com" className="text-brand font-semibold hover:underline">info@radiantraysindia.com</a> to request this service.</p>
        </section>
      </div>
    </SiteShell>
  );
}
