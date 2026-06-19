"use client";

import { ProductCard } from "./ProductCard";

interface FeaturedProductsProps {
  products: any[];
}

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  if (!products.length) return null;

  const showCarousel = products.length > 5;

  if (showCarousel) {
    // Duplicate list enough times to fill and loop seamlessly
    const items = [...products, ...products, ...products];

    return (
      <div className="relative overflow-hidden">
        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 z-10 bg-gradient-to-r from-slate-50 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 z-10 bg-gradient-to-l from-slate-50 to-transparent" />

        <div className="flex gap-5 animate-marquee" style={{ width: "max-content" }}>
          {items.map((prod, i) => (
            <div key={`${prod.slug}-${i}`} className="w-64 shrink-0">
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
            animation: marquee ${products.length * 3.5}s linear infinite;
          }
          .animate-marquee:hover {
            animation-play-state: paused;
          }
        `}</style>
      </div>
    );
  }

  // ≤5 products — responsive grid: 5 big on xl, 3 on lg, 2 on sm
  return (
    <div className="grid gap-3 sm:gap-5 grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {products.map((prod) => (
        <ProductCard key={prod.slug} prod={prod} />
      ))}
    </div>
  );
}
