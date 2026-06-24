"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { apiClient } from "@/lib/api-client";
import { getProductBySlug, getProductImage } from "@/lib/site-data";
import { expandToVariantCards } from "@/lib/variant-cards";
import { useCart } from "@/contexts/cart-context";
import { useWishlist } from "@/contexts/wishlist-context";
import { useAuth } from "@/contexts/auth-context";
import { placeholderStore, Review } from "@/lib/placeholder-store";
import {
  FileText, MessageSquare, ShoppingCart, Send, Loader2,
  Heart, Star, CheckCircle2, ChevronRight,
  ShieldCheck, Truck, Award, Package, ArrowRight, Zap,
  ZoomIn, X, ChevronLeft,
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

export function ProductDetailClient({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const variantParam = searchParams.get("variant");
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { customer } = useAuth();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [qty, setQty] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [zoom, setZoom] = useState(1);
  // Touch swipe
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  // Lead form
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadCompany, setLeadCompany] = useState("");
  const [leadMessage, setLeadMessage] = useState("");
  const [leadLoading, setLeadLoading] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);
  const [leadError, setLeadError] = useState("");
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
            id: `${mock.slug}-var-${i}`, name: v, slug: `var-${i}`,
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
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.slug]);

  // When product loaded or variantParam changes, select correct variant + image
  useEffect(() => {
    if (!product) return;
    const defVar = (variantParam
      ? product.variants?.find((v: any) => v.slug === variantParam)
      : null)
      || product.variants?.find((v: any) => v.isDefault)
      || product.variants?.[0]
      || null;
    setSelectedVariant(defVar);
    const varImg = defVar?.images?.find((i: any) => i.isPrimary)?.url
      || defVar?.images?.[0]?.url
      || defVar?.imageUrl
      || null;
    const img = (variantParam ? varImg : null)
      || product.images?.find((i: any) => i.isPrimary)?.url
      || product.images?.[0]?.url
      || varImg
      || getProductImage(product.slug, product.images, product.variants);
    setActiveImage(img);
  }, [product, variantParam]);
  useEffect(() => {
    if (product) setReviews(placeholderStore.getReviews(product.slug || product.id));
  }, [product]);

  useEffect(() => {
    if (customer) {
      if (customer.name) setLeadName(customer.name);
      if (customer.phone) setLeadPhone(customer.phone);
      if (customer.email) setLeadEmail(customer.email);
    }
  }, [customer]);

  if (loading) {
    return (
      <div className="w-full animate-pulse">
        <div className="mb-8 space-y-2 mt-4">
          <div className="h-3 bg-slate-100 rounded w-24" />
          <div className="h-9 bg-slate-100 rounded w-64" />
          <div className="h-4 bg-slate-100 rounded w-96" />
        </div>
        <div className="space-y-6 my-8">
          <div className="h-5 bg-slate-100 rounded w-56" />
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="bg-slate-100 min-h-[280px] sm:min-h-[380px] lg:min-h-[460px] rounded-3xl" />
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
      </div>
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
  const inWishlist = isInWishlist(product.slug || product.id, null);
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
      setLeadError(err.message || "Submission failed. Please try again.");
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

  const stripHtml = (html: string) =>
    html
      ? html
          .replace(/<[^>]*>/g, " ")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&[a-z]+;/gi, " ")
          .replace(/\s+/g, " ")
          .trim()
      : "";

  const breadcrumbSchema = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://radiantraysindia.com" },
      { "@type": "ListItem", position: 2, name: "Products", item: "https://radiantraysindia.com/products" },
      { "@type": "ListItem", position: 3, name: product.name, item: `https://radiantraysindia.com/products/${product.slug}` },
    ],
  };

  return (
    <div className="w-full">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-6 mt-4">
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
      <div className="grid gap-8 lg:grid-cols-[1fr_480px] xl:grid-cols-[1fr_520px] mb-8 items-start">

        {/* LEFT — Images */}
        {(() => {
          const varImgs: any[] = selectedVariant?.images?.length ? selectedVariant.images : [];
          const prodImgs: any[] = product.images || [];
          const allImgs: any[] = (varImgs.length ? varImgs : prodImgs);
          const imgUrls: string[] = allImgs.map((i: any) => i.url).filter(Boolean);
          if (activeImage && !imgUrls.includes(activeImage)) imgUrls.unshift(activeImage);
          const activeIdx = imgUrls.indexOf(activeImage);
          const currentIdx = activeIdx >= 0 ? activeIdx : 0;

          const goTo = (idx: number) => {
            const next = (idx + imgUrls.length) % imgUrls.length;
            setActiveImage(imgUrls[next]);
          };

          const handleTouchStart = (e: React.TouchEvent) => {
            touchStartX.current = e.touches[0].clientX;
            touchStartY.current = e.touches[0].clientY;
          };
          const handleTouchEnd = (e: React.TouchEvent) => {
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
            if (Math.abs(dx) > 40 && dy < 60) {
              goTo(dx < 0 ? currentIdx + 1 : currentIdx - 1);
            }
          };

          const openLightbox = (idx: number) => { setLightboxIdx(idx); setZoom(1); setLightboxOpen(true); };

          return (
        <div className="space-y-3">
          {/* Main image */}
          <div
            className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm flex items-center justify-center min-h-[280px] sm:min-h-[380px] lg:min-h-[460px] p-4 sm:p-6 group cursor-zoom-in select-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={() => activeImage && openLightbox(currentIdx)}
          >
            {activeImage ? (
              <img
                src={activeImage}
                alt={product.name}
                className="max-h-[220px] sm:max-h-[320px] lg:max-h-[420px] max-w-full object-contain transition duration-500 group-hover:scale-105 pointer-events-none"
                draggable={false}
              />
            ) : (
              <div className="h-80 w-full rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center text-slate-400 font-bold text-sm">
                Cleanroom System Image
              </div>
            )}
            {/* badge */}
            {product.badge && (
              <span className={`absolute top-4 right-4 rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider shadow-md ${
                product.badge === "SALE" ? "bg-rose-500 text-white" :
                product.badge === "NEW" ? "bg-sky-500 text-white" :
                product.badge === "HOT" ? "bg-orange-500 text-white" :
                "bg-slate-700 text-white"
              }`}>{product.badge}</span>
            )}
            {/* Zoom hint */}
            {activeImage && (
              <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/80 border border-slate-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition pointer-events-none">
                <ZoomIn className="h-4 w-4 text-slate-600" />
              </div>
            )}
            {/* Prev/Next arrows — only if multiple images */}
            {imgUrls.length > 1 && (
              <>
                <button
                  onClick={e => { e.stopPropagation(); goTo(currentIdx - 1); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 border border-slate-200 shadow flex items-center justify-center hover:bg-white transition z-10"
                >
                  <ChevronLeft className="h-4 w-4 text-slate-600" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); goTo(currentIdx + 1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 border border-slate-200 shadow flex items-center justify-center hover:bg-white transition z-10"
                >
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </button>
                {/* Dot indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {imgUrls.map((_, i) => (
                    <button key={i} onClick={e => { e.stopPropagation(); goTo(i); }}
                      className={`h-1.5 rounded-full transition-all ${i === currentIdx ? "w-5 bg-brand" : "w-1.5 bg-slate-300 hover:bg-slate-400"}`}
                    />
                  ))}
                </div>
              </>
            )}
            {/* Wishlist */}
            <button
              onClick={e => { e.stopPropagation(); toggleWishlist(product.slug || product.id, null); }}
              className="absolute bottom-4 right-4 h-10 w-10 flex items-center justify-center rounded-full bg-white shadow border border-slate-200 hover:border-rose-300 transition z-10"
            >
              <Heart className={`h-5 w-5 ${inWishlist ? "fill-rose-600 text-rose-600" : "text-slate-400"}`} />
            </button>
          </div>

          {/* Thumbnail rail */}
          {imgUrls.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {imgUrls.map((url, idx) => (
                <button key={idx} onClick={() => setActiveImage(url)}
                  className={`h-20 w-20 shrink-0 rounded-2xl border-2 p-1.5 bg-white flex items-center justify-center transition ${
                    activeImage === url ? "border-brand shadow-sm" : "border-slate-200 hover:border-slate-300"
                  }`}>
                  <img src={url} alt="" className="max-h-full max-w-full object-contain" draggable={false} />
                </button>
              ))}
            </div>
          )}

          {/* LIGHTBOX — portal to body so parent transforms don't clip fixed positioning */}
          {lightboxOpen && imgUrls.length > 0 && typeof document !== "undefined" && createPortal(
            <div
              style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.95)", display: "flex", flexDirection: "column", overflow: "hidden" }}
              onTouchStart={e => { touchStartX.current = e.touches[0].clientX; touchStartY.current = e.touches[0].clientY; }}
              onTouchEnd={e => {
                const dx = e.changedTouches[0].clientX - touchStartX.current;
                const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
                if (Math.abs(dx) > 40 && dy < 60) { setZoom(1); setLightboxIdx(i => (i + (dx < 0 ? 1 : -1) + imgUrls.length) % imgUrls.length); }
              }}
            >
              {/* Top bar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", flexShrink: 0 }}>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 700 }}>{lightboxIdx + 1} / {imgUrls.length}</span>
                <button onClick={() => setLightboxOpen(false)}
                  style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
                  <X size={20} />
                </button>
              </div>

              {/* Image area */}
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", minHeight: 0, overflow: "hidden" }}>
                {imgUrls.length > 1 && (
                  <button onClick={() => { setZoom(1); setLightboxIdx(i => (i - 1 + imgUrls.length) % imgUrls.length); }}
                    style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", zIndex: 3 }}>
                    <ChevronLeft size={24} />
                  </button>
                )}
                <img
                  src={imgUrls[lightboxIdx]}
                  alt=""
                  style={{ maxWidth: "calc(100vw - 120px)", maxHeight: "100%", objectFit: "contain", transform: `scale(${zoom})`, transformOrigin: "center", transition: "transform 0.2s", display: "block", zIndex: 1 }}
                  draggable={false}
                />
                {imgUrls.length > 1 && (
                  <button onClick={() => { setZoom(1); setLightboxIdx(i => (i + 1) % imgUrls.length); }}
                    style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", zIndex: 3 }}>
                    <ChevronRight size={24} />
                  </button>
                )}
              </div>

              {/* Bottom zoom bar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "14px 16px", flexShrink: 0, zIndex: 3, position: "relative" }}>
                <button onClick={() => setZoom(z => Math.max(1, +(z - 0.5).toFixed(1)))}
                  style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 44, height: 44, color: "#fff", fontSize: 24, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 700, minWidth: 52, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(4, +(z + 0.5).toFixed(1)))}
                  style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 44, height: 44, color: "#fff", fontSize: 24, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                <button onClick={() => setZoom(1)}
                  style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 20, padding: "8px 16px", color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Reset</button>
              </div>
            </div>,
            document.body
          )}

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
          );
        })()}

        {/* RIGHT — Details */}
        <div className="space-y-5">

          {/* Product header card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-7 shadow-sm space-y-5">
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
              {/* Short description */}
              {product.shortDescription && (
                <p className="mt-3 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {stripHtml(product.shortDescription)}
                </p>
              )}
            </div>

            {/* B2C Pricing */}
            {isB2C ? (
              <div className="space-y-4 pt-1 border-t border-slate-100">
                <div className="flex flex-wrap items-end gap-3">
                  <span className={`text-3xl font-extrabold ${salePrice ? "text-emerald-600" : "text-slate-900"}`}>
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
                            const varImg = v.images?.find((i: any) => i.isPrimary)?.url || v.images?.[0]?.url || v.imageUrl;
                            if (varImg) setActiveImage(varImg);
                            if (v.slug) router.replace(`/products/${product.slug}?variant=${v.slug}`, { scroll: false });
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
                <div className="space-y-3 pt-1">
                  <div className="flex flex-col sm:grid sm:grid-cols-[auto_1fr_1fr] items-center gap-3">
                    <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden w-full sm:w-auto justify-between">
                      <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">−</button>
                      <span className="px-5 py-2.5 text-sm font-bold text-slate-900 border-x border-slate-200 min-w-12 text-center">{qty}</span>
                      <button onClick={() => setQty(qty + 1)} className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">+</button>
                    </div>
                    <button
                      onClick={handleAddToCart}
                      disabled={selectedVariant?.stock === 0}
                      className={`w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-bold transition shadow-sm disabled:opacity-40 ${
                        addedToCart ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-brand bg-white text-brand hover:bg-brand/5"
                      }`}
                    >
                      {addedToCart ? <><CheckCircle2 className="h-4 w-4" /> Added!</> : <><ShoppingCart className="h-4 w-4" /> Add to Cart</>}
                    </button>
                    <button
                      onClick={handleBuyNow}
                      disabled={selectedVariant?.stock === 0}
                      className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-white hover:bg-brand-dark transition shadow shadow-brand/20 disabled:opacity-40"
                    >
                      <Zap className="h-4 w-4" /> Buy Now
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-xs font-bold px-1 py-0.5 border-t border-slate-100 pt-2.5">
                    <a
                      href="#quote-form"
                      className="text-brand hover:underline inline-flex items-center gap-1.5"
                    >
                      <FileText className="h-3.5 w-3.5 text-brand" /> Buying in bulk? Request custom quote
                    </a>
                    <a
                      href={`https://wa.me/919211781378?text=Hi%2C%20I%27m%20interested%20in%20bulk%20pricing%20for%20${encodeURIComponent(product.name)}.%20Please%20share%20details.`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-emerald-600 hover:underline inline-flex items-center gap-1"
                    >
                      Discuss Bulk on WhatsApp →
                    </a>
                  </div>
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
                            const varImg = v.images?.find((i: any) => i.isPrimary)?.url || v.images?.[0]?.url || v.imageUrl;
                            if (varImg) setActiveImage(varImg);
                            if (v.slug) router.replace(`/products/${product.slug}?variant=${v.slug}`, { scroll: false });
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

                <div className="flex flex-col gap-3">
                  <a
                    href="#quote-form"
                    onClick={() => setInquiryType("QUOTE")}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand hover:bg-brand-dark py-3.5 text-sm font-bold text-white transition shadow shadow-brand/20"
                  >
                    <FileText className="h-4 w-4" /> Get Quote / Customize
                  </a>
                  <a
                    href={`https://wa.me/919211781378?text=Hi%2C%20I%27m%20interested%20in%20${encodeURIComponent(product.name)}.%20Please%20share%20a%20quote.`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 py-3.5 text-sm font-bold text-white transition shadow shadow-emerald-600/20"
                  >
                    <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.553 4.115 1.52 5.84L.06 23.617l5.95-1.557A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.815 9.815 0 01-5.006-1.37l-.36-.213-3.531.924.939-3.438-.235-.374A9.818 9.818 0 012.182 12C2.182 6.578 6.578 2.182 12 2.182c5.422 0 9.818 4.396 9.818 9.818 0 5.422-4.396 9.818-9.818 9.818z"/>
                    </svg>
                    WhatsApp: +91 92117 81378
                  </a>
                </div>
                <div className="flex items-center justify-between gap-4 text-xs font-bold px-1 py-0.5 border-t border-slate-100 pt-2.5 mt-2">
                  <a
                    href="#quote-form"
                    onClick={() => setInquiryType("QUOTE")}
                    className="text-brand hover:underline inline-flex items-center gap-1.5"
                  >
                    <FileText className="h-3.5 w-3.5 text-brand" /> Buying in bulk? Request custom quote
                  </a>
                  <a
                    href={`https://wa.me/919211781378?text=Hi%2C%20I%27m%20interested%20in%20bulk%20pricing%20for%20${encodeURIComponent(product.name)}.%20Please%20share%20details.`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-emerald-600 hover:underline inline-flex items-center gap-1"
                  >
                    Discuss Bulk on WhatsApp →
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Specs + Logistics card */}
          {(() => {
            const specRows: { label: string; value: string }[] = [];

            // Variant specification (admin-entered rows)
            const spec = selectedVariant?.specification;
            if (spec) {
              const rows = Array.isArray(spec)
                ? spec
                : Object.entries(spec).map(([label, value]) => ({ label, value }));
              rows.forEach((s: any) => {
                const label = s.label || s[0] || "";
                const value = String(s.value ?? s[1] ?? "");
                if (label && value) specRows.push({ label, value });
              });
            }

            // Product-level specification fallback
            const prodSpec = product.specification;
            if (!specRows.length && prodSpec) {
              const rows = Array.isArray(prodSpec)
                ? prodSpec
                : Object.entries(prodSpec).map(([label, value]) => ({ label, value }));
              rows.forEach((s: any) => {
                const label = s.label || s[0] || "";
                const value = String(s.value ?? s[1] ?? "");
                if (label && value) specRows.push({ label, value });
              });
            }

            // Logistics rows — flat fields on variant (no nested object)
            const src = selectedVariant || (product.variants?.[0] ?? null);
            if (src?.weight && Number(src.weight) > 0)                                          specRows.push({ label: "Weight", value: `${src.weight} kg` });
            if (src?.length && src?.width && src?.height && Number(src.length) > 0)             specRows.push({ label: "Dimensions (L×W×H)", value: `${src.length} × ${src.width} × ${src.height} cm` });
            if (src?.hsnCode && String(src.hsnCode).trim())                                     specRows.push({ label: "HSN Code", value: src.hsnCode });
            if (src?.packageDetails && String(src.packageDetails).trim())                       specRows.push({ label: "Package Details", value: src.packageDetails });

            if (!specRows.length) return null;

            return (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
                  <span className="h-1.5 w-5 bg-brand rounded-full" /> Technical Specifications
                </h3>
                <dl className="divide-y divide-slate-100">
                  {specRows.map((spec, i) => (
                    <div key={i} className="flex justify-between py-3 gap-4 text-sm">
                      <dt className="font-bold text-slate-500 uppercase tracking-wider text-xs shrink-0">{spec.label}</dt>
                      <dd className="text-slate-800 text-right font-medium">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            );
          })()}

          {(() => {
            const seenUrls = new Set<string>();
            const seenTitles = new Set<string>();
            // If a variant is selected, show its own docs; fall back to product-level docs.
            // Never merge both — backend may nest variant docs inside product.documents too.
            const variantDocs: any[] = selectedVariant?.documents || [];
            const sourceDocs = variantDocs.length > 0 ? variantDocs : (product.documents || []);
            const combinedDocs = sourceDocs.filter((doc: any) => {
              if (!doc || !doc.url || !doc.title) return false;
              
              const cleanUrl = doc.url.trim().toLowerCase();
              const cleanTitle = doc.title.trim().toLowerCase().replace("catalogue", "catalog");
              
              if (seenUrls.has(cleanUrl) || seenTitles.has(cleanTitle)) return false;
              
              seenUrls.add(cleanUrl);
              seenTitles.add(cleanTitle);
              return true;
            });
            if (combinedDocs.length === 0) return null;
            return (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                  <span className="h-1.5 w-5 bg-brand rounded-full" /> Technical Data Sheets
                </h3>
                {combinedDocs.map((doc: any) => (
                  <a
                    key={doc.id || doc.url}
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
            );
          })()}
        </div>
      </div>

      {/* ── Full Description + Features ── */}
      {(product.description || product.features?.length > 0) && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm mb-8">
          <div className={product.features?.length > 0 ? "grid gap-10 lg:grid-cols-[1fr_320px] items-start" : ""}>
            {/* Description */}
            {product.description && (
              <div>
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 mb-5 flex items-center gap-2">
                  <span className="h-1.5 w-5 bg-brand rounded-full" /> Product Description
                </h2>
                <div
                  className="product-desc prose prose-sm max-w-none text-slate-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}
            {/* Features sidebar */}
            {product.features?.length > 0 && (
              <div className="lg:border-l lg:border-slate-100 lg:pl-10">
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 mb-5 flex items-center gap-2">
                  <span className="h-1.5 w-5 bg-brand rounded-full" /> Key Features
                </h2>
                <ul className="space-y-3">
                  {product.features.map((f: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                      <CheckCircle2 className="h-4 w-4 text-brand mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Bulk Quote / B2B Quote Form ── */}
      <section id="quote-form" className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 shadow-sm mb-8">
        <div className="flex border-b border-slate-100 mb-6">
          <button
            type="button"
            onClick={() => { setInquiryType("QUOTE"); setLeadSuccess(false); }}
            className={`flex-1 pb-3 text-sm font-bold border-b-2 transition ${inquiryType === "QUOTE" ? "border-brand text-brand" : "border-transparent text-slate-400 hover:text-slate-600"}`}
          >
            {isB2C ? "Request Bulk / Volume Quotation" : "Request Commercial Quotation"}
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
              {inquiryType === "QUOTE" 
                ? (isB2C ? "Request Bulk Pricing Quote" : "Request Quotation & Drawings") 
                : "Customization Specifications Request"}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {inquiryType === "QUOTE" 
                ? (isB2C 
                    ? "Submit bulk quantity specifications. Engineers respond within 24 hours with volume-discount pricing." 
                    : "Submit specifications. Engineers respond within 24 hours with a detailed proposal.")
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
                  ? (isB2C 
                      ? "Specify: required quantity for bulk order, customization requirements, preferred delivery timeline, company details..." 
                      : "Specify: ISO class, dimensions (LxWxH), material (SS 304/316), airflow type, UV fixtures, quantity, installation site...")
                  : "Specify custom size, non-standard dimensions, airflow velocity tolerances, double-skin partitioning, pre-filter preferences, etc."}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:border-brand focus:bg-white transition resize-none"
              />
            </div>
            <div className="sm:col-span-2 space-y-3">
              {leadError && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700">{leadError}</div>
              )}
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

      {/* ── Reviews Section ── */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 shadow-sm mb-8 space-y-7">
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
            {expandToVariantCards(relatedProducts).map((p, i) => (
              <ProductCard key={`${p._productSlug || p.slug}-${p._variantSlug || i}`} prod={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
