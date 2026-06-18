"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { ProductCard } from "@/components/ProductCard";
import { apiClient } from "@/lib/api-client";
import { getProductBySlug, getProductImage } from "@/lib/site-data";
import { useCart } from "@/contexts/cart-context";
import { useWishlist } from "@/contexts/wishlist-context";
import { placeholderStore, Review } from "@/lib/placeholder-store";
import {
  FileText, MessageSquare, ShoppingCart, Send, Loader2,
  Heart, Star, CheckCircle2, ChevronRight,
  ShieldCheck, Truck, Award, Package, ArrowRight, Zap,
} from "lucide-react";

// ── Star rating click input ─────────────────────────────────
function StarInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className="text-2xl transition"
        >
          <Star
            className={`h-7 w-7 transition ${(hover || value) >= n ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
          />
        </button>
      ))}
      <span className="ml-2 text-xs font-bold text-slate-500 self-center">
        {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][hover || value]}
      </span>
    </div>
  );
}

// ── Rating bar ──────────────────────────────────────────────
function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-5 text-right font-bold text-slate-600">{star}</span>
      <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-slate-400">{count}</span>
    </div>
  );
}

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [qty, setQty] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  // Lead form
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadCompany, setLeadCompany] = useState("");
  const [leadMessage, setLeadMessage] = useState("");
  const [leadLoading, setLeadLoading] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);
  const [inquiryType, setInquiryType] = useState<"QUOTE" | "CUSTOMIZE">("QUOTE");

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiClient.get(`/public/products/${params.slug}`);
        const data = res.data.data;
        if (!data) throw new Error("Not found");
        setProduct(data);
        const img = data.images?.find((i: any) => i.isPrimary)?.url
          || data.images?.[0]?.url
          || getProductImage(data.slug, data.images, data.variants);
        setActiveImage(img);
        const defVar = data.variants?.find((v: any) => v.isDefault) || data.variants?.[0] || null;
        setSelectedVariant(defVar);

        // Fetch related — same category, exclude current
        try {
          const catSlug = data.categories?.[0]?.category?.slug;
          if (catSlug) {
            const rel = await apiClient.get(`/public/products?category=${catSlug}&limit=6`);
            const items: any[] = rel.data.data || [];
            setRelatedProducts(items.filter((p: any) => p.slug !== params.slug).slice(0, 4));
          }
        } catch { /* related not critical */ }

      } catch {
        const mock = getProductBySlug(params.slug);
        if (!mock) { setLoading(false); return; }
        const fallbackUrl = getProductImage(mock.slug);
        const mapped = {
          id: mock.slug, name: mock.name, slug: mock.slug,
          sku: `RR-${mock.slug.toUpperCase().slice(0, 8)}`,
          shortDescription: mock.summary, description: mock.description,
          productType: mock.type, basePrice: mock.type === "B2C" ? 12500 : null,
          variants: mock.variants.map((v, i) => ({
            id: `${mock.slug}-var-${i}`, name: v,
            sku: `RR-${mock.slug.toUpperCase().slice(0, 4)}-VAR-${i}`,
            price: mock.type === "B2C" ? 12500 + i * 2000 : null,
            stock: 12, isDefault: i === 0, specification: mock.specifications,
          })),
          images: [{ url: fallbackUrl, isPrimary: true }],
          documents: [{ id: "doc-1", title: "Product Technical Catalog PDF", url: "#" }],
          categories: [{ category: { name: mock.category, slug: mock.category.toLowerCase().replace(/ /g, "-") } }],
          features: mock.features,
        };
        setProduct(mapped);
        setSelectedVariant(mapped.variants[0]);
        setActiveImage(fallbackUrl);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.slug]);

  useEffect(() => {
    if (product) setReviews(placeholderStore.getReviews(product.slug || product.id));
  }, [product]);

  if (loading) {
    return (
      <SiteShell title="Loading..." subtitle="Retrieving product details.">
        <div className="animate-pulse space-y-6 my-8">
          <div className="h-5 bg-slate-100 rounded w-56" />
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="bg-slate-100 h-[480px] rounded-3xl" />
            <div className="space-y-4">
              <div className="h-4 bg-slate-100 rounded w-1/3" />
              <div className="h-10 bg-slate-100 rounded w-2/3" />
              <div className="h-3 bg-slate-100 rounded w-1/4" />
              <div className="h-20 bg-slate-100 rounded" />
              <div className="h-12 bg-slate-100 rounded" />
              <div className="h-12 bg-slate-100 rounded" />
            </div>
          </div>
        </div>
      </SiteShell>
    );
  }

  if (!product) notFound();

  const isB2C = product.productType === "B2C";
  const basePrice = selectedVariant?.price ? Number(selectedVariant.price) : Number(product.basePrice || 0);
  // Variant salePrice takes priority over product salePrice
  const salePrice = selectedVariant?.salePrice
    ? Number(selectedVariant.salePrice)
    : product.salePrice
    ? Number(product.salePrice)
    : null;
  const displayPrice = salePrice || basePrice;
  const discount = salePrice && basePrice > 0 ? Math.round((1 - salePrice / basePrice) * 100) : 0;
  const inWishlist = isInWishlist(product.id || product.slug, selectedVariant?.id || null);
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const ratingCounts = [5, 4, 3, 2, 1].map((n) => ({ star: n, count: reviews.filter((r) => r.rating === n).length }));

  const getVariantChips = (variant: any) => {
    const chips =
      variant?.attributes?.map((attr: any) => {
        const attribute = attr?.attributeValue?.attribute;
        const value = attr?.attributeValue?.value;
        if (!attribute || !value) return null;
        return { label: attribute.name, value };
      }).filter(Boolean) || [];

    if (chips.length > 0) return chips;

    if (variant?.name) {
      return [{ label: "Variant", value: variant.name }];
    }

    return [];
  };

  const handleAddToCart = () => {
    addToCart(product, selectedVariant, qty);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(product, selectedVariant, qty);
    router.push("/checkout");
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadLoading(true);
    try {
      await apiClient.post("/leads", {
        name: leadName, phone: leadPhone, email: leadEmail,
        company: leadCompany, message: leadMessage,
        productId: product.id, variantId: selectedVariant?.id || null,
        source: inquiryType,
      });
      setLeadSuccess(true);
      setLeadName(""); setLeadPhone(""); setLeadEmail(""); setLeadCompany(""); setLeadMessage("");
    } catch (err: any) {
      alert("Submission error: " + (err.message || "Unknown error"));
    } finally {
      setLeadLoading(false);
    }
  };

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName || !reviewComment) return;
    setReviewLoading(true);
    const added = placeholderStore.addReview(product.slug || product.id, {
      productId: product.slug || product.id,
      customerName: reviewName, rating: reviewRating, comment: reviewComment,
    });
    setReviews([added, ...reviews]);
    setReviewName(""); setReviewComment(""); setReviewRating(5);
    setReviewLoading(false);
    setReviewSuccess(true);
    setTimeout(() => setReviewSuccess(false), 3000);
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://radiantraysindia.com" },
      { "@type": "ListItem", position: 2, name: "Products", item: "https://radiantraysindia.com/products" },
      { "@type": "ListItem", position: 3, name: product.name, item: `https://radiantraysindia.com/products/${product.slug}` },
    ],
  };

  return (
    <SiteShell title={product.name} subtitle={product.shortDescription || "High-specification contamination control systems."}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-6">
        <Link href="/" className="hover:text-brand transition">Home</Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <Link href="/products" className="hover:text-brand transition">Products</Link>
        {product.categories?.[0] && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <Link href={`/products?category=${product.categories[0].category?.slug}`} className="hover:text-brand transition">
              {product.categories[0].category?.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <span className="text-slate-800 font-bold truncate max-w-48">{product.name}</span>
      </nav>

      {/* ── Main 2-col grid ── */}
      <div className="grid gap-8 lg:grid-cols-[1fr_480px] xl:grid-cols-[1fr_520px] mb-10">

        {/* LEFT — Images */}
        <div className="space-y-3">
          {/* Main image */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm flex items-center justify-center min-h-[460px] lg:min-h-[540px] p-6 group">
            {activeImage ? (
              <img
                src={activeImage}
                alt={product.name}
                className="max-h-[420px] max-w-full object-contain transition duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="h-80 w-full rounded-2xl bg-gradient-to-br from-brand/8 to-slate-100 flex items-center justify-center text-slate-400 font-bold text-sm">
                Cleanroom System Image
              </div>
            )}
            {/* Type badge */}
            <span className={`absolute top-4 left-4 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
              isB2C ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            }`}>
              {isB2C ? "B2C" : "B2B"}
            </span>
            {/* NEW/SALE/HOT */}
            {product.badge && (
              <span className={`absolute top-4 right-4 rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider shadow-md ${
                product.badge === "SALE" ? "bg-rose-500 text-white" :
                product.badge === "NEW" ? "bg-sky-500 text-white" :
                product.badge === "HOT" ? "bg-orange-500 text-white" :
                product.badge === "BESTSELLER" ? "bg-violet-500 text-white" :
                "bg-slate-700 text-white"
              }`}>
                {product.badge}
              </span>
            )}
            {/* Wishlist */}
              <button
              onClick={() => toggleWishlist(product.id || product.slug, selectedVariant?.id || null)}
              className="absolute bottom-4 right-4 h-10 w-10 flex items-center justify-center rounded-full bg-white shadow border border-slate-200 hover:border-rose-300 transition"
            >
              <Heart className={`h-5 w-5 ${inWishlist ? "fill-rose-600 text-rose-600" : "text-slate-400"}`} />
            </button>
          </div>

          {/* Thumbnail rail — shows variant images when variant selected, else product images */}
          {(() => {
            const varImgs: any[] = selectedVariant?.images?.length ? selectedVariant.images : [];
            const prodImgs: any[] = product.images || [];
            const thumbs = varImgs.length ? varImgs : prodImgs;
            if (thumbs.length <= 1) return null;
            return (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {thumbs.map((img: any, idx: number) => (
                  <button key={idx} onClick={() => setActiveImage(img.url)}
                    className={`h-20 w-20 shrink-0 rounded-2xl border-2 p-1.5 bg-white flex items-center justify-center transition ${
                      activeImage === img.url ? "border-brand shadow-sm" : "border-slate-200 hover:border-slate-300"
                    }`}>
                    <img src={img.url} alt="" className="max-h-full max-w-full object-contain" />
                  </button>
                ))}
              </div>
            );
          })()}

          {/* Trust badges strip */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { icon: Truck, label: "Pan-India Delivery" },
              { icon: Award, label: "ISO 9001:2015" },
              { icon: Package, label: "Factory Direct" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2.5 text-xs font-semibold text-slate-600">
                <Icon className="h-4 w-4 text-brand shrink-0" />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Details */}
        <div className="space-y-5">

          {/* Product header card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm space-y-5">
            <div>
              {product.categories?.[0] && (
                <Link href={`/products?category=${product.categories[0].category?.slug}`} className="text-xs font-extrabold uppercase tracking-[0.3em] text-brand hover:underline">
                  {product.categories[0].category?.name}
                </Link>
              )}
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 mt-1 leading-tight">
                {product.name}
              </h1>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <p className="text-xs text-slate-400 font-medium">SKU: <span className="font-mono text-slate-600">{selectedVariant?.sku || product.sku}</span></p>
                {reviews.length > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {[1,2,3,4,5].map((n) => (
                        <Star key={n} className={`h-3 w-3 ${n <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-slate-200 fill-slate-200"}`} />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">({reviews.length})</span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-sm leading-7 text-slate-600 border-t border-slate-100 pt-4">
              {product.description || "Durable cleanroom containment systems engineered for compliance and quality."}
            </p>

            {/* Features list */}
            {product.features?.length > 0 && (
              <ul className="space-y-1.5">
                {product.features.slice(0, 5).map((f: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="h-3.5 w-3.5 text-brand mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            )}

            {/* B2C Pricing */}
            {isB2C ? (
              <div className="space-y-4 pt-1 border-t border-slate-100">
                <div className="flex flex-wrap items-end gap-3">
                  <span className={`text-3xl font-extrabold ${salePrice ? "text-rose-600" : "text-slate-900"}`}>
                    ₹{displayPrice.toLocaleString("en-IN")}
                  </span>
                  {salePrice && basePrice > 0 && (
                    <>
                      <span className="text-lg text-slate-400 line-through font-semibold">₹{basePrice.toLocaleString("en-IN")}</span>
                      <span className="text-xs font-extrabold bg-rose-100 text-rose-700 px-2.5 py-1 rounded-lg">{discount}% OFF</span>
                    </>
                  )}
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">GST @18% extra</span>
                </div>

                {/* Stock */}
                {selectedVariant && (
                  <div className={`inline-flex items-center gap-2 text-xs font-bold px-3.5 py-2 rounded-xl border ${
                    selectedVariant.stock === 0 ? "bg-rose-50 text-rose-700 border-rose-200" :
                    selectedVariant.stock <= 5 ? "bg-amber-50 text-amber-700 border-amber-200" :
                    "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}>
                    <span className={`h-2 w-2 rounded-full ${
                      selectedVariant.stock === 0 ? "bg-rose-500" :
                      selectedVariant.stock <= 5 ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                    }`} />
                    {selectedVariant.stock === 0 ? "Out of Stock" :
                     selectedVariant.stock <= 5 ? `Only ${selectedVariant.stock} left!` :
                     `In Stock (${selectedVariant.stock} units)`}
                  </div>
                )}

                {/* Variants */}
                {product.variants?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Select Variant</p>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.map((v: any) => (
                        <button
                          key={v.id}
                          onClick={() => {
                            setSelectedVariant(v);
                            // Switch image to variant's first image if it has one
                            const varImg = v.images?.find((i: any) => i.isPrimary)?.url || v.images?.[0]?.url || v.imageUrl;
                            if (varImg) setActiveImage(varImg);
                          }}
                          className={`flex flex-col items-center justify-center rounded-xl border px-4 py-2.5 text-xs font-bold transition ${
                            selectedVariant?.id === v.id
                              ? "border-brand bg-brand text-white shadow-sm"
                              : "border-slate-200 bg-white hover:border-brand/40 text-slate-700"
                          }`}
                        >
                          <span className="block text-[11px] font-extrabold">{v.name}</span>
                          <span className="mt-1 flex flex-wrap justify-center gap-1">
                            {getVariantChips(v).slice(0, 3).map((chip: any, idx: number) => (
                              <span
                                key={idx}
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                  selectedVariant?.id === v.id
                                    ? "bg-white/15 text-white"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                <span className="opacity-70">{chip.label}:</span> {chip.value}
                              </span>
                            ))}
                          </span>
                          {v.stock > 0 && v.stock <= 5 && <span className="ml-1 opacity-70">({v.stock})</span>}
                          {v.stock === 0 && <span className="ml-1 opacity-60">(Out)</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Qty + CTA */}
                <div className="flex items-center gap-3 flex-wrap pt-1">
                  <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3.5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">−</button>
                    <span className="px-4 py-2.5 text-sm font-bold text-slate-900 border-x border-slate-200 min-w-12 text-center">{qty}</span>
                    <button onClick={() => setQty(qty + 1)} className="px-3.5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">+</button>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    disabled={selectedVariant?.stock === 0}
                    className={`flex-1 min-w-36 inline-flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-bold transition shadow-sm disabled:opacity-40 ${
                      addedToCart ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-brand bg-white text-brand hover:bg-brand/5"
                    }`}
                  >
                    {addedToCart ? <><CheckCircle2 className="h-4 w-4" /> Added!</> : <><ShoppingCart className="h-4 w-4" /> Add to Cart</>}
                  </button>
                  <button
                    onClick={handleBuyNow}
                    disabled={selectedVariant?.stock === 0}
                    className="flex-1 min-w-36 inline-flex items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-white hover:bg-brand-dark transition shadow shadow-brand/20 disabled:opacity-40"
                  >
                    <Zap className="h-4 w-4" /> Buy Now
                  </button>
                </div>
              </div>
            ) : (
              /* B2B */
              <div className="space-y-4 pt-1 border-t border-slate-100">
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 p-4 rounded-2xl">
                  <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-extrabold text-amber-800">B2B Industrial Equipment</p>
                    <p className="text-xs text-amber-700 mt-0.5">Price on request. Submit specs below and our engineers respond within 24 hours.</p>
                  </div>
                </div>

                {product.variants?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Available Sizes / Series</p>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.map((v: any) => (
                        <button
                          key={v.id}
                          onClick={() => {
                            setSelectedVariant(v);
                            // Switch image to variant's first image if it has one
                            const varImg = v.images?.find((i: any) => i.isPrimary)?.url || v.images?.[0]?.url || v.imageUrl;
                            if (varImg) setActiveImage(varImg);
                          }}
                          className={`flex flex-col items-center justify-center rounded-xl border px-4 py-2.5 text-xs font-bold transition ${
                            selectedVariant?.id === v.id
                              ? "border-brand bg-brand text-white"
                              : "border-slate-200 bg-white hover:border-brand/40 text-slate-700"
                          }`}
                        >
                          <span className="block text-[11px] font-extrabold">{v.name}</span>
                          <span className="mt-1 flex flex-wrap justify-center gap-1">
                            {getVariantChips(v).slice(0, 3).map((chip: any, idx: number) => (
                              <span
                                key={idx}
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                  selectedVariant?.id === v.id
                                    ? "bg-white/15 text-white"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                <span className="opacity-70">{chip.label}:</span> {chip.value}
                              </span>
                            ))}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <a
                    href="#quote-form"
                    onClick={() => setInquiryType("QUOTE")}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand hover:bg-brand-dark py-3.5 text-xs font-bold text-white transition shadow shadow-brand/20"
                  >
                    <FileText className="h-4 w-4" /> Quotate Now
                  </a>
                  <a
                    href="#quote-form"
                    onClick={() => setInquiryType("CUSTOMIZE")}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-brand bg-white hover:bg-brand/5 py-3.5 text-xs font-bold text-brand transition"
                  >
                    <Zap className="h-4 w-4" /> Request Customize
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Specs card */}
          {selectedVariant?.specification && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
                <span className="h-1.5 w-5 bg-brand rounded-full" /> Technical Specifications
              </h3>
              <dl className="divide-y divide-slate-100">
                {(Array.isArray(selectedVariant.specification)
                  ? selectedVariant.specification
                  : Object.entries(selectedVariant.specification).map(([label, value]) => ({ label, value }))
                ).map((spec: any, i: number) => (
                  <div key={i} className="flex justify-between py-3 gap-4 text-sm">
                    <dt className="font-bold text-slate-500 uppercase tracking-wider text-xs">{spec.label || spec[0]}</dt>
                    <dd className="text-slate-800 text-right font-medium">{spec.value || spec[1]}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Documents */}
          {product.documents?.length > 0 && (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm space-y-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                <span className="h-1.5 w-5 bg-brand rounded-full" /> Technical Data Sheets
              </h3>
              {product.documents.map((doc: any) => (
                <a
                  key={doc.id}
                  href={doc.url}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-2xl bg-white border border-slate-200 p-4 hover:border-brand hover:shadow-sm transition duration-150 group"
                >
                  <span className="text-sm font-bold flex items-center gap-2.5 text-slate-800 group-hover:text-brand">
                    <FileText className="h-5 w-5 text-brand shrink-0" />
                    {doc.title}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-brand bg-brand/10 px-3 py-1 rounded-lg">
                    Download
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── B2B Quote Form ── */}
      {!isB2C && (
        <section id="quote-form" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm mb-8">
          <div className="flex border-b border-slate-100 mb-6">
            <button
              type="button"
              onClick={() => { setInquiryType("QUOTE"); setLeadSuccess(false); }}
              className={`flex-1 pb-3 text-sm font-bold border-b-2 transition ${inquiryType === "QUOTE" ? "border-brand text-brand" : "border-transparent text-slate-400 hover:text-slate-600"}`}
            >
              Request Commercial Quotation
            </button>
            <button
              type="button"
              onClick={() => { setInquiryType("CUSTOMIZE"); setLeadSuccess(false); }}
              className={`flex-1 pb-3 text-sm font-bold border-b-2 transition ${inquiryType === "CUSTOMIZE" ? "border-brand text-brand" : "border-transparent text-slate-400 hover:text-slate-600"}`}
            >
              Request Customization
            </button>
          </div>

          <div className="flex items-start gap-4 mb-6">
            <div className="h-10 w-10 rounded-2xl bg-brand/10 flex items-center justify-center shrink-0">
              {inquiryType === "QUOTE" ? <FileText className="h-5 w-5 text-brand" /> : <Zap className="h-5 w-5 text-brand" />}
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-950">
                {inquiryType === "QUOTE" ? "Request Quotation & Drawings" : "Customization Specifications Request"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {inquiryType === "QUOTE" 
                  ? "Submit specifications. Engineers respond within 24 hours with a detailed proposal."
                  : "Submit custom requirements. Our technical drawing team will prepare layout plans."}
              </p>
            </div>
          </div>

          {leadSuccess ? (
            <div className="flex items-center gap-4 rounded-2xl bg-emerald-50 border border-emerald-200 p-6">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 shrink-0" />
              <div>
                <p className="font-extrabold text-emerald-800">Inquiry Registered!</p>
                <p className="text-xs text-emerald-600 mt-1">Our sales engineers will contact you shortly via email and phone.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLeadSubmit} className="grid gap-4 sm:grid-cols-2">
              {([
                { label: "Your Name *", type: "text", val: leadName, set: setLeadName, ph: "Full Name" },
                { label: "Phone Number *", type: "tel", val: leadPhone, set: setLeadPhone, ph: "+91 92117 81378" },
                { label: "Email Address *", type: "email", val: leadEmail, set: setLeadEmail, ph: "work@company.com" },
                { label: "Company Name *", type: "text", val: leadCompany, set: setLeadCompany, ph: "Company Pvt Ltd" },
              ] as any[]).map(({ label, type, val, set, ph }) => (
                <div key={label} className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{label}</label>
                  <input
                    type={type} required value={val} onChange={(e) => set(e.target.value)} placeholder={ph}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:border-brand focus:bg-white transition"
                  />
                </div>
              ))}
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  {inquiryType === "QUOTE" ? "Requirements & Specifications *" : "Customization Requirements *"}
                </label>
                <textarea
                  required rows={4} value={leadMessage} onChange={(e) => setLeadMessage(e.target.value)}
                  placeholder={inquiryType === "QUOTE" 
                    ? "Specify: ISO class, dimensions (LxWxH), material (SS 304/316), airflow type, UV fixtures, quantity, installation site..."
                    : "Specify custom size, non-standard dimensions, airflow velocity tolerances, double-skin partitioning, pre-filter preferences, etc."}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:border-brand focus:bg-white transition resize-none"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit" disabled={leadLoading}
                  className="inline-flex items-center gap-2.5 rounded-2xl bg-brand px-8 py-4 text-sm font-extrabold text-white shadow-lg shadow-brand/20 hover:bg-brand-dark transition disabled:opacity-70"
                >
                  {leadLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</> : <><Send className="h-4 w-4" /> Submit {inquiryType === "QUOTE" ? "Quotation" : "Customization"} Request</>}
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {/* ── Reviews Section ── */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm mb-8 space-y-7">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
            <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-950">
              Customer Ratings & Reviews
              <span className="ml-2 text-sm font-bold text-slate-400">({reviews.length})</span>
            </h3>
          </div>
        </div>

        {/* Rating summary */}
        <div className="grid sm:grid-cols-[auto_1fr] gap-6 items-center rounded-2xl bg-slate-50 border border-slate-100 p-6">
          <div className="text-center space-y-1 px-4">
            <p className="text-5xl font-extrabold text-slate-950 leading-none">
              {reviews.length > 0 ? avgRating.toFixed(1) : "—"}
            </p>
            <div className="flex justify-center gap-0.5 mt-2">
              {[1,2,3,4,5].map((n) => (
                <Star key={n} className={`h-4 w-4 ${n <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`} />
              ))}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{reviews.length} reviews</p>
          </div>
          <div className="space-y-2 min-w-0">
            {ratingCounts.map(({ star, count }) => (
              <RatingBar key={star} star={star} count={count} total={reviews.length} />
            ))}
          </div>
        </div>

        {/* Write review form */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 space-y-5">
          <h4 className="text-sm font-extrabold text-slate-900">Write a Review</h4>
          {reviewSuccess && (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <CheckCircle2 className="h-4 w-4" /> Review submitted! Thank you.
            </div>
          )}
          <form onSubmit={handleReview} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Display Name *</label>
                <input
                  required value={reviewName} onChange={(e) => setReviewName(e.target.value)}
                  placeholder="Jane Doe (Bio Lab Supervisor)"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:border-brand transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Your Rating *</label>
                <div className="pt-1">
                  <StarInput value={reviewRating} onChange={setReviewRating} />
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Review Comments *</label>
              <textarea
                required rows={3} value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
                placeholder="How satisfied are you with the filter containment, finish, noise level, or custom size tolerances?"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:border-brand transition resize-none"
              />
            </div>
            <button
              type="submit" disabled={reviewLoading}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 text-sm font-bold transition"
            >
              {reviewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
              Submit Review
            </button>
          </form>
        </div>

        {/* Review list */}
        {reviews.length === 0 ? (
          <p className="text-sm text-slate-400 italic text-center py-4">No reviews yet. Be the first to leave one above.</p>
        ) : (
          <div className="space-y-5">
            {reviews.map((rev) => (
              <div key={rev.id} className="border-b border-slate-100 pb-5 last:border-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-brand/10 flex items-center justify-center font-extrabold text-brand text-sm shrink-0">
                      {rev.customerName?.[0] || "?"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900">{rev.customerName}</p>
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Verified
                        </span>
                      </div>
                      <div className="flex gap-0.5 mt-0.5">
                        {[1,2,3,4,5].map((n) => (
                          <Star key={n} className={`h-3 w-3 ${n <= rev.rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">{new Date(rev.createdAt).toLocaleDateString("en-IN")}</span>
                </div>
                <p className="text-sm text-slate-600 mt-3 leading-relaxed pl-12">{rev.comment}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Related Products ── */}
      {relatedProducts.length > 0 && (
        <section className="mb-8 space-y-5">
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-brand">From Same Category</span>
              <h3 className="text-xl font-extrabold text-slate-950">Related Products</h3>
            </div>
            <Link href={`/products?category=${product.categories?.[0]?.category?.slug || ""}`} className="text-xs font-bold text-brand hover:underline inline-flex items-center gap-1">
              See all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.slug} prod={p} />
            ))}
          </div>
        </section>
      )}
    </SiteShell>
  );
}
