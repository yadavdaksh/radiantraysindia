import Link from "next/link";
import {
  ArrowRight, Award, CheckCircle2, Factory, Globe,
  Mail, Phone, Target, Zap, Users, ExternalLink,
} from "lucide-react";

export const metadata = {
  title: "About Us — Radiant Rays",
  description: "Meet the founders and team behind Radiant Rays — precision cleanroom equipment manufacturers trusted by 500+ pharma and biotech facilities.",
};

const FOUNDERS = [
  {
    name: "Shiwakshi Singh",
    title: "Co-Founder & Director and Technical Director",
    initial: "S",
    image: "/images/founders/shiwakshi-singh.jpeg",
    bio: "Shiwakshi leads business development, client relations, and quality assurance at Radiant Rays. With deep understanding of GMP and ISO cleanroom standards, she has built strong partnerships with pharmaceutical manufacturers, biotech labs, and hospital facilities across India. Her vision drives the company's commitment to precision engineering and post-sale support.",
    expertise: ["GMP Compliance", "Client Strategy", "Quality Assurance", "ISO Standards"],
    email: "shiwakshi@radiantraysindia.com",
  },
  {
    name: "Daksh Yadav",
    title: "Co-Founder",
    initial: "D",
    image: "/images/founders/daksh.png",
    bio: "Daksh heads product engineering, R&D, and manufacturing operations. With hands-on expertise in cleanroom system design, HEPA filtration, SS fabrication, and logistics integration, he ensures every unit leaving the factory meets strict contamination control benchmarks. His engineering-first approach defines the technical edge of Radiant Rays products.",
    expertise: ["Cleanroom Engineering", "HEPA Filtration", "SS Fabrication", "Product R&D"],
    email: "daksh@radiantraysindia.com",
  },
];

const MILESTONES = [
  { year: "2009", label: "Founded", desc: "Company established in Noida with focus on cleanroom containment systems." },
  { year: "2013", label: "ISO Certified", desc: "Achieved ISO 9001 certification for manufacturing excellence." },
  { year: "2017", label: "500 Clients", desc: "Crossed 500 active facility partnerships across pharma, biotech, and hospital sectors." },
  { year: "2020", label: "B2C Launch", desc: "Launched direct e-commerce channel for stainless steel cleanroom furniture." },
  { year: "2023", label: "CE Certified", desc: "Received CE marking for biosafety cabinets and LAF workstations." },
  { year: "2024", label: "Pan-India", desc: "Expanded delivery network to all 28 states via Shiprocket logistics." },
];

