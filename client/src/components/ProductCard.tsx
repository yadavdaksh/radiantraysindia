"use client";

import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";
import { getProductImage } from "@/lib/site-data";
import { useWishlist } from "@/contexts/wishlist-context";
import { cardHref } from "@/lib/variant-cards";

interface ProductCardProps {
  prod: any;
  size?: "sm" | "md";
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

export function ProductCard({ prod, size = "md" }: ProductCardProps) {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const imageUrl = prod._variantImageUrl || getProductImage(prod._productSlug || prod.slug, prod.images, prod.variants);
  const isB2C = (prod.productType || prod.type) === "B2C";
  const basePrice = Number(prod.basePrice || 0);
  const salePrice = prod.salePrice ? Number(prod.salePrice) : null;
  const inWishlist = isInWishlist(prod.slug || prod.id);
  const imgH = size === "sm" ? "h-36 sm:h-40" : "h-40 sm:h-52";
  const href = cardHref(prod);

  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-slate-200/70 bg-white shadow-sm transition-all hover:shadow-xl hover:border-brand/30 hover:-translate-y-1 duration-200 overflow-hidden relative"
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
          <span className={`absolute top-2.5 right-2.5 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
            prod.badge === "SALE"       ? "bg-rose-500 text-white"   :
            prod.badge === "NEW"        ? "bg-sky-500 text-white"    :
            prod.badge === "HOT"        ? "bg-orange-500 text-white" :
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
      <div className="flex flex-col flex-1 p-4">
        <h3 className="text-sm font-bold text-slate-900 line-clamp-2 group-hover:text-brand transition duration-150 leading-snug">
          {prod.name}
        </h3>
        <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed flex-1">
          {stripHtml(prod.shortDescription || prod.summary || "High-specification cleanroom containment system.")}
        </p>

        {/* Price / CTA row */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          {isB2C ? (
            <div className="flex items-center gap-1.5 min-w-0">
              {salePrice ? (
                <>
                  <span className="text-sm font-extrabold text-emerald-600">
                    ₹{salePrice.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-slate-400 line-through">
                    ₹{basePrice.toLocaleString("en-IN")}
                  </span>
                </>
              ) : basePrice > 0 ? (
                <span className="text-xs font-bold text-brand-dark">
                  ₹{basePrice.toLocaleString("en-IN")}
                </span>
              ) : (
                <span className="text-xs text-slate-400 font-semibold">Price on Request</span>
              )}
            </div>
          ) : (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 truncate">
              {prod.b2bInquiryLabel || "Request Quote"}
            </span>
          )}
          <span className="inline-flex shrink-0 items-center text-xs font-bold text-brand">
            Details <ArrowRight className="ml-0.5 h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
