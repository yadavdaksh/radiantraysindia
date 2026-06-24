"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import EmblaCarousel from "embla-carousel";
import { ProductCard } from "./ProductCard";
import { expandToVariantCards } from "@/lib/variant-cards";

interface FeaturedProductsProps {
  products: any[];
}

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  const cards = expandToVariantCards(products);
  if (!cards.length) return null;

  const emblaRef = useRef<HTMLDivElement>(null);
  const [emblaApi, setEmblaApi] = useState<any>(null);

  useEffect(() => {
    const container = emblaRef.current;
    if (!container) return;

    const api = EmblaCarousel(container, {
      loop: true,
      align: "start",
      slidesToScroll: 1,
    });

    setEmblaApi(api);

    let interval: NodeJS.Timeout;

    const startAutoplay = () => {
      interval = setInterval(() => {
        api.scrollNext();
      }, 2500);
    };

    const stopAutoplay = () => {
      clearInterval(interval);
    };

    startAutoplay();

    // Pause autoplay on mouse enter, resume on mouse leave
    container.addEventListener("mouseenter", stopAutoplay);
    container.addEventListener("mouseleave", startAutoplay);

    return () => {
      stopAutoplay();
      container.removeEventListener("mouseenter", stopAutoplay);
      container.removeEventListener("mouseleave", startAutoplay);
      api.destroy();
    };
  }, [cards.length]);

  return (
    <div className="relative w-full py-4 group/carousel">
      {/* Viewport wrapper */}
      <div className="overflow-hidden" ref={emblaRef}>
        {/* Container */}
        <div className="flex -ml-4">
          {cards.map((prod, i) => (
            <div
              key={`${prod._productSlug || prod.slug}-${prod._variantSlug || i}`}
              className="flex-[0_0_50%] sm:flex-[0_0_33.333%] md:flex-[0_0_25%] pl-2 md:pl-4 min-w-0"
            >
              <div className="h-full select-none">
                <ProductCard prod={prod} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Prev / Next navigation arrows */}
      {cards.length > 1 && (
        <>
          <button
            onClick={() => emblaApi && emblaApi.scrollPrev()}
            className="absolute -left-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-md flex items-center justify-center transition z-10 opacity-0 group-hover/carousel:opacity-100 duration-200"
            aria-label="Previous products"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => emblaApi && emblaApi.scrollNext()}
            className="absolute -right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-md flex items-center justify-center transition z-10 opacity-0 group-hover/carousel:opacity-100 duration-200"
            aria-label="Next products"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}
