import { SiteShell } from "@/components/site-shell";

export const metadata = { title: "Privacy Policy — Radiant Rays" };

export default function PrivacyPolicyPage() {
  return (
    <SiteShell title="Privacy Policy" subtitle="Last updated: June 2025">
      <div className="prose prose-sm max-w-3xl text-slate-600 space-y-6 my-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-4">
          <h2 className="text-base font-bold text-slate-900">1. Information We Collect</h2>
          <p>We collect information you provide when placing orders, submitting B2B inquiries, or subscribing to our catalog updates. This includes name, email address, phone number, company name, and delivery address.</p>

          <h2 className="text-base font-bold text-slate-900">2. How We Use Your Information</h2>
          <p>Your information is used to process orders, respond to product inquiries, send technical quotations, and notify you of order status. We do not sell or share your personal data with third parties for marketing purposes.</p>

          <h2 className="text-base font-bold text-slate-900">3. Data Storage & Security</h2>
          <p>All data is stored securely on encrypted servers. Payment information is processed by Razorpay and is never stored on our servers.</p>

          <h2 className="text-base font-bold text-slate-900">4. Cookies</h2>
          <p>We use essential cookies for cart and session management. No third-party advertising cookies are used.</p>

          <h2 className="text-base font-bold text-slate-900">5. Contact</h2>
          <p>For privacy-related queries, contact us at <a href="mailto:info@radiantraysindia.com" className="text-brand font-semibold hover:underline">info@radiantraysindia.com</a></p>
        </section>
      </div>
    </SiteShell>
  );
}
