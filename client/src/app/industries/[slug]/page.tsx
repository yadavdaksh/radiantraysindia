"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { apiClient } from "@/lib/api-client";
import { getIndustryBySlug, products as mockProducts } from "@/lib/site-data";
import { ArrowRight, Tag, CircleAlert, Sparkles, Heart } from "lucide-react";
import { useWishlist } from "@/contexts/wishlist-context";

export default function IndustryDetailPage({ params }: { params: { slug: string } }) {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [products, setProducts] = useState<any[]>([]);
  const [industry, setIndustry] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [prodRes, indRes] = await Promise.all([
          apiClient.get("/public/products"),
          apiClient.get("/public/industries"),
        ]);

        const inds = indRes.data.data;
        const foundInd = inds.find((i: any) => i.slug === params.slug);
        setIndustry(foundInd);

        const allProds = prodRes.data.data;
        const filtered = allProds.filter((p: any) =>
          p.industries?.some((ind: any) => ind.industry?.slug === params.slug || ind.industry?.id === foundInd?.id)
        );
        setProducts(filtered);
      } catch (error) {
        console.warn("Could not load industry products from API, using fallback:", error);
        const mockInd = getIndustryBySlug(params.slug);
        setIndustry(mockInd);

        // Filter products matching application keyword or industry tag
        const filteredMock = mockProducts.filter((p) =>
          p.applications.some((app) => app.toLowerCase().includes(params.slug.replace("-", " "))) ||
          p.category.toLowerCase().includes(params.slug.replace("-", " "))
        );

        // Map mock schema
        const mapped = filteredMock.map((p) => ({
          name: p.name,
          slug: p.slug,
          productType: p.type,
          shortDescription: p.summary,
          basePrice: p.type === "B2C" ? 12500 : null,
        }));
        setProducts(mapped);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [params.slug]);

  if (loading) {
    return (
      <SiteShell title="Loading Industry..." subtitle="Retrieving products.">
        <div className="animate-pulse space-y-6 my-8">
          <div className="h-6 bg-slate-200 rounded w-1/4" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-200 h-64 rounded-2xl" />
            ))}
          </div>
        </div>
      </SiteShell>
    );
  }

  const industryName = industry?.name || "Industry Solutions";
  const industryDesc = industry?.description || industry?.summary || `Specialized cleanroom contamination control systems for ${industryName} applications.`;

  return (
    <SiteShell title={`${industryName} cleanroom systems`} subtitle={industryDesc}>
      <div className="my-6">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-slate-200 bg-white rounded-2xl">
            <CircleAlert className="h-8 w-8 text-slate-400 mb-4" />
            <h3 className="text-base font-bold text-slate-900">No Custom Solutions Listed</h3>
            <p className="text-xs text-slate-500 mt-2">
              There are no products listed under this industry application at the moment.
            </p>
            <Link href="/products" className="mt-6 rounded-xl bg-brand px-6 py-2.5 text-xs font-semibold text-white">
              Back to Catalog
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((prod) => {
              const isB2C = prod.productType === "B2C";
              const price = Number(prod.basePrice || 0);

              return (
                <article
                  key={prod.slug}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-brand/20 duration-200 relative group"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        isB2C ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {isB2C ? "B2C" : "B2B"}
                      </span>

                      <button
                        onClick={() => toggleWishlist(prod.slug || prod.id)}
                        className="text-slate-400 hover:text-rose-600 transition"
                        aria-label="Toggle Wishlist"
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            isInWishlist(prod.slug || prod.id) ? "fill-rose-600 text-rose-600" : ""
                          }`}
                        />
                      </button>
                    </div>

                    <h3 className="mt-4 text-base font-bold text-slate-900 group-hover:text-brand transition duration-150">
                      {prod.name}
                    </h3>
                    <p className="mt-2 text-xs text-slate-500 line-clamp-3 leading-relaxed">
                      {prod.shortDescription || prod.summary || "High specification cleanroom systems."}
                    </p>
                  </div>

                  <div className="mt-6 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      {isB2C && price > 0 ? `₹${price.toLocaleString("en-IN")}` : "Price on Request"}
                    </span>
                    <Link
                      href={`/products/${prod.slug}`}
                      className="inline-flex items-center text-xs font-bold text-brand hover:underline"
                    >
                      View Details
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </SiteShell>
  );
}
