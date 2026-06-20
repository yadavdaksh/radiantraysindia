"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { apiClient } from "@/lib/api-client";
import { products as mockProducts } from "@/lib/site-data";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await apiClient.get("/public/products");
        const allProds = res.data.data;
        const filtered = allProds.filter((p: any) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          (p.shortDescription || "").toLowerCase().includes(query.toLowerCase()) ||
          (p.sku || "").toLowerCase().includes(query.toLowerCase())
        );
        setProducts(filtered);
      } catch {
        const filteredMock = mockProducts.filter((p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.summary.toLowerCase().includes(query.toLowerCase())
        );
        setProducts(filteredMock.map((p) => ({
          name: p.name,
          slug: p.slug,
          productType: p.type,
          shortDescription: p.summary,
          basePrice: p.type === "B2C" ? 12500 : null,
        })));
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
    <SiteShell title="Search Results" subtitle={`Results for "${query}"`}>
      <div className="my-6">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-pulse">
            {[1, 2, 3].map((i) => <div key={i} className="bg-slate-200 h-64 rounded-2xl" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-slate-200 bg-white rounded-2xl">
            <Search className="h-8 w-8 text-slate-400 mb-4" />
            <h3 className="text-base font-bold text-slate-900">No Match Found</h3>
            <p className="text-xs text-slate-500 mt-2">
              We couldn't find anything matching your query. Check spelling or try different terms.
            </p>
            <Link href="/products" className="mt-6 rounded-xl bg-brand px-6 py-2.5 text-xs font-semibold text-white">
              Browse All Products
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((prod) => (
              <ProductCard key={prod.slug || prod.id} prod={prod} />
            ))}
          </div>
        )}
      </div>
    </SiteShell>
  );
}
