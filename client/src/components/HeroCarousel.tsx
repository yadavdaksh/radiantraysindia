"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import EmblaCarousel from "embla-carousel";

interface Banner {
  id: string;
  title: string;
  subtitle?: string | null;
  desktopImageUrl: string;
  mobileImageUrl: string;
  linkUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

interface HeroCarouselProps {
  banners: Banner[];
}

const FALLBACK_BANNERS: Banner[] = [
  {
    id: "fallback-1",
    title: "Precision Containment Systems for Sterile Environments",
    subtitle: "Cleanroom cabinets, biosafety units, LAFs, pass boxes, and custom SS furniture — engineered for pharma and biotech.",
    desktopImageUrl: "",
    mobileImageUrl: "",
    linkUrl: "/products",
  },
  {
    id: "fallback-2",
    title: "GMP Compliant Cleanroom Furniture & Access Systems",
    subtitle: "ISO Class 1–9 compliant air showers, pass boxes, cross-over benches, and dynamic containment chambers.",
    desktopImageUrl: "",
    mobileImageUrl: "",
    linkUrl: "/categories",
  },
  {
    id: "fallback-3",
    title: "ISO 9001:2015 Certified · Factory Direct · Pan-India",
    subtitle: "15+ years of engineering expertise. Trusted by 500+ pharmaceutical, biotech, and hospital facilities.",
    desktopImageUrl: "",
    mobileImageUrl: "",
    linkUrl: "/contact",
  },
];

// Gradient backgrounds cycling per fallback slide
const FALLBACK_GRADIENTS = [
  "from-[#035F96] via-[#024d79] to-[#021f35]",
  "from-[#1a4a6e] via-[#0d3a5c] to-[#072a45]",
  "from-[#0a3d5c] via-[#054e7a] to-[#023560]",
];

export default function HeroCarousel({ banners }: HeroCarouselProps) {
  const slides = banners && banners.length > 0 ? banners : FALLBACK_BANNERS;
  const emblaRef = useRef<HTMLDivElement>(null);
  const [emblaApi, setEmblaApi] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const isDragging = useRef(false);

  useEffect(() => {
    if (!emblaRef.current) return;

    const api = EmblaCarousel(emblaRef.current, {
      loop: true,
      align: "start",
      slidesToScroll: 1,
    });

    setEmblaApi(api);

    const onSelect = () => {
      setCurrentIndex(api.selectedScrollSnap());
    };

    api.on("select", onSelect);
    api.on("pointerDown", () => {
      isDragging.current = false;
    });
    api.on("pointerUp", () => {
      // Small delay to prevent link click if it was a drag
      setTimeout(() => {
        isDragging.current = false;
      }, 50);
    });

    let interval: NodeJS.Timeout;

    const startAutoplay = () => {
      interval = setInterval(() => {
        api.scrollNext();
      }, 5000);
    };

    const stopAutoplay = () => {
      clearInterval(interval);
    };

    startAutoplay();

    // Pause on hover
    emblaRef.current.addEventListener("mouseenter", stopAutoplay);
    emblaRef.current.addEventListener("mouseleave", startAutoplay);

    return () => {
      stopAutoplay();
      api.destroy();
    };
  }, [slides.length]);

  return (
    <div className="w-full bg-white py-4 sm:py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl aspect-[4/5] sm:aspect-[16/7] md:aspect-[1920/600] group/carousel"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Embla Viewport */}
          <div className="overflow-hidden h-full w-full" ref={emblaRef}>
            {/* Embla Container */}
            <div className="flex h-full w-full">
              {slides.map((slide, index) => {
                const hasDesktop = !!slide.desktopImageUrl;
                const hasMobile = !!slide.mobileImageUrl;
                const gradClass = FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length];

                return (
                  <div
                    key={slide.id || index}
                    className="flex-[0_0_100%] min-w-0 h-full w-full relative select-none"
                  >
                    {/* Fallback gradient base */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${gradClass}`} />

                    {/* Image handling */}
                    {(hasDesktop || hasMobile) ? (
                      <>
                        {hasDesktop && (
                          <img
                            src={slide.desktopImageUrl}
                            alt={slide.title}
                            className="hidden md:block absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
                          />
                        )}
                        {hasMobile && (
                          <img
                            src={slide.mobileImageUrl}
                            alt={slide.title}
                            className="block md:hidden absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
                          />
                        )}
                        {hasDesktop && !hasMobile && (
                          <img
                            src={slide.desktopImageUrl}
                            alt={slide.title}
                            className="block md:hidden absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
                          />
                        )}
                      </>
                    ) : (
                      <>
                        {/* Subtle pattern */}
                        <div
                          className="absolute inset-0 opacity-10"
                          style={{
                            backgroundImage:
                              "radial-gradient(circle at 25% 50%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 75% 50%, rgba(255,255,255,0.15) 0%, transparent 50%)",
                          }}
                        />
                        {/* Dot grid */}
                        <div
                          className="absolute inset-0 opacity-[0.06]"
                          style={{
                            backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
                            backgroundSize: "28px 28px",
                          }}
                        />

                        {/* Centered content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 sm:px-20 space-y-3 sm:space-y-4">
                          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/25 px-3 py-1 text-[10px] sm:text-xs font-bold text-white/90 uppercase tracking-widest">
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                            Radiant Rays Pvt. Ltd.
                          </div>
                          <h2 className="text-xl sm:text-3xl lg:text-[2.6rem] font-extrabold text-white tracking-tight leading-tight max-w-3xl">
                            {slide.title}
                          </h2>
                          {slide.subtitle && (
                            <p className="text-[11px] sm:text-sm text-white/75 max-w-xl leading-relaxed">
                              {slide.subtitle}
                            </p>
                          )}
                        </div>
                      </>
                    )}

                    {/* Link overlay */}
                    {slide.linkUrl && (
                      <Link
                        href={slide.linkUrl}
                        onClick={(e) => {
                          if (isDragging.current) {
                            e.preventDefault();
                          }
                        }}
                        className="absolute inset-0 z-10 cursor-pointer"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Prev / Next arrows */}
          {slides.length > 1 && (
            <>
              <button
                onClick={() => emblaApi && emblaApi.scrollPrev()}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-full bg-black/25 hover:bg-black/45 text-white transition z-20 backdrop-blur-sm opacity-0 group-hover/carousel:opacity-100 duration-200"
                aria-label="Previous"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => emblaApi && emblaApi.scrollNext()}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-full bg-black/25 hover:bg-black/45 text-white transition z-20 backdrop-blur-sm opacity-0 group-hover/carousel:opacity-100 duration-200"
                aria-label="Next"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Dot indicators */}
          {slides.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => emblaApi && emblaApi.scrollTo(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === currentIndex ? "w-7 h-2 bg-white" : "w-2 h-2 bg-white/40 hover:bg-white/70"
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
