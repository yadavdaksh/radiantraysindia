"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timer = useRef<NodeJS.Timeout | null>(null);

  const next = useCallback(() => { setDirection(1); setCurrentIndex((p) => (p + 1) % slides.length); }, [slides.length]);
  const prev = () => { setDirection(-1); setCurrentIndex((p) => (p - 1 + slides.length) % slides.length); };
  const dot = (i: number) => { setDirection(i > currentIndex ? 1 : -1); setCurrentIndex(i); };

  const stop = useCallback(() => { if (timer.current) clearInterval(timer.current); }, []);
  const start = useCallback(() => { stop(); timer.current = setInterval(next, 5000); }, [next, stop]);

  useEffect(() => { if (!isHovered) start(); else stop(); return stop; }, [currentIndex, isHovered, start, stop]);

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
    center: {
      x: 0, opacity: 1,
      transition: { x: { type: "spring" as const, stiffness: 280, damping: 28 }, opacity: { duration: 0.35 } },
    },
    exit: (d: number) => ({
      x: d < 0 ? "100%" : "-100%", opacity: 0,
      transition: { x: { type: "spring" as const, stiffness: 280, damping: 28 }, opacity: { duration: 0.3 } },
    }),
  };

  const slide = slides[currentIndex];
  const hasDesktop = !!slide.desktopImageUrl;
  const hasMobile = !!slide.mobileImageUrl;
  const gradClass = FALLBACK_GRADIENTS[currentIndex % FALLBACK_GRADIENTS.length];

  return (
    /* Outer wrapper — same max-width/padding as page content so card sits inside page margins */
    <div className="w-full bg-white py-4 sm:py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Card — aspect matches 1600:560 on desktop, 768:400 on mobile */}
        <div
          className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl aspect-[4/5] sm:aspect-[16/7] md:aspect-[1920/600]"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Fallback gradient base (always under the image) */}
          <div className={`absolute inset-0 bg-gradient-to-r ${gradClass}`} />

          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0"
            >
              {(() => {
                const SlideContent = () => (
                  <>
                    {/* ── With image: fill card ── */}
                    {(hasDesktop || hasMobile) ? (
                      <>
                        {/* Desktop image */}
                        {hasDesktop && (
                          <img
                            src={slide.desktopImageUrl}
                            alt={slide.title}
                            className="hidden md:block absolute inset-0 w-full h-full object-cover object-center select-none"
                          />
                        )}
                        {/* Mobile image */}
                        {hasMobile && (
                          <img
                            src={slide.mobileImageUrl}
                            alt={slide.title}
                            className="block md:hidden absolute inset-0 w-full h-full object-cover object-center select-none"
                          />
                        )}
                        {/* Fallback to desktop on mobile if no mobile image */}
                        {hasDesktop && !hasMobile && (
                          <img
                            src={slide.desktopImageUrl}
                            alt={slide.title}
                            className="block md:hidden absolute inset-0 w-full h-full object-cover object-center select-none"
                          />
                        )}


                      </>
                    ) : (
                      /* ── No image: styled gradient card like screenshot ── */
                      <>
                        {/* Subtle pattern */}
                        <div className="absolute inset-0 opacity-10"
                          style={{ backgroundImage: "radial-gradient(circle at 25% 50%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 75% 50%, rgba(255,255,255,0.15) 0%, transparent 50%)" }}
                        />
                        {/* Dot grid */}
                        <div className="absolute inset-0 opacity-[0.06]"
                          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }}
                        />

                        {/* Centered content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 sm:px-20 space-y-3 sm:space-y-4">
                          <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
                            className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/25 px-3 py-1 text-[10px] sm:text-xs font-bold text-white/90 uppercase tracking-widest"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                            Radiant Rays Pvt. Ltd.
                          </motion.div>
                          <motion.h2
                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.45 }}
                            className="text-xl sm:text-3xl lg:text-[2.6rem] font-extrabold text-white tracking-tight leading-tight max-w-3xl"
                          >
                            {slide.title}
                          </motion.h2>
                          {slide.subtitle && (
                            <motion.p
                              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.45 }}
                              className="text-[11px] sm:text-sm text-white/75 max-w-xl leading-relaxed"
                            >
                              {slide.subtitle}
                            </motion.p>
                          )}
                        </div>
                      </>
                    )}
                  </>
                );

                return (
                  <div className="absolute inset-0">
                    {slide.linkUrl && (
                      <Link href={slide.linkUrl} className="absolute inset-0 z-10 cursor-pointer" />
                    )}
                    <SlideContent />
                  </div>
                );
              })()}
            </motion.div>
          </AnimatePresence>

          {/* Prev / Next arrows */}
          {slides.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-full bg-black/25 hover:bg-black/45 text-white transition z-20 backdrop-blur-sm"
                aria-label="Previous"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-full bg-black/25 hover:bg-black/45 text-white transition z-20 backdrop-blur-sm"
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
                  onClick={() => dot(i)}
                  className={`rounded-full transition-all duration-300 ${i === currentIndex ? "w-7 h-2 bg-white" : "w-2 h-2 bg-white/40 hover:bg-white/70"
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