const VALUES = [
  { icon: Target, title: "Precision First", desc: "Every dimension, weld, and filter tolerance is engineered to spec — not approximated." },
  { icon: Award, title: "Compliance Ready", desc: "Products comply with WHO GMP, ISO Class 1–9, and CE safety directives." },
  { icon: Zap, title: "Fast Turnaround", desc: "Standard configs ship in 7–14 days. Custom builds quoted within 24 hours." },
  { icon: Users, title: "Client-Led Design", desc: "Non-standard sizes, materials, and integrations welcomed. We build what you spec." },
  { icon: Factory, title: "Factory Direct", desc: "No middlemen. Direct pricing, technical warranty, and engineer support." },
  { icon: Globe, title: "Pan-India Reach", desc: "Delivery coverage across all 28 states with fully tracked shipments." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-slate-950 via-[#032a47] to-[#011424] text-white py-24 sm:py-32 relative overflow-hidden rounded-[2.5rem] border border-slate-800 mx-4 sm:mx-6 lg:mx-8 my-6">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "32px 32px" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(3,95,150,0.3),transparent_70%)]" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md px-5 py-2 text-xs font-bold uppercase tracking-widest text-brand-light shadow-md">
            <span className="h-2 w-2 rounded-full bg-brand animate-pulse" />
            Est. 2009 — Gurugram, India
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight max-w-4xl mx-auto">
            Engineering Cleaner, Safer<br />
            <span className="bg-gradient-to-r from-brand-light via-sky-300 to-white bg-clip-text text-transparent">Controlled Environments</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed">
            Radiant Rays manufactures high-specification, compliance-driven cleanroom equipment trusted by over 500+ pharmaceutical, biotechnology, and healthcare facilities nationwide.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link href="/products" className="inline-flex items-center gap-2 rounded-full bg-brand px-8 py-4 text-xs font-bold text-white hover:bg-brand-dark transition shadow-lg shadow-brand/20 hover:-translate-y-0.5 duration-200">
              Explore Products <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-full border border-slate-650 px-8 py-4 text-xs font-bold text-white hover:border-brand hover:text-brand transition hover:-translate-y-0.5 duration-200 bg-white/5 backdrop-blur-sm">
              Get in Touch
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <div className="bg-brand text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/20">
            {[
              { n: "15+", l: "Years Experience" },
              { n: "500+", l: "Facilities Served" },
              { n: "28", l: "States Delivered" },
              { n: "24h", l: "Quote Response" },
            ].map(({ n, l }) => (
              <div key={l} className="text-center py-6 px-4">
                <p className="text-3xl font-extrabold">{n}</p>
                <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider mt-1">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-20">

        {/* ── Founders ── */}
        <section className="space-y-10">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-brand">Leadership</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">Meet the Founders</h2>
            <p className="text-slate-500 text-sm max-w-xl mx-auto">
              Built from the ground up by engineers who understand cleanroom science — not just manufacturing.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {FOUNDERS.map((f) => (
              <div
                key={f.name}
                className="relative rounded-3xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand via-brand-dark to-transparent" />

                <div className="flex items-start gap-5">
                  <div className="shrink-0 h-20 w-20 rounded-2xl bg-gradient-to-br from-brand/20 to-brand/5 border border-brand/15 flex items-center justify-center overflow-hidden">
                    {f.image ? (
                      <img src={f.image} alt={f.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-3xl font-extrabold text-brand">{f.initial}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="text-xl font-extrabold text-slate-950">{f.name}</h3>
                    <p className="text-xs font-bold text-brand uppercase tracking-wider">{f.title}</p>
                    <div className="flex gap-2 pt-1.5">
                      <a
                        href={`mailto:${f.email}`}
                        className="h-7 w-7 flex items-center justify-center rounded-full bg-slate-100 hover:bg-brand hover:text-white text-slate-500 transition"
                        title={f.email}
                      >
                        <Mail className="h-3.5 w-3.5" />
                      </a>
                      <a
                        href="#"
                        className="h-7 w-7 flex items-center justify-center rounded-full bg-slate-100 hover:bg-[#0077b5] hover:text-white text-slate-500 transition"
                        title="LinkedIn"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </div>

                <p className="mt-5 text-sm text-slate-600 leading-relaxed">{f.bio}</p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {f.expertise.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-brand/8 text-brand text-[10px] font-bold px-3 py-1">
                      <CheckCircle2 className="h-3 w-3" /> {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Story + Timeline ── */}
        <section className="grid gap-12 lg:grid-cols-2 items-start">
          <div className="space-y-5">
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-brand">Our Story</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
                From a Workshop to<br />500+ Facilities Served
              </h2>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">
              Radiant Rays was founded in 2009 in Noida with a single mission — build cleanroom equipment that works exactly as specified, every time. What started as a small fabrication workshop grew into a full-scale ISO-certified manufacturing facility after early success supplying biosafety cabinets and laminar air flow workstations to Delhi-NCR pharmaceutical companies.
            </p>
            <p className="text-slate-600 text-sm leading-relaxed">
              Today we manufacture and deliver across all 28 Indian states, serving pharmaceutical manufacturers, biotech R&D centres, hospital operation theatres, electronics assembly plants, and food processing facilities that require clean, controlled working environments.
            </p>
            <Link href="/contact" className="inline-flex items-center gap-2 text-sm font-bold text-brand hover:underline">
              Work with us <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {MILESTONES.map((m, i) => (
              <div key={m.year} className="flex gap-4 items-start">
                <div className="shrink-0 flex flex-col items-center">
                  <div className="h-10 w-14 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center">
                    <span className="text-[10px] font-extrabold text-brand">{m.year}</span>
                  </div>
                  {i < MILESTONES.length - 1 && <div className="w-px h-5 bg-brand/15 mt-1" />}
                </div>
                <div className="pb-1 pt-2">
                  <p className="font-bold text-slate-900 text-sm">{m.label}</p>
                  <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Values ── */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-brand">Why Choose Us</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">What Sets Us Apart</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-brand/25 transition-all duration-200 space-y-3">
                <div className="h-10 w-10 rounded-2xl bg-brand/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-brand" />
                </div>
                <h3 className="font-extrabold text-slate-900">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Certifications ── */}
        <section className="rounded-3xl bg-slate-50 border border-slate-200 p-8 sm:p-10 space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-brand">Compliance</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950">Certifications & Standards</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { badge: "ISO", title: "ISO 9001:2015", desc: "Quality Management System — manufacturing and delivery processes." },
              { badge: "CE", title: "CE Marking", desc: "European conformity for biosafety cabinets and LAF workstations." },
              { badge: "GMP", title: "WHO GMP", desc: "Equipment designed to meet WHO GMP guidelines for pharma environments." },
              { badge: "ISO", title: "ISO Class 1–9", desc: "Products tested and verified for all cleanroom classification grades." },
            ].map((cert) => (
              <div key={cert.title} className="rounded-2xl bg-white border border-slate-200 p-5 space-y-2 shadow-sm">
                <span className="inline-block font-extrabold text-brand bg-brand/10 rounded-xl px-3 py-1 text-sm">{cert.badge}</span>
                <h4 className="font-bold text-slate-900 text-sm">{cert.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{cert.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="relative overflow-hidden rounded-3xl bg-slate-950 px-8 py-14 text-center shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(3,95,150,0.4),transparent_60%)]" />
          <div className="relative space-y-5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Ready to Specify Your Cleanroom?
            </h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              Talk to our engineers directly. We scope your requirements, suggest the right system, and quote within 24 hours.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link href="/contact" className="inline-flex items-center gap-2 rounded-full bg-brand px-8 py-3.5 text-sm font-bold text-white hover:bg-brand-dark transition shadow-lg shadow-brand/20">
                <Phone className="h-4 w-4" /> Contact Our Team
              </Link>
              <Link href="/products" className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-8 py-3.5 text-sm font-bold text-white hover:border-brand hover:text-brand transition">
                Browse Catalog <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
