"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { getCategoryBySlug, products as mockProducts } from "@/lib/site-data";
import { ProductCard } from "@/components/ProductCard";
import { useWishlist } from "@/contexts/wishlist-context";
import { ChevronRight, CircleAlert, Layers, Tag, ArrowRight } from "lucide-react";

export default function CategoryDetailPage({ params }: { params: { slug: string } }) {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const searchParams = useSearchParams();

  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [category, setCategory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSubSlug, setActiveSubSlug] = useState<string>("all");

  useEffect(() => {
    setActiveSubSlug(searchParams.get("sub") || "all");
  }, [searchParams]);

  useEffect(() => {
    async function load() {
      try {
        const [prodRes, catRes] = await Promise.all([
          apiClient.get(`/public/products?category=${params.slug}&limit=50`),
          apiClient.get("/public/categories"),
        ]);

        const cats: any[] = catRes.data.data || [];
        const foundCat = cats.find((c: any) => c.slug === params.slug);
        setCategory(foundCat || null);

        const prods: any[] = prodRes.data.data || [];
        setAllProducts(prods);
      } catch {
        const mockCat = getCategoryBySlug(params.slug);
        setCategory(mockCat ? { ...mockCat, id: mockCat.slug, subCategories: [] } : null);
        const mapped = mockProducts
          .filter((p) => p.category.toLowerCase().replace(/ /g, "-") === params.slug)
          .map((p) => ({
            id: p.slug, name: p.name, slug: p.slug,
            productType: p.type, shortDescription: p.summary,
            basePrice: p.type === "B2C" ? 12500 : null,
            categories: [{ category: { name: mockCat?.name || "", slug: params.slug } }],
            images: [],
          }));
        setAllProducts(mapped);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.slug]);

  const subCategories: any[] = category?.subCategories || [];

  const displayedProducts =
    activeSubSlug === "all"
      ? allProducts
      : allProducts.filter((p: any) =>
          p.subCategories?.some(
            (sc: any) => sc.subCategory?.slug === activeSubSlug || sc.subCategoryId === activeSubSlug
          )
        );

  const categoryName = category?.name || params.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const categoryDesc = category?.description || `Browse cleanroom systems in ${categoryName}.`;

  if (loading) {
    return (
      <div className="space-y-6 my-6 animate-pulse">
        <div className="h-4 bg-slate-100 rounded w-48" />
        <div className="h-8 bg-slate-100 rounded w-72" />
        <div className="flex gap-2">
          {[1,2,3].map((i) => <div key={i} className="h-7 bg-slate-100 rounded-full w-24" />)}
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="rounded-2xl bg-slate-100 overflow-hidden">
              <div className="h-48 bg-slate-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded" />
                <div className="h-3 bg-slate-200 rounded w-5/6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 my-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        <Link href="/" className="hover:text-brand transition">Home</Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <Link href="/categories" className="hover:text-brand transition">Categories</Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <span className="text-slate-800 font-bold">{categoryName}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-brand/10 flex items-center justify-center">
              <Layers className="h-4.5 w-4.5 text-brand" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-brand">Category</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">{categoryName}</h1>
          <p className="text-sm text-slate-500 max-w-xl">{categoryDesc}</p>
        </div>
        <div className="shrink-0 text-xs text-slate-400 font-medium">
          {displayedProducts.length} product{displayedProducts.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Subcategory filter chips */}
      {subCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSubSlug("all")}
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition ${
              activeSubSlug === "all"
                ? "bg-brand text-white border-brand shadow-sm"
                : "bg-white border-slate-200 text-slate-600 hover:border-brand/40 hover:text-brand"
            }`}
          >
            All Products
            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${activeSubSlug === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
              {allProducts.length}
            </span>
          </button>
          {subCategories.map((sub: any) => {
            const count = allProducts.filter((p: any) =>
              p.subCategories?.some((sc: any) => sc.subCategory?.slug === sub.slug || sc.subCategoryId === sub.id)
            ).length;
            const active = activeSubSlug === sub.slug;
            return (
              <button
                key={sub.id || sub.slug}
                onClick={() => setActiveSubSlug(sub.slug)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition ${
                  active
                    ? "bg-brand text-white border-brand shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:border-brand/40 hover:text-brand"
                }`}
              >
                <Tag className="h-3 w-3" />
                {sub.name}
                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Products grid */}
      {displayedProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-14 border border-dashed border-slate-200 bg-white rounded-2xl">
          <CircleAlert className="h-9 w-9 text-slate-300 mb-4" />
          <h3 className="text-base font-bold text-slate-900">No Products Found</h3>
          <p className="text-xs text-slate-500 mt-2 max-w-xs">
            {activeSubSlug !== "all"
              ? "No products in this sub-category. Try 'All Products' above."
              : "No products in this category yet."}
          </p>
          <Link href="/products" className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-dark transition">
            Browse Full Catalog <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {displayedProducts.map((prod: any) => (
            <ProductCard
              key={prod.slug || prod.id}
              prod={prod}
              isInWishlist={isInWishlist}
              toggleWishlist={toggleWishlist}
            />
          ))}
        </div>
      )}

      {/* Related categories */}
      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 space-y-3">
        <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Browse Other Categories</p>
        <div className="flex flex-wrap gap-2">
          <Link href="/categories" className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:border-brand hover:text-brand transition">
            <Layers className="h-3.5 w-3.5" /> All Categories
          </Link>
          <Link href="/products" className="inline-flex items-center gap-1 rounded-full bg-brand/10 border border-brand/20 px-4 py-2 text-xs font-bold text-brand hover:bg-brand hover:text-white transition">
            Full Catalog <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
