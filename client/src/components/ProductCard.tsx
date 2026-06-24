"use client";

import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";
import { getProductImage } from "@/lib/site-data";
import { useWishlist } from "@/contexts/wishlist-context";
import { cardHref } from "@/lib/variant-cards";

interface ProductCardProps {
  prod: any;
  size?: "sm" | "md";
  layout?: "grid" | "list";
}

function stripHtml(html: string) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function ProductCard({ prod, size = "md", layout = "grid" }: ProductCardProps) {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const imageUrl = prod._variantImageUrl || getProductImage(prod._productSlug || prod.slug, prod.images, prod.variants);
  const isB2C = (prod.productType || prod.type) === "B2C";
  const basePrice = Number(prod.basePrice || 0);
  const salePrice = prod.salePrice ? Number(prod.salePrice) : null;
  const inWishlist = isInWishlist(prod.slug || prod.id);
  const imgH = size === "sm" ? "h-36 sm:h-40" : "h-40 sm:h-52";
  const href = cardHref(prod);

  if (layout === "list") {
    return (
      <Link
        href={href}
        className="group flex flex-row rounded-2xl border border-slate-200/70 bg-white shadow-sm transition-all hover:shadow-xl hover:border-brand/30 duration-200 overflow-hidden relative p-3 sm:p-4 gap-4 items-center w-full"
      >
        {/* Left side: Image */}
        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden flex items-center justify-center p-2 shrink-0 relative">
          <img
            src={imageUrl}
            alt={prod.name}
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-300"
          />
          {prod.badge && (
            <span className={`absolute top-1.5 left-1.5 rounded-full px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider ${
              prod.badge === "SALE" ? "bg-rose-500 text-white" :
              prod.badge === "NEW" ? "bg-sky-500 text-white" :
              prod.badge === "HOT" ? "bg-orange-500 text-white" :
              prod.badge === "BESTSELLER" ? "bg-violet-500 text-white" :
              "bg-slate-700 text-white"
            }`}>
              {prod.badge}
            </span>
          )}
        </div>

        {/* Right side: Body content */}
        <div className="flex flex-col flex-1 min-w-0 justify-between">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-brand transition duration-150 leading-snug">
              {prod.name}
            </h3>
            <p className="mt-1 text-[11px] sm:text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {stripHtml(prod.shortDescription || prod.summary || "High-specification cleanroom containment system.")}
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
            {isB2C ? (
              <div className="flex items-baseline flex-wrap gap-x-1.5 gap-y-0.5 min-w-0">
                {salePrice ? (
                  <>
                    <span className="text-xs sm:text-sm font-extrabold text-emerald-600 whitespace-nowrap">
                      ₹{salePrice.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] text-slate-400 line-through whitespace-nowrap">
                      ₹{basePrice.toLocaleString("en-IN")}
                    </span>
                  </>
                ) : basePrice > 0 ? (
                  <span className="text-xs font-bold text-brand-dark whitespace-nowrap">
                    ₹{basePrice.toLocaleString("en-IN")}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Price on Request</span>
                )}
              </div>
            ) : (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 truncate">
                {prod.b2bInquiryLabel || "Request Quote"}
              </span>
            )}
            <span className="inline-flex shrink-0 items-center text-xs font-bold text-brand">
              <span className="hidden sm:inline mr-0.5">Details</span> <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>

        {/* Wishlist Button absolute top-3 right-3 */}
        <button
          onClick={(e) => { e.preventDefault(); toggleWishlist(prod.slug || prod.id, null); }}
          className="absolute top-3 right-3 h-7 w-7 flex items-center justify-center rounded-full bg-white/90 shadow-sm border border-slate-200/60 text-slate-400 hover:text-rose-600 transition"
          aria-label="Toggle wishlist"
        >
          <Heart className={`h-3.5 w-3.5 ${inWishlist ? "fill-rose-600 text-rose-600" : ""}`} />
        </button>
      </Link>
    );
  }

  // Default Grid Layout
  return (
    <Link
      href={href}
      className="group flex flex-col h-full rounded-2xl border border-slate-200/70 bg-white shadow-sm transition-all hover:shadow-xl hover:border-brand/30 hover:-translate-y-1 duration-200 overflow-hidden relative"
    >
      {/* Image */}
      <div className={`w-full ${imgH} bg-slate-50 border-b border-slate-100 overflow-hidden flex items-center justify-center p-4 relative`}>
        <img
          src={imageUrl}
          alt={prod.name}
          className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-300"
        />

        {/* NEW/SALE/HOT badge */}
        {prod.badge && (
          <span className={`absolute top-2.5 right-2.5 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${prod.badge === "SALE" ? "bg-rose-500 text-white" :
            prod.badge === "NEW" ? "bg-sky-500 text-white" :
              prod.badge === "HOT" ? "bg-orange-500 text-white" :
                prod.badge === "BESTSELLER" ? "bg-violet-500 text-white" :
                  "bg-slate-700 text-white"
            }`}>
            {prod.badge}
          </span>
        )}

        {/* Wishlist */}
        <button
          onClick={(e) => { e.preventDefault(); toggleWishlist(prod.slug || prod.id, null); }}
          className="absolute bottom-2.5 right-2.5 h-7 w-7 flex items-center justify-center rounded-full bg-white/90 shadow-sm border border-slate-200/60 text-slate-400 hover:text-rose-600 transition"
          aria-label="Toggle wishlist"
        >
          <Heart className={`h-3.5 w-3.5 ${inWishlist ? "fill-rose-600 text-rose-600" : ""}`} />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 md:p-4 p-2">
        <h3 className="text-xs md:text-sm font-bold text-slate-900 line-clamp-2 group-hover:text-brand transition duration-150 leading-snug">
          {prod.name}
        </h3>
        <p className="mt-1.5 text-[11px] md:text-xs text-slate-500 line-clamp-2 leading-relaxed flex-1">
          {stripHtml(prod.shortDescription || prod.summary || "High-specification cleanroom containment system.")}
        </p>

        {/* Price / CTA row */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
          {isB2C ? (
            <div className="flex items-baseline flex-wrap gap-x-1.5 gap-y-0.5 min-w-0">
              {salePrice ? (
                <>
                  <span className="text-sm font-extrabold text-emerald-600 whitespace-nowrap">
                    ₹{salePrice.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-slate-400 line-through whitespace-nowrap">
                    ₹{basePrice.toLocaleString("en-IN")}
                  </span>
                </>
              ) : basePrice > 0 ? (
                <span className="text-xs font-bold text-brand-dark whitespace-nowrap">
                  ₹{basePrice.toLocaleString("en-IN")}
                </span>
              ) : (
                <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Price on Request</span>
              )}
            </div>
          ) : (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 truncate">
              {prod.b2bInquiryLabel || "Request Quote"}
            </span>
          )}
          <span className="inline-flex shrink-0 items-center text-xs font-bold text-brand">
            <span className="hidden sm:inline mr-0.5">Details</span> <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
