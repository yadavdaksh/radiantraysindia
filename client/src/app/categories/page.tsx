import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Layers, Tag } from "lucide-react";
import { categories as mockCategories } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Cleanroom Equipment Categories | Radiant Rays Pvt. Ltd.",
  description: "Explore cleanroom equipment categories — biosafety cabinets, laminar airflow units, pass boxes, air showers, modular furniture and more from Radiant Rays Pvt. Ltd..",
  alternates: { canonical: "https://radiantraysindia.com/categories" },
  openGraph: {
    title: "Cleanroom Equipment Categories | Radiant Rays Pvt. Ltd.",
    description: "Browse all cleanroom equipment categories from Radiant Rays — ISO 9001:2015 certified manufacturer.",
    url: "https://radiantraysindia.com/categories",
    type: "website",
    siteName: "Radiant Rays Pvt. Ltd.",
    images: [{ url: "https://radiantraysindia.com/logo.jpeg", width: 2024, height: 777, alt: "Radiant Rays Pvt. Ltd." }],
  },
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

async function getCategories() {
  try {
    const res = await fetch(`${API_URL}/public/categories`, { cache: "no-store" });
    if (!res.ok) throw new Error("failed");
    const json = await res.json();
    return json.data as any[];
  } catch {
    return mockCategories.map((c) => ({
      id: c.slug, name: c.name, slug: c.slug,
      description: c.summary, subCategories: [],
    }));
  }
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-8 my-6">
      {/* Header */}
      <div className="space-y-2">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-brand">Browse by Category</span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Product Categories</h1>
        <p className="text-sm text-slate-500 max-w-xl">
          Cleanroom equipment groupings designed for product discovery. Select a category to filter products and subcategories.
        </p>
      </div>

      {/* Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat: any) => (
          <Link
            key={cat.slug}
            href={`/categories/${cat.slug}`}
            className="group relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-xl hover:border-brand/25 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col"
          >
            {/* Accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand to-brand-dark opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

            <div className="flex items-start gap-4 mb-4">
              <div className="h-11 w-11 shrink-0 rounded-2xl bg-brand/10 flex items-center justify-center group-hover:bg-brand/15 overflow-hidden transition">
                {cat.imageUrl ? (
                  <img src={cat.imageUrl} alt={cat.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                ) : (
                  <Layers className="h-5 w-5 text-brand" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-extrabold text-slate-950 text-base group-hover:text-brand transition leading-tight">
                  {cat.name}
                </h2>
                {cat.subCategories?.length > 0 && (
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {cat.subCategories.length} sub-categor{cat.subCategories.length === 1 ? "y" : "ies"}
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed flex-1">
              {cat.description || cat.summary || "Browse all cleanroom systems in this category."}
            </p>

            {/* Subcategory pills */}
            {cat.subCategories?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {cat.subCategories.slice(0, 5).map((sub: any) => (
                  <span
                    key={sub.id || sub.slug}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 text-[9px] font-bold px-2.5 py-1 group-hover:bg-brand/8 group-hover:text-brand transition"
                  >
                    <Tag className="h-2.5 w-2.5" />
                    {sub.name}
                  </span>
                ))}
                {cat.subCategories.length > 5 && (
                  <span className="text-[9px] font-bold text-slate-400 px-2 py-1">
                    +{cat.subCategories.length - 5} more
                  </span>
                )}
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">
                {cat.productLinks?.length
                  ? `${cat.productLinks.length} product${cat.productLinks.length !== 1 ? "s" : ""}`
                  : "View products"}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-brand">
                Browse <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* CTA strip */}
      <div className="rounded-2xl bg-brand/5 border border-brand/15 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-bold text-slate-900 text-sm">Can't find what you need?</p>
          <p className="text-xs text-slate-500 mt-0.5">Browse the full catalog or submit a custom specification request.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/products" className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-dark transition">
            All Products <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link href="/contact" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 hover:border-brand hover:text-brand transition">
            Custom Quote
          </Link>
        </div>
      </div>
    </div>
  );
}
