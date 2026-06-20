"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { ProductCard } from "@/components/ProductCard";
import { apiClient } from "@/lib/api-client";
import { products as mockProducts, categories as mockCategories } from "@/lib/site-data";
import { Search, SlidersHorizontal, CircleAlert, X, ChevronDown } from "lucide-react";
import { expandToVariantCards } from "@/lib/variant-cards";

export default function ProductsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Read initial state from URL
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [productType, setProductType] = useState<"ALL" | "B2B" | "B2C">(
    (searchParams.get("type") as any) || "ALL"
  );
  const [sortOrder, setSortOrder] = useState<"NEW" | "PRICE_ASC" | "PRICE_DESC">(
    (searchParams.get("sort") as any) || "NEW"
  );
  const [maxPrice, setMaxPrice] = useState<number>(
    Number(searchParams.get("maxPrice") || 100000)
  );

  // Sync all filter state → URL
  const syncUrl = useCallback(
    (overrides: Record<string, string> = {}) => {
      const params = new URLSearchParams();
      const q       = overrides.q       ?? search;
      const cat     = overrides.category ?? selectedCategory;
      const type    = overrides.type    ?? productType;
      const sort    = overrides.sort    ?? sortOrder;
      const price   = overrides.maxPrice ?? String(maxPrice);

      if (q)              params.set("q", q);
      if (cat !== "all")  params.set("category", cat);
      if (type !== "ALL") params.set("type", type);
      if (sort !== "NEW") params.set("sort", sort);
      if (type === "B2C" && Number(price) < 100000) params.set("maxPrice", price);

      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [search, selectedCategory, productType, sortOrder, maxPrice, pathname, router]
  );

  // Helpers that update state + URL together
  const setSearchAndSync   = (v: string)                         => { setSearch(v);           syncUrl({ q: v }); };
  const setCategoryAndSync = (v: string)                         => { setSelectedCategory(v); syncUrl({ category: v }); };
  const setTypeAndSync     = (v: "ALL" | "B2B" | "B2C")         => {
    setProductType(v);
    if (v !== "B2C") setMaxPrice(100000);
    syncUrl({ type: v, maxPrice: "100000" });
  };
  const setSortAndSync     = (v: "NEW" | "PRICE_ASC" | "PRICE_DESC") => { setSortOrder(v);  syncUrl({ sort: v }); };
  const setPriceAndSync    = (v: number)                         => { setMaxPrice(v);        syncUrl({ maxPrice: String(v) }); };

  const resetAll = () => {
    setSearch(""); setSelectedCategory("all"); setProductType("ALL");
    setSortOrder("NEW"); setMaxPrice(100000);
    router.replace(pathname, { scroll: false });
  };

  useEffect(() => {
    async function load() {
      try {
        const [pRes, cRes] = await Promise.all([
          apiClient.get("/public/products"),
          apiClient.get("/public/categories"),
        ]);
        setProducts(pRes.data.data);
        setCategories(cRes.data.data);
      } catch {
        setProducts(mockProducts as any[]);
        setCategories(mockCategories as any[]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Filter
  const filtered = products.filter((p) => {
    const variantNames = (p.variants || []).map((v: any) => v.name || "").join(" ");
    const variantSkus  = (p.variants || []).map((v: any) => v.sku  || "").join(" ");
    const matchQ   = !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      (p.shortDescription || p.summary || "").toLowerCase().includes(search.toLowerCase()) ||
      variantNames.toLowerCase().includes(search.toLowerCase()) ||
      variantSkus.toLowerCase().includes(search.toLowerCase());

    const matchCat = selectedCategory === "all" ||
      p.categories?.some((c: any) => c.category?.slug === selectedCategory || c.category?.id === selectedCategory) ||
      p.category === selectedCategory;

    const matchType = productType === "ALL" ||
      (p.productType || p.type) === productType;

    const price      = Number(p.basePrice || 0);
    const matchPrice = productType !== "B2C" || price <= maxPrice || price === 0;

    return matchQ && matchCat && matchType && matchPrice;
  });

  // Sort then expand each product into per-variant cards
  const sorted = expandToVariantCards(
    [...filtered].sort((a, b) => {
      if (sortOrder === "PRICE_ASC") return Number(a.basePrice || 0) - Number(b.basePrice || 0);
      if (sortOrder === "PRICE_DESC") return Number(b.basePrice || 0) - Number(a.basePrice || 0);
      return (b.id || "").localeCompare(a.id || "");
    })
  );

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeFilters = [
    productType !== "ALL"        && { label: productType,             clear: () => setTypeAndSync("ALL") },
    selectedCategory !== "all"   && { label: selectedCategory,        clear: () => setCategoryAndSync("all") },
    sortOrder !== "NEW"          && { label: sortOrder.replace("_", " "), clear: () => setSortAndSync("NEW") },
    (productType === "B2C" && maxPrice < 100000) && { label: `≤₹${maxPrice.toLocaleString()}`, clear: () => setPriceAndSync(100000) },
    search                       && { label: `"${search}"`,           clear: () => setSearchAndSync("") },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  return (
    <SiteShell
      title="Cleanroom Products"
      subtitle="Browse and filter our range of B2B equipment and B2C stainless steel modular furniture."
    >
      <div className="grid gap-6 lg:grid-cols-[260px_1fr] my-6">

        {/* ── Sidebar Filters ── */}
        <aside className="space-y-2">
          {/* Mobile toggle */}
          <button
            className="lg:hidden w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm"
            onClick={() => setSidebarOpen(o => !o)}
          >
            <span className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-brand" /> Filters {activeFilters.length > 0 && <span className="h-5 w-5 rounded-full bg-brand text-white text-[9px] font-extrabold flex items-center justify-center">{activeFilters.length}</span>}</span>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${sidebarOpen ? "rotate-180" : ""}`} />
          </button>
          <div className={`rounded-2xl border border-slate-200 bg-white p-5 space-y-5 shadow-sm lg:sticky lg:top-4 ${sidebarOpen ? "block" : "hidden lg:block"}`}>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <SlidersHorizontal className="h-4 w-4 text-brand" />
              <h3 className="text-sm font-bold text-slate-900">Filters</h3>
              {activeFilters.length > 0 && (
                <button onClick={resetAll} className="ml-auto text-[10px] font-bold text-rose-600 hover:underline">
                  Reset all
                </button>
              )}
            </div>

            {/* Type */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sales Type</label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                {(["ALL", "B2B", "B2C"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeAndSync(t)}
                    className={`rounded-lg py-1.5 font-bold transition ${
                      productType === t ? "bg-white text-brand shadow-sm" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setCategoryAndSync(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs focus:border-brand focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.slug || cat.id} value={cat.slug || cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price — B2C only */}
            {productType === "B2C" && (
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <span>Max Price</span>
                  <span className="text-brand">₹{maxPrice.toLocaleString()}</span>
                </div>
                <input
                  type="range" min={1000} max={100000} step={1000}
                  value={maxPrice}
                  onChange={(e) => setPriceAndSync(Number(e.target.value))}
                  className="w-full accent-brand h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                />
              </div>
            )}

            {/* Sort */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sort By</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortAndSync(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs focus:border-brand focus:outline-none"
              >
                <option value="NEW">Newest First</option>
                <option value="PRICE_ASC">Price: Low → High</option>
                <option value="PRICE_DESC">Price: High → Low</option>
              </select>
            </div>
          </div>
        </aside>

        {/* ── Catalog ── */}
        <section className="space-y-5 min-w-0">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearchAndSync(e.target.value)}
              placeholder="Search by model, specification, keyword…"
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm focus:border-brand focus:outline-none shadow-sm"
            />
            {search && (
              <button onClick={() => setSearchAndSync("")} className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Active filter chips */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((f, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full bg-brand/10 text-brand text-xs font-bold px-3 py-1"
                >
                  {f.label}
                  <button onClick={f.clear} className="ml-0.5 hover:text-brand-dark"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}

          {/* Results count */}
          {!loading && (
            <p className="text-xs text-slate-500 font-semibold">
              {sorted.length === 0 ? "No products found" : `${sorted.length} product${sorted.length !== 1 ? "s" : ""}`}
              {activeFilters.length > 0 && " matching filters"}
            </p>
          )}

          {/* Grid / Skeleton / Empty */}
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse bg-white border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="h-48 bg-slate-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded" />
                    <div className="h-3 bg-slate-100 rounded w-5/6" />
                    <div className="h-8 bg-slate-100 rounded mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-14 border border-dashed border-slate-200 bg-white rounded-2xl">
              <CircleAlert className="h-9 w-9 text-slate-300 mb-4" />
              <h3 className="text-base font-bold text-slate-900">No products found</h3>
              <p className="text-xs text-slate-500 mt-2 max-w-xs">
                Try broadening your search or{" "}
                <button onClick={resetAll} className="text-brand font-bold hover:underline">clearing all filters</button>.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {sorted.map((prod, i) => (
                <ProductCard
                  key={`${prod._productSlug || prod.slug}-${prod._variantSlug || i}`}
                  prod={prod}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </SiteShell>
  );
}
