"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Image as ImageIcon, CheckCircle } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { gallery as mockGallery } from "@/lib/site-data";
import { motion, AnimatePresence } from "framer-motion";

export default function GalleryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    async function fetchGallery() {
      try {
        const res = await apiClient.get("/public/gallery");
        const list = res.data.data || res.data || [];
        setItems(list);
      } catch (err) {
        console.warn("Could not load gallery from API, using fallback:", err);
        setItems(mockGallery.map((g, i) => ({
          id: String(i),
          title: g.title,
          category: g.category || "Installation",
          description: g.description,
          imageUrl: null,
        })));
      } finally {
        setLoading(false);
      }
    }
    fetchGallery();
  }, []);

  // Get unique categories for filters
  const categories = ["all", ...Array.from(new Set(items.map((item) => item.category?.toLowerCase() || "installation")))];

  // Filtered items
  const filteredItems = activeTab === "all"
    ? items
    : items.filter((item) => (item.category?.toLowerCase() || "installation") === activeTab);

  if (loading) {
    return (
      <div className="space-y-6 my-8 animate-pulse">
        <div className="h-4 bg-slate-100 rounded w-36" />
        <div className="h-8 bg-slate-100 rounded w-72" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-8 bg-slate-100 rounded-full w-24" />)}
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-3xl bg-slate-100 h-64 overflow-hidden" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 my-8">
      {/* Premium Hero Header */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-950 via-[#041f35] to-[#062f50] text-white p-8 sm:p-12 shadow-xl border border-slate-800">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "32px 32px" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(3,95,150,0.3),transparent_65%)]" />
        <div className="relative space-y-4 max-w-2xl">

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Our Floor Deployments &{" "}
            <span className="text-brand-light">Engineering Projects</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Take a look inside real diagnostic labs, sterile pharma production lines, and cleanroom facilities powered by Radiant Rays custom containment units and SS modular furniture.
          </p>
        </div>
      </section>

      {/* Tabs Filter */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-200">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition ${activeTab === cat
                  ? "bg-brand text-white shadow-md shadow-brand/15"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-brand/40 hover:text-brand"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Gallery Cards Grid */}
      <AnimatePresence mode="popLayout">
        {filteredItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center text-center p-16 border border-dashed border-slate-200 bg-white rounded-3xl"
          >
            <ImageIcon className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-500">No project snapshots in this category.</p>
            <p className="text-xs text-slate-400 mt-1">Check back later or view all projects.</p>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filteredItems.map((item: any) => (
              <motion.article
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                key={item.id}
                className="group rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Image Frame */}
                  {item.imageUrl ? (
                    <div className="aspect-[4/3] overflow-hidden bg-slate-50 border-b border-slate-100">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] bg-gradient-to-br from-brand/12 to-slate-200/50 flex flex-col items-center justify-center border-b border-slate-100 text-center p-4">
                      <ImageIcon className="h-8 w-8 text-brand/30 mb-2" />
                      <span className="text-[10px] font-extrabold text-brand/60 uppercase tracking-widest">
                        {item.category || "Installation"}
                      </span>
                    </div>
                  )}

                  {/* Info details */}
                  <div className="p-6 space-y-2">
                    {item.category && (
                      <span className="inline-block text-[9px] font-extrabold uppercase tracking-widest text-brand bg-brand/10 rounded-full px-3 py-1">
                        {item.category}
                      </span>
                    )}
                    <h2 className="font-bold text-slate-900 text-base leading-snug group-hover:text-brand transition duration-150">
                      {item.title}
                    </h2>
                    {item.description && (
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">
                    <CheckCircle className="h-3.5 w-3.5" /> Handover Complete
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA Box */}
      <div className="rounded-[2rem] bg-slate-900 text-white p-8 relative overflow-hidden shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_120%,rgba(3,95,150,0.3),transparent_70%)]" />
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <p className="font-extrabold text-white text-base">Planning a cleanroom facility upgrade?</p>
            <p className="text-xs text-slate-400">Get custom specification configurations, CAD blocks, and direct quotes from our engineers.</p>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3.5 text-xs font-bold text-white hover:bg-brand-dark transition shadow-lg shadow-brand/20"
          >
            Request Quotation <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
