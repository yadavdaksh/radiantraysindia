"use client";

import { ProductCard } from "./ProductCard";
import { expandToVariantCards } from "@/lib/variant-cards";

interface FeaturedProductsProps {
  products: any[];
}

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  const cards = expandToVariantCards(products);
  if (!cards.length) return null;

  const showCarousel = cards.length > 5;

  if (showCarousel) {
    // Duplicate list enough times to fill and loop seamlessly
    const items = [...cards, ...cards, ...cards];

    return (
      <div className="relative overflow-hidden">
        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 z-10 bg-gradient-to-r from-slate-50 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 z-10 bg-gradient-to-l from-slate-50 to-transparent" />

        <div className="flex gap-5 animate-marquee" style={{ width: "max-content" }}>
          {items.map((prod, i) => (
            <div key={`${prod._productSlug || prod.slug}-${prod._variantSlug || i}`} className="w-64 shrink-0">
              <ProductCard prod={prod} size="sm" />
            </div>
          ))}
        </div>

        <style jsx>{`
          @keyframes marquee {
            0%   { transform: translateX(0); }
            100% { transform: translateX(calc(-100% / 3)); }
          }
          .animate-marquee {
            animation: marquee ${cards.length * 3.5}s linear infinite;
          }
          .animate-marquee:hover {
            animation-play-state: paused;
          }
        `}</style>
      </div>
    );
  }

  // ≤5 cards — responsive grid
  return (
    <div className="grid gap-3 sm:gap-5 grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map((prod, i) => (
        <ProductCard key={`${prod._productSlug || prod.slug}-${prod._variantSlug || i}`} prod={prod} />
      ))}
    </div>
  );
}
