import { SiteShell } from "@/components/site-shell";

export const metadata = {
  title: "Contact",
  description: "Get in touch with Radiant Rays for quotes, support and product inquiries.",
};

export default function ContactPage() {
  return (
    <SiteShell
      title="Contact"
      subtitle="Request a quote, ask for technical details, or start a B2B procurement discussion."
    >
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-8">
          <h2 className="text-2xl font-semibold text-slate-950">Inquiry channels</h2>
          <div className="mt-6 space-y-4 text-slate-700">
            <p>Email: sales@radiantraysindia.com</p>
            <p>Phone: +91 00000 00000</p>
            <p>Office: Add your office address here</p>
            <p>Support: WhatsApp inquiry and lead management</p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(160deg,#ffffff,_#eef7fd)] p-8">
          <h2 className="text-2xl font-semibold text-slate-950">Send a message</h2>
          <form className="mt-6 grid gap-4">
            <input className="rounded-2xl border border-slate-300 px-4 py-3" placeholder="Name" />
            <input className="rounded-2xl border border-slate-300 px-4 py-3" placeholder="Email" type="email" />
            <input className="rounded-2xl border border-slate-300 px-4 py-3" placeholder="Phone" />
            <textarea className="min-h-36 rounded-2xl border border-slate-300 px-4 py-3" placeholder="Your requirement" />
            <button className="rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-white">
              Request Quote
            </button>
          </form>
        </section>
      </div>
    </SiteShell>
  );
}

