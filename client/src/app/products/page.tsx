"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { ProductCard } from "@/components/ProductCard";
import { apiClient } from "@/lib/api-client";
import { products as mockProducts, categories as mockCategories } from "@/lib/site-data";
import { Search, SlidersHorizontal, CircleAlert, X, ChevronDown, ChevronLeft, ChevronRight, LayoutGrid, List } from "lucide-react";
import { expandToVariantCards } from "@/lib/variant-cards";

interface ExtractedAttribute {
  name: string;
  values: string[];
}

const ITEMS_PER_PAGE = 12;

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
  const [sortOrder, setSortOrder] = useState<"NEW" | "PRICE_ASC" | "PRICE_DESC">(
    (searchParams.get("sort") as any) || "NEW"
  );
  const [maxPrice, setMaxPrice] = useState<number>(
    Number(searchParams.get("maxPrice") || 100000)
  );
  const [currentPage, setCurrentPage] = useState<number>(
    Number(searchParams.get("page") || 1)
  );

  // Selected attributes state: { "Finish": ["Matte", "Glossy"], ... }
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string[]>>(() => {
    const param = searchParams.get("attrs") || "";
    const result: Record<string, string[]> = {};
    if (param) {
      param.split(";").forEach(pair => {
        const [key, valStr] = pair.split(":");
        if (key && valStr) {
          result[decodeURIComponent(key)] = valStr.split("|").map(decodeURIComponent);
        }
      });
    }
    return result;
  });

  // Extract all attributes dynamically from the catalog products
  const availableAttributes = useMemo<ExtractedAttribute[]>(() => {
    if (products.length === 0) return [];
    const map: Record<string, Set<string>> = {};
    products.forEach(p => {
      p.variants?.forEach((v: any) => {
        v.attributes?.forEach((attr: any) => {
          const attrName = attr?.attributeValue?.attribute?.name;
          const attrVal = attr?.attributeValue?.value;
          if (attrName && attrVal) {
            if (!map[attrName]) map[attrName] = new Set();
            map[attrName].add(attrVal);
          }
        });
      });
    });
    return Object.entries(map).map(([name, valSet]) => ({
      name,
      values: Array.from(valSet).sort()
    }));
  }, [products]);

  // Sync all filter state → URL
  const syncUrl = useCallback(
    (overrides: {
      q?: string;
      category?: string;
      sort?: string;
      maxPrice?: string;
      attrs?: Record<string, string[]>;
      page?: string;
    } = {}) => {
      const params = new URLSearchParams();
      const q = overrides.q !== undefined ? overrides.q : search;
      const cat = overrides.category !== undefined ? overrides.category : selectedCategory;
      const sort = overrides.sort !== undefined ? overrides.sort : sortOrder;
      const price = overrides.maxPrice !== undefined ? overrides.maxPrice : String(maxPrice);
      const attrsObj = overrides.attrs !== undefined ? overrides.attrs : selectedAttributes;
      const pg = overrides.page !== undefined ? overrides.page : String(currentPage);

      if (q) params.set("q", q);
      if (cat !== "all") params.set("category", cat);
      if (sort !== "NEW") params.set("sort", sort);
      if (Number(price) < 100000) params.set("maxPrice", price);

      // Convert selectedAttributes object to URL string: key:val1|val2;key2:val3
      const attrPairs: string[] = [];
      Object.entries(attrsObj).forEach(([key, values]) => {
        if (values && values.length > 0) {
          attrPairs.push(`${encodeURIComponent(key)}:${values.map(encodeURIComponent).join("|")}`);
        }
      });
      const attrsStr = attrPairs.join(";");
      if (attrsStr) params.set("attrs", attrsStr);

      if (pg && pg !== "1") params.set("page", pg);

      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [search, selectedCategory, sortOrder, maxPrice, selectedAttributes, currentPage, pathname, router]
  );

  // Helpers that update state + URL together
  const setSearchAndSync = (v: string) => {
    setSearch(v);
    setCurrentPage(1);
    syncUrl({ q: v, page: "1" });
  };
  const setCategoryAndSync = (v: string) => {
    setSelectedCategory(v);
    setCurrentPage(1);
    syncUrl({ category: v, page: "1" });
  };
  const setSortAndSync = (v: "NEW" | "PRICE_ASC" | "PRICE_DESC") => {
    setSortOrder(v);
    setCurrentPage(1);
    syncUrl({ sort: v, page: "1" });
  };
  const setPriceAndSync = (v: number) => {
    setMaxPrice(v);
    setCurrentPage(1);
    syncUrl({ maxPrice: String(v), page: "1" });
  };
  const setPageAndSync = (v: number) => {
    setCurrentPage(v);
    syncUrl({ page: String(v) });
  };

  const handleAttributeChange = (attrName: string, value: string, checked: boolean) => {
    const currentVals = selectedAttributes[attrName] || [];
    const nextVals = checked
      ? [...currentVals, value]
      : currentVals.filter(v => v !== value);

    const nextAttributes = {
      ...selectedAttributes,
      [attrName]: nextVals
    };

    // Clean up empty keys
    if (nextVals.length === 0) {
      delete nextAttributes[attrName];
    }

    setSelectedAttributes(nextAttributes);
    setCurrentPage(1);
    syncUrl({ attrs: nextAttributes, page: "1" });
  };

  const clearAttributeFilter = (attrName: string) => {
    const nextAttributes = { ...selectedAttributes };
    delete nextAttributes[attrName];
    setSelectedAttributes(nextAttributes);
    setCurrentPage(1);
    syncUrl({ attrs: nextAttributes, page: "1" });
  };

  const resetAll = () => {
    setSearch("");
    setSelectedCategory("all");
    setSortOrder("NEW");
    setMaxPrice(100000);
    setSelectedAttributes({});
    setCurrentPage(1);
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

  // Filter products locally
  const filtered = useMemo(() => {
    return products.filter((p) => {
      const variantNames = (p.variants || []).map((v: any) => v.name || "").join(" ");
      const variantSkus = (p.variants || []).map((v: any) => v.sku || "").join(" ");
      const compositeNames = (p.variants || []).map((v: any) => `${p.name} — ${v.name}`).join(" ");
      const q = search.toLowerCase();

      // Search match
      const matchQ = !search ||
        p.name?.toLowerCase().includes(q) ||
        (p.shortDescription || p.summary || "").toLowerCase().includes(q) ||
        variantNames.toLowerCase().includes(q) ||
        variantSkus.toLowerCase().includes(q) ||
        compositeNames.toLowerCase().includes(q);

      // Category match
      const matchCat = selectedCategory === "all" ||
        p.categories?.some((c: any) => c.category?.slug === selectedCategory || c.category?.id === selectedCategory) ||
        p.category === selectedCategory;

      // Price match (only B2C / products with defined prices are filtered by max price; B2B / Price on Request are preserved)
      const price = Number(p.basePrice || 0);
      const matchPrice = price === 0 || price <= maxPrice;

      // Attributes match
      const matchAttributes = Object.entries(selectedAttributes).every(([attrName, selectedVals]) => {
        if (!selectedVals || selectedVals.length === 0) return true;
        return p.variants?.some((v: any) =>
          v.attributes?.some((attr: any) => {
            const name = attr?.attributeValue?.attribute?.name;
            const val = attr?.attributeValue?.value;
            return name === attrName && selectedVals.includes(val);
          })
        );
      });

      return matchQ && matchCat && matchPrice && matchAttributes;
    });
  }, [products, search, selectedCategory, maxPrice, selectedAttributes]);

  // Sort and Expand Variants
  const sorted = useMemo(() => {
    return expandToVariantCards(
      [...filtered].sort((a, b) => {
        if (sortOrder === "PRICE_ASC") return Number(a.basePrice || 0) - Number(b.basePrice || 0);
        if (sortOrder === "PRICE_DESC") return Number(b.basePrice || 0) - Number(a.basePrice || 0);
        return (b.id || "").localeCompare(a.id || "");
      })
    );
  }, [filtered, sortOrder]);

  // Paginated chunk
  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    return sorted.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [sorted, currentPage]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<"grid" | "list">("grid");

  // Active filters tracker
  const activeFilters = useMemo(() => {
    const list: { label: string; clear: () => void }[] = [];
    if (selectedCategory !== "all") {
      list.push({ label: `Category: ${selectedCategory}`, clear: () => setCategoryAndSync("all") });
    }
    if (sortOrder !== "NEW") {
      list.push({ label: sortOrder === "PRICE_ASC" ? "Price: Low to High" : "Price: High to Low", clear: () => setSortAndSync("NEW") });
    }
    if (maxPrice < 100000) {
      list.push({ label: `Max Price: ₹${maxPrice.toLocaleString()}`, clear: () => setPriceAndSync(100000) });
    }
    if (search) {
      list.push({ label: `Search: "${search}"`, clear: () => setSearchAndSync("") });
    }
    Object.entries(selectedAttributes).forEach(([attrName, vals]) => {
      vals.forEach(v => {
        list.push({
          label: `${attrName}: ${v}`,
          clear: () => handleAttributeChange(attrName, v, false)
        });
      });
    });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, sortOrder, maxPrice, search, selectedAttributes]);

  return (
    <SiteShell
      title="Cleanroom Products"
      subtitle="Browse and filter our high-specification cleanroom containment equipment and custom steel furniture."
    >
      <div className="grid gap-6 lg:grid-cols-[260px_1fr] my-6">

        {/* ── Sidebar Filters ── */}
        <aside className="space-y-2">
          {/* Mobile toggle */}
          <button
            className="lg:hidden w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm"
            onClick={() => setSidebarOpen(o => !o)}
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-brand" /> 
              Filters {activeFilters.length > 0 && (
                <span className="h-5 w-5 rounded-full bg-brand text-white text-[9px] font-extrabold flex items-center justify-center">
                  {activeFilters.length}
                </span>
              )}
            </span>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${sidebarOpen ? "rotate-180" : ""}`} />
          </button>

          <div className={`rounded-2xl border border-slate-200 bg-white p-5 space-y-6 shadow-sm lg:sticky lg:top-4 ${sidebarOpen ? "block" : "hidden lg:block"}`}>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <SlidersHorizontal className="h-4 w-4 text-brand" />
              <h3 className="text-sm font-bold text-slate-900">Filters</h3>
              {activeFilters.length > 0 && (
                <button onClick={resetAll} className="ml-auto text-[10px] font-bold text-rose-600 hover:underline">
                  Reset all
                </button>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setCategoryAndSync(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold focus:border-brand focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.slug || cat.id} value={cat.slug || cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic Attributes Filter Section */}
            {availableAttributes.map((attr) => {
              const selectedVals = selectedAttributes[attr.name] || [];
              return (
                <div key={attr.name} className="space-y-2 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{attr.name}</label>
                    {selectedVals.length > 0 && (
                      <button 
                        onClick={() => clearAttributeFilter(attr.name)}
                        className="text-[9px] font-bold text-rose-600 hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {attr.values.map((val) => {
                      const isChecked = selectedVals.includes(val);
                      return (
                        <label key={val} className="flex items-center gap-2.5 text-xs text-slate-600 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleAttributeChange(attr.name, val, e.target.checked)}
                            className="rounded border-slate-300 text-brand focus:ring-brand h-4 w-4"
                          />
                          <span>{val}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Price Slider */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
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

            {/* Sort */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sort By</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortAndSync(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold focus:border-brand focus:outline-none"
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
                  <button onClick={f.clear} className="ml-0.5 hover:text-brand-dark">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Results count & page summary */}
          {!loading && (
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-0.5">
              <div className="flex items-center gap-4">
                <p>
                  {sorted.length === 0 ? "No products found" : `${sorted.length} product${sorted.length !== 1 ? "s" : ""}`}
                  {activeFilters.length > 0 && " matching filters"}
                </p>
                {sorted.length > 0 && (
                  <p className="hidden sm:block">
                    Showing {Math.min(sorted.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)}-
                    {Math.min(sorted.length, currentPage * ITEMS_PER_PAGE)} of {sorted.length}
                  </p>
                )}
              </div>
              {sorted.length > 0 && (
                <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-0.5 border border-slate-200">
                  <button
                    onClick={() => setLayoutMode("grid")}
                    className={`p-1.5 rounded-lg transition-all ${
                      layoutMode === "grid"
                        ? "bg-white text-brand shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setLayoutMode("list")}
                    className={`p-1.5 rounded-lg transition-all ${
                      layoutMode === "list"
                        ? "bg-white text-brand shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                    title="List View"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
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
            <>
              <div className={layoutMode === "grid" ? "grid gap-3 sm:gap-5 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-4"}>
                {paginatedProducts.map((prod, i) => (
                  <ProductCard
                    key={`${prod._productSlug || prod.slug}-${prod._variantSlug || i}`}
                    prod={prod}
                    layout={layoutMode}
                  />
                ))}
              </div>

              {/* ── Pagination controls ── */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 pt-6 border-t border-slate-100 mt-8">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setPageAndSync(currentPage - 1)}
                    className="h-8 px-2 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 transition text-slate-500 disabled:opacity-40 disabled:hover:bg-transparent"
                    title="Previous Page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setPageAndSync(page)}
                      className={`h-8 w-8 flex items-center justify-center rounded-lg text-xs font-bold transition ${
                        currentPage === page
                          ? "bg-brand text-white shadow-sm"
                          : "border border-slate-200 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setPageAndSync(currentPage + 1)}
                    className="h-8 px-2 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 transition text-slate-500 disabled:opacity-40 disabled:hover:bg-transparent"
                    title="Next Page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </SiteShell>
  );
}
