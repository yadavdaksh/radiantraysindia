"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface Testimonial {
  name: string;
  company: string;
  designation?: string;
  quote: string;
  rating?: number;
}

interface TestimonialsCarouselProps {
  testimonials: Testimonial[];
}

export default function TestimonialsCarousel({ testimonials }: TestimonialsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timer = useRef<NodeJS.Timeout | null>(null);

  // Determine items per page based on viewport
  const [itemsPerPage, setItemsPerPage] = useState(1);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 640) {
        setItemsPerPage(1);
      } else if (window.innerWidth < 1024) {
        setItemsPerPage(2);
      } else {
        setItemsPerPage(3);
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalItems = testimonials.length;
  // Calculate max index to prevent empty space at the end
  const maxIndex = Math.max(0, totalItems - itemsPerPage);

  const next = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const prev = () => {
    setCurrentIndex((prev) => (prev === 0 ? maxIndex : prev - 1));
  };

  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  const start = useCallback(() => {
    stop();
    timer.current = setInterval(next, 4000); // Auto-scroll every 4 seconds
  }, [next, stop]);

  useEffect(() => {
    if (!isHovered) {
      start();
    } else {
      stop();
    }
    return stop;
  }, [currentIndex, isHovered, start, stop]);

  if (!testimonials || testimonials.length === 0) return null;

  return (
    <div
      className="relative w-full overflow-hidden py-4 px-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Slider viewport */}
      <div className="overflow-hidden">
        <motion.div
          animate={{ x: `-${currentIndex * (100 / itemsPerPage)}%` }}
          transition={{ type: "spring", stiffness: 180, damping: 24 }}
          className="flex gap-5"
          style={{ width: `${(totalItems / itemsPerPage) * 100}%` }}
        >
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-brand/20 transition-all duration-300"
              style={{ width: `calc(${100 / totalItems}% - ${(20 * (totalItems - 1)) / totalItems}px)` }}
            >
              <div>
                <div className="flex gap-0.5 mb-3">
                  {[...Array(t.rating || 5)].map((_, s) => (
                    <span key={s} className="text-amber-400 text-xs">★</span>
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
                  "{t.quote}"
                </p>
              </div>
              <div className="mt-4 flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="h-9 w-9 rounded-full bg-brand/10 flex items-center justify-center font-extrabold text-xs text-brand shrink-0">
                  {t.name?.[0] || "?"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{t.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {t.designation ? `${t.designation} · ` : ""}{t.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Navigation arrows (only if total items > items per page) */}
      {totalItems > itemsPerPage && (
        <>
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-md flex items-center justify-center transition z-10"
            aria-label="Previous testimonials"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-md flex items-center justify-center transition z-10"
            aria-label="Next testimonials"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Pagination dots */}
      {totalItems > itemsPerPage && (
        <div className="mt-6 flex justify-center gap-1.5">
          {[...Array(maxIndex + 1)].map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`rounded-full transition-all duration-300 ${
                idx === currentIndex ? "w-5 h-1.5 bg-brand" : "w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
