"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { apiClient } from "@/lib/api-client";
import { getIndustryBySlug, products as mockProducts } from "@/lib/site-data";
import { CircleAlert } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";

export function IndustryDetailClient({ params }: { params: { slug: string } }) {
  const [products, setProducts] = useState<any[]>([]);
  const [industry, setIndustry] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [prodRes, indRes] = await Promise.all([
          apiClient.get(`/public/products?industry=${params.slug}&limit=100`),
          apiClient.get("/public/industries"),
        ]);

        const inds = indRes.data.data || [];
        const foundInd = inds.find((i: any) => i.slug === params.slug);
        setIndustry(foundInd);

        const prods = prodRes.data.data || [];
        setProducts(prods);
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
      <div className="my-6 space-y-6">
        {industry?.imageUrl && (
          <div className="relative w-full h-48 sm:h-64 rounded-3xl overflow-hidden bg-slate-100 border border-slate-200">
            <img src={industry.imageUrl} alt={industryName} className="h-full w-full object-cover" />
          </div>
        )}
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
            {products.map((prod) => (
              <ProductCard
                key={prod.slug || prod.id}
                prod={prod}
              />
            ))}
          </div>
        )}
      </div>
    </SiteShell>
  );
}
