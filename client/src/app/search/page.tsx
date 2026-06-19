"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { apiClient } from "@/lib/api-client";
import { products as mockProducts } from "@/lib/site-data";
import { ArrowRight, Search, Heart } from "lucide-react";

const stripHtml = (h: string) => h ? h.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() : "";
import { useWishlist } from "@/contexts/wishlist-context";

export default function SearchResultsPage() {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await apiClient.get("/public/products");
        const allProds = res.data.data;

        // Filter based on search query
        const filtered = allProds.filter((p: any) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          (p.shortDescription || "").toLowerCase().includes(query.toLowerCase()) ||
          (p.sku || "").toLowerCase().includes(query.toLowerCase())
        );
        setProducts(filtered);
      } catch (error) {
        console.warn("Could not load products search from API, using fallback:", error);
        
        const filteredMock = mockProducts.filter((p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.summary.toLowerCase().includes(query.toLowerCase())
        );

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
    if (query) {
      loadData();
    } else {
      setProducts([]);
      setLoading(false);
    }
  }, [query]);

  return (
    <SiteShell title="Search Results" subtitle={`Displaying results for "${query}"`}>
      <div className="my-6">
        {loading ? (
          <div className="animate-pulse space-y-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-slate-200 h-64 rounded-2xl" />
              ))}
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-slate-200 bg-white rounded-2xl">
            <Search className="h-8 w-8 text-slate-400 mb-4" />
            <h3 className="text-base font-bold text-slate-900">No Match Found</h3>
            <p className="text-xs text-slate-500 mt-2">
              We couldn't find any cleanroom systems matching your query. Please check spelling or search terms.
            </p>
            <Link href="/products" className="mt-6 rounded-xl bg-brand px-6 py-2.5 text-xs font-semibold text-white">
              Browse All Products
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
                      {stripHtml(prod.shortDescription || prod.summary || "High specification cleanroom systems.")}
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
