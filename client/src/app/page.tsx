import Link from "next/link";
import { ArrowRight, PhoneCall, CheckCircle2, Zap, Globe } from "lucide-react";
import { products as mockProducts, categories as mockCategories, industries as mockIndustries, testimonials as mockTestimonials, gallery as mockGallery } from "@/lib/site-data";
import HeroCarousel from "@/components/HeroCarousel";
import FeaturedProducts from "@/components/FeaturedProducts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4002/api/v1";

async function getHomeData() {
  try {
    const res = await fetch(`${API_URL}/public/home`, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("API response error");
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.warn("Home API unavailable, using fallbacks:", error instanceof Error ? error.message : "Unknown error");
    return {
      featuredProducts: mockProducts.slice(0, 4),
      categories: mockCategories,
      industries: mockIndustries,
      testimonials: mockTestimonials,
      gallery: mockGallery,
      banners: [],
    };
  }
}

export const metadata = {
  title: "Precision Cleanroom Equipment & Containment Systems",
  description: "Radiant Rays manufactures ISO-compliant biosafety cabinets, laminar air flow workstations, pass boxes, air showers, and cleanroom modular furniture.",
};

const TRUST_BADGES = [
  { icon: CheckCircle2, label: "ISO 9001:2015 Certified" },
  { icon: Zap, label: "15+ Years Experience" },
  { icon: Globe, label: "Pan-India Delivery" },
  { icon: CheckCircle2, label: "500+ Facilities Served" },
];

export default async function Home() {
  const data = await getHomeData();
  const { featuredProducts = [], categories = [], industries = [], testimonials = [], gallery = [], banners = [] } = data;

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Radiant Rays",
    url: "https://radiantraysindia.com",
    logo: "https://radiantraysindia.com/logo.png",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-98765-43210",
      contactType: "sales",
      email: "sales@radiantraysindia.com",
      areaServed: "IN",
    },
  };

  return (
    <main className="min-h-screen overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />

      {/* ── Hero ── */}
      <HeroCarousel banners={banners} />

      {/* ── Trust strip ── */}
      <div className="bg-brand/5 border-y border-brand/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center sm:justify-between divide-y sm:divide-y-0 sm:divide-x divide-brand/10">
            {TRUST_BADGES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 px-5 py-3.5 text-xs font-bold text-brand/80">
                <Icon className="h-4 w-4 text-brand shrink-0" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Categories ── */}
      {categories.length > 0 && (
        <section className="bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-brand">Product Ranges</span>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                  Cleanroom Equipment & Furniture
                </h2>
              </div>
              <Link href="/products" className="text-xs font-bold text-brand hover:underline inline-flex items-center gap-1 shrink-0">
                All Products <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((cat: any) => (
                <Link
                  key={cat.slug}
                  href={`/products?category=${cat.slug}`}
                  className="group rounded-2xl border border-slate-100 bg-slate-50/60 p-5 shadow-sm transition-all hover:bg-white hover:border-brand/25 hover:shadow-lg hover:-translate-y-0.5 duration-200"
                >

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand leading-snug">
                    {cat.name}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {cat.summary || cat.description || "View specifications and variant options."}
                  </p>
                  <span className="mt-3 inline-flex items-center text-[10px] font-bold text-brand gap-0.5">
                    Browse <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Featured Products ── */}
      {featuredProducts.length > 0 && (
        <section className="bg-slate-50 py-12 sm:py-16 border-t border-slate-200/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-brand">Featured Products</span>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                  Ready for Quotation & Purchase
                </h2>
              </div>
              <Link href="/products" className="text-xs font-bold text-brand hover:underline inline-flex items-center gap-1 shrink-0">
                Full Catalog <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <FeaturedProducts products={featuredProducts} />
          </div>
        </section>
      )}

      {/* ── Industries ── */}
      {industries.length > 0 && (
        <section className="bg-white py-12 sm:py-16 border-t border-slate-200/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-1 mb-8">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-brand">Sectors Served</span>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Compliance-Driven Industrial Environments
              </h2>
              <p className="text-xs text-slate-500 max-w-xl">
                Components engineered for ISO Class 1–9 cleanroom classifications.
              </p>
            </div>

            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              {industries.map((ind: any) => (
                <Link
                  key={ind.slug}
                  href={`/products?industry=${ind.slug}`}
                  className="group flex flex-col items-center justify-center text-center p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-brand/20 hover:shadow-md duration-200"
                >

                  <span className="text-xs font-bold text-slate-800 group-hover:text-brand line-clamp-2 leading-tight">
                    {ind.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Testimonials ── */}
      {testimonials.length > 0 && (
        <section className="bg-slate-50 py-12 sm:py-16 border-t border-slate-200/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-1 mb-8">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-brand">Testimonials</span>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Trusted by Facility Managers & Labs
              </h2>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t: any, i: number) => (
                <div key={i} className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex gap-0.5 mb-3">
                      {[...Array(t.rating || 5)].map((_, s) => (
                        <span key={s} className="text-amber-400 text-xs">★</span>
                      ))}
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed italic">"{t.quote}"</p>
                  </div>
                  <div className="mt-4 flex items-center gap-3 pt-4 border-t border-slate-100">
                    <div className="h-9 w-9 rounded-full bg-brand/10 flex items-center justify-center font-extrabold text-xs text-brand shrink-0">
                      {t.name?.[0] || "?"}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{t.name}</p>
                      <p className="text-[10px] text-slate-500">{t.designation ? `${t.designation} · ` : ""}{t.company}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Gallery ── */}
      {gallery.length > 0 && (
        <section className="bg-white py-12 sm:py-16 border-t border-slate-200/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-1 mb-8">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-brand">Gallery</span>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Project Deliveries & Floor Deployments
              </h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((g: any, i: number) => (
                <div key={i} className="group rounded-2xl border border-slate-100 bg-slate-50 overflow-hidden shadow-sm hover:shadow-lg duration-200 transition-all">
                  {g.imageUrl ? (
                    <img src={g.imageUrl} alt={g.title} className="w-full h-44 object-cover group-hover:scale-105 transition duration-300" />
                  ) : (
                    <div className="h-44 bg-gradient-to-br from-brand/12 to-slate-200/60 flex items-center justify-center">
                      <span className="text-xs font-bold text-brand/60">{g.category || "Installation"}</span>
                    </div>
                  )}
                  <div className="p-4">
                    <p className="text-xs font-extrabold uppercase tracking-wide text-brand/70">{g.category}</p>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">{g.title}</h4>
                    {g.description && <p className="mt-1 text-xs text-slate-500 line-clamp-2">{g.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Founders teaser ── */}
      <section className="bg-white py-12 sm:py-16 border-t border-slate-200/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-brand">Leadership</span>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Meet the Founders</h2>
            </div>
            <Link href="/about" className="text-xs font-bold text-brand hover:underline inline-flex items-center gap-1 shrink-0">
              Full story <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 max-w-3xl">
            {[
              {
                name: "Shiwakshi Singh",
                title: "Co-Founder & Director",
                desc: "Leads business development, client relations, and quality assurance. Expert in GMP and ISO cleanroom standards.",
                initial: "S",
              },
              {
                name: "Daksh Yadav",
                title: "Co-Founder & Technical Director",
                desc: "Heads product engineering and manufacturing. Expert in HEPA filtration, SS fabrication, and cleanroom system design.",
                initial: "D",
              },
            ].map((f) => (
              <Link
                key={f.name}
                href="/about"
                className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-brand/25 transition-all duration-200"
              >
                <div className="h-14 w-14 shrink-0 rounded-2xl bg-brand/10 border border-brand/15 flex items-center justify-center">
                  <span className="text-2xl font-extrabold text-brand">{f.initial}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold text-slate-950 group-hover:text-brand transition">{f.name}</p>
                  <p className="text-[10px] font-bold text-brand uppercase tracking-wider mt-0.5">{f.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed mt-2 line-clamp-2">{f.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── B2B CTA ── */}
      <section className="bg-slate-50 py-12 sm:py-16 border-t border-slate-200/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-8 py-12 shadow-2xl">
            {/* Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(3,95,150,0.35),transparent_65%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(3,95,150,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(3,95,150,0.04)_1px,transparent_1px)] bg-[size:40px_40px]" />
            <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
              <div className="space-y-3">
                <span className="inline-block text-[10px] font-extrabold uppercase tracking-[0.35em] text-brand-light bg-brand/15 px-3 py-1 rounded-full">
                  Custom Engineering
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                  Need Custom Technical Specifications?
                </h2>
                <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
                  We engineer custom sizes, sash integrations, HEPA filter options, and materials (SS 304 / 316) to match your GMP audit specifications.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-full bg-brand px-7 py-3.5 text-sm font-bold text-white transition hover:bg-brand-dark shadow-lg shadow-brand/20 hover:-translate-y-0.5 duration-200"
                >
                  <PhoneCall className="mr-2 h-4 w-4" /> Speak to an Engineer
                </Link>
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-transparent px-7 py-3.5 text-sm font-bold text-slate-300 transition hover:border-brand hover:text-brand duration-200"
                >
                  Browse Catalog
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
