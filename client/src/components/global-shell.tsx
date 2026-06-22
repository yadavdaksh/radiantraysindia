"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import { useWishlist } from "@/contexts/wishlist-context";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, ShoppingBag, User, Heart, Search, LogOut,
  MapPin, Mail, Phone, ChevronDown, Layers,
  ArrowRight, Tag, Home,
} from "lucide-react";
import {
  IconPlant,
  IconAtom,
  IconBatteryCharging,
  IconLeaf,
  IconFlask,
  IconSparkles,
  IconFocus,
  IconDroplet,
  IconRocket,
  IconCpu,
  IconBuildingHospital,
  IconPill,
  IconTools
} from "@tabler/icons-react";
import { apiClient } from "@/lib/api-client";
import { useCategoriesNav } from "@/lib/use-categories-nav";
import { useIndustriesNav } from "@/lib/use-industries-nav";
import Image from "next/image";

const SIMPLE_NAV = [
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

export function GlobalShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { customer, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlist } = useWishlist();
  const navCategories = useCategoriesNav();
  const navIndustries = useIndustriesNav();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<"categories" | "industries" | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close nav dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    const q = searchQuery.trim();
    if (!q || q.length < 2) { setSearchResults([]); setSearchLoading(false); return; }
    setSearchLoading(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await apiClient.get("/public/products");
        const all: any[] = res.data.data || [];
        const ql = q.toLowerCase();
        const matched = all.filter((p: any) => {
          const variantNames   = (p.variants || []).map((v: any) => v.name || "").join(" ");
          const compositeNames = (p.variants || []).map((v: any) => `${p.name} — ${v.name}`).join(" ");
          return (
            p.name?.toLowerCase().includes(ql) ||
            (p.shortDescription || "").toLowerCase().includes(ql) ||
            (p.sku || "").toLowerCase().includes(ql) ||
            variantNames.toLowerCase().includes(ql) ||
            compositeNames.toLowerCase().includes(ql)
          );
        });
        // Expand to variant cards, cap at 8
        const expanded: any[] = [];
        for (const p of matched) {
          const variants: any[] = (p.variants || []).filter((v: any) => v.isActive !== false);
          if (variants.length === 0) {
            expanded.push({ ...p, _href: `/products/${p.slug}`, _displayName: p.name });
          } else {
            for (const v of variants) {
              const img = v.images?.find((i: any) => i.isPrimary)?.url || v.images?.[0]?.url || v.imageUrl
                || p.images?.find((i: any) => i.isPrimary)?.url || p.images?.[0]?.url || null;
              expanded.push({ ...p, _href: `/products/${p.slug}?variant=${v.slug}`, _displayName: `${p.name} — ${v.name}`, _img: img });
            }
          }
          if (expanded.length >= 8) break;
        }
        setSearchResults(expanded.slice(0, 8));
      } catch { setSearchResults([]); }
      finally { setSearchLoading(false); }
    }, 280);
  }, [searchQuery]);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [newsletterError, setNewsletterError] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsletterError("");
    setNewsletterSuccess(false);
    if (!newsletterEmail.includes("@")) {
      setNewsletterError("Please enter a valid email address.");
      return;
    }

    try {
      await apiClient.post("/public/newsletter/subscribe", {
        email: newsletterEmail,
      });
      setNewsletterSuccess(true);
      setNewsletterEmail("");
    } catch (err: any) {
      console.warn("Newsletter backend submission failed, saving to local store:", err);
      const subs = JSON.parse(localStorage.getItem("rr_newsletter_subscribers") || "[]");
      if (!subs.includes(newsletterEmail)) {
        subs.push(newsletterEmail);
        localStorage.setItem("rr_newsletter_subscribers", JSON.stringify(subs));
      }
      setNewsletterSuccess(true);
      setNewsletterEmail("");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(3,95,150,0.06),_transparent_30%),linear-gradient(180deg,#f8fbff_0%,#ffffff_45%,#eef7fd_100%)] text-slate-800 antialiased flex flex-col justify-between">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-brand-dark to-brand py-1.5 sm:py-2 text-center text-[10px] sm:text-xs font-semibold tracking-wider text-white px-4">
        <span>Cleanroom Manufacturing Excellence & B2B Solutions | Direct Shopping for Cleanroom Furniture</span>
      </div>

      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${scrolled
          ? "border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur"
          : "bg-transparent border-b border-transparent"
          }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 group">
              <Image src="/logo-nobg.png" alt="Radiant Rays Logo" width={110} height={110} className="w-[120px] sm:w-[150px] h-auto" />
            </Link>

            {/* Desktop Navigation */}
            <nav ref={dropdownRef} className="hidden lg:flex items-center gap-1 text-sm font-semibold text-slate-600">
              {/* Products */}
              <Link href="/products" className="px-3 py-2 rounded-xl transition hover:text-brand hover:bg-slate-50">
                Products
              </Link>

              {/* Categories dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setOpenDropdown("categories")}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button
                  className={`flex items-center gap-1 px-3 py-2 rounded-xl transition ${openDropdown === "categories" ? "text-brand bg-brand/5" : "hover:text-brand hover:bg-slate-50"}`}
                >
                  Categories
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${openDropdown === "categories" ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {openDropdown === "categories" && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-2 w-[520px] rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand">All Categories</span>
                        <Link href="/categories" onClick={() => setOpenDropdown(null)} className="text-[10px] font-bold text-slate-500 hover:text-brand flex items-center gap-0.5">
                          View all <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                      <div className="p-3 grid grid-cols-2 gap-1">
                        {navCategories.length === 0 ? (
                          <p className="col-span-2 text-xs text-slate-400 p-3">Loading categories…</p>
                        ) : navCategories.map((cat) => (
                          <div key={cat.id}>
                            <Link
                              href={`/categories/${cat.slug}`}
                              onClick={() => setOpenDropdown(null)}
                              className="flex items-start gap-3 rounded-xl p-3 hover:bg-slate-50 transition group"
                            >
                              <div className="h-8 w-8 shrink-0 rounded-xl bg-brand/10 overflow-hidden flex items-center justify-center mt-0.5">
                                {cat.imageUrl ? (
                                  <img src={cat.imageUrl} alt={cat.name} className="h-full w-full object-cover animate-fade-in" />
                                ) : (
                                  <Layers className="h-4 w-4 text-brand" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 text-xs group-hover:text-brand transition">{cat.name}</p>
                                {cat.subCategories?.length > 0 && (
                                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                    {cat.subCategories.slice(0, 3).map((s) => s.name).join(" · ")}
                                  </p>
                                )}
                              </div>
                            </Link>
                            {/* Subcategory pills */}
                            {cat.subCategories?.length > 0 && (
                              <div className="flex flex-wrap gap-1 px-3 pb-2">
                                {cat.subCategories.slice(0, 4).map((sub) => (
                                  <Link
                                    key={sub.id}
                                    href={`/products?subcategory=${sub.slug}`}
                                    onClick={() => setOpenDropdown(null)}
                                    className="text-[9px] font-bold text-slate-500 bg-slate-100 hover:bg-brand/10 hover:text-brand px-2 py-0.5 rounded-full transition"
                                  >
                                    {sub.name}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Industries dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setOpenDropdown("industries")}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button
                  className={`flex items-center gap-1 px-3 py-2 rounded-xl transition ${openDropdown === "industries" ? "text-brand bg-brand/5" : "hover:text-brand hover:bg-slate-50"}`}
                >
                  Industries
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${openDropdown === "industries" ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {openDropdown === "industries" && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-2 w-[520px] rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand">Industries</span>
                        <Link href="/industries" onClick={() => setOpenDropdown(null)} className="text-[10px] font-bold text-slate-500 hover:text-brand flex items-center gap-0.5">
                          View all <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                      <div className="p-3 grid grid-cols-2 gap-1">
                        {navIndustries.map((ind) => {
                          const cleanSlug = ind.slug.toLowerCase().trim().replace(/:/g, "").replace(/\s+/g, "-");
                          const sectorIconMap: Record<string, React.ComponentType<any>> = {
                            "high-tech-agriculture": IconPlant,
                            "nanotechnology": IconAtom,
                            "automotive-battery-manufacturing": IconBatteryCharging,
                            "cannabis-industry": IconLeaf,
                            "research-laboratory-science": IconFlask,
                            "cosmetics-perfumes": IconSparkles,
                            "optics-laser-technology": IconFocus,
                            "food-beverage": IconDroplet,
                            "aerospace-defense": IconRocket,
                            "electronics-semiconductors": IconCpu,
                            "healthcare-hospitals": IconBuildingHospital,
                            "pharmaceutical-biotechnology": IconPill,
                          };
                          const SectorIcon = sectorIconMap[cleanSlug] || IconTools;
                          return (
                            <Link
                              key={ind.slug}
                              href={`/industries/${ind.slug}`}
                              onClick={() => setOpenDropdown(null)}
                              className="flex items-center gap-3 rounded-xl p-3 hover:bg-slate-50 transition group"
                            >
                              <div className="h-8 w-8 shrink-0 rounded-xl bg-brand/5 flex items-center justify-center group-hover:bg-brand/10 transition">
                                <SectorIcon className="h-4.5 w-4.5 text-brand" stroke={1.5} />
                              </div>
                              <span className="text-xs font-semibold text-slate-800 group-hover:text-brand transition truncate">{ind.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Simple links */}
              {SIMPLE_NAV.map((item) => (
                <Link key={item.href} href={item.href} className="px-3 py-2 rounded-xl transition hover:text-brand hover:bg-slate-50">
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Header Right Actions */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* Search Toggle */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Toggle Search"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Wishlist Link — desktop only */}
              <Link
                href="/wishlist"
                className="hidden sm:flex rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 relative"
                aria-label="Wishlist"
              >
                <Heart className="h-5 w-5" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-white">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              {/* Cart — desktop only */}
              <Link
                href="/cart"
                className="hidden sm:flex rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 relative"
                aria-label="Cart"
              >
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-white animate-pulse">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Profile Dropdown */}
              <div className="relative">
                {customer ? (
                  <div className="relative">
                    <button
                      onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                      className="flex items-center gap-1 sm:gap-1.5 rounded-full border border-slate-200 bg-white p-2 sm:py-1.5 sm:pl-3 sm:pr-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
                    >
                      <User className="h-4 w-4 text-brand" />
                      <span className="max-w-24 truncate hidden sm:inline">{customer.name}</span>
                      <ChevronDown className="h-3 w-3 text-slate-400 hidden sm:inline" />
                    </button>
                    {profileDropdownOpen && (
                      <div className="absolute right-0 mt-2.5 w-48 origin-top-right rounded-2xl border border-slate-200 bg-white py-2 shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                        <div className="border-b border-slate-100 px-4 py-2 text-xs text-slate-500">
                          Account Menu
                        </div>
                        <Link
                          href="/account"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          Profile & Settings
                        </Link>
                        <Link
                          href="/account?tab=orders"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          My Orders
                        </Link>
                        <Link
                          href="/account?tab=addresses"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          Saved Addresses
                        </Link>
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            logout();
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-3 py-2 sm:px-4 sm:py-2 text-xs font-bold text-white transition hover:bg-slate-800 shadow-md whitespace-nowrap"
                  >
                    <User className="h-3.5 w-3.5" />
                    <span>Sign In</span>
                  </Link>
                )}
              </div>

              {/* Mobile Menu Trigger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
                aria-label="Toggle Mobile Menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Global Expandable Search Bar with live dropdown */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-slate-200 bg-white"
            >
              <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                <div ref={searchRef} className="relative">
                  <form onSubmit={handleSearchSubmit} className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400 pointer-events-none" />
                      {searchLoading && (
                        <span className="absolute right-3 top-3 h-5 w-5 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                      )}
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setSearchFocused(true); }}
                        onFocus={() => setSearchFocused(true)}
                        placeholder="Search biosafety cabinets, laminar flows, pass boxes..."
                        className="w-full rounded-full border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-brand focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand"
                        autoFocus
                        autoComplete="off"
                      />
                    </div>
                    <button
                      type="submit"
                      className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
                    >
                      Search
                    </button>
                  </form>

                  {/* Live results dropdown */}
                  <AnimatePresence>
                    {searchFocused && searchQuery.trim().length >= 2 && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.12 }}
                        className="absolute top-full left-0 right-[88px] mt-2 rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 z-50 overflow-hidden"
                      >
                        {searchLoading && searchResults.length === 0 ? (
                          <div className="flex items-center gap-3 px-4 py-4 text-sm text-slate-400">
                            <span className="h-4 w-4 border-2 border-brand/30 border-t-brand rounded-full animate-spin shrink-0" />
                            Searching…
                          </div>
                        ) : searchResults.length === 0 ? (
                          <div className="px-4 py-4 text-sm text-slate-400">
                            No results for <span className="font-bold text-slate-600">"{searchQuery}"</span>
                          </div>
                        ) : (
                          <>
                            <div className="px-4 pt-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                              {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
                            </div>
                            <ul>
                              {searchResults.map((item, i) => {
                                const img = item._img
                                  || item.images?.find((x: any) => x.isPrimary)?.url
                                  || item.images?.[0]?.url
                                  || null;
                                const isB2C = (item.productType || item.type) === "B2C";
                                return (
                                  <li key={`${item.slug}-${i}`}>
                                    <Link
                                      href={item._href || `/products/${item.slug}`}
                                      onClick={() => { setSearchOpen(false); setSearchQuery(""); setSearchResults([]); setSearchFocused(false); }}
                                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition group"
                                    >
                                      <div className="h-10 w-10 shrink-0 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden">
                                        {img ? (
                                          <img src={img} alt="" className="h-full w-full object-contain p-1" />
                                        ) : (
                                          <Search className="h-4 w-4 text-slate-300" />
                                        )}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-slate-800 group-hover:text-brand truncate transition">
                                          {item._displayName || item.name}
                                        </p>
                                        <p className="text-[10px] text-slate-400 truncate">
                                          {item.sku && <span className="font-mono mr-2">{item.sku}</span>}
                                          <span className={`font-bold ${isB2C ? "text-emerald-600" : "text-amber-600"}`}>{isB2C ? "B2C" : "B2B"}</span>
                                        </p>
                                      </div>
                                      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-brand shrink-0 transition" />
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                            <div className="border-t border-slate-100 px-4 py-2.5">
                              <button
                                onClick={() => { router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`); setSearchOpen(false); setSearchQuery(""); setSearchResults([]); setSearchFocused(false); }}
                                className="text-xs font-bold text-brand hover:underline"
                              >
                                See all results for "{searchQuery}" →
                              </button>
                            </div>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-[104px] bottom-0 z-30 bg-white px-6 py-6 lg:hidden flex flex-col justify-between"
          >
            <nav className="flex flex-col gap-1 text-slate-900 overflow-y-auto max-h-[65vh]">
              <Link href="/products" onClick={() => setMobileMenuOpen(false)} className="font-bold text-base py-3 border-b border-slate-100 hover:text-brand">
                Products
              </Link>
              {/* Categories with subs */}
              <div className="border-b border-slate-100 py-3">
                <Link href="/categories" onClick={() => setMobileMenuOpen(false)} className="font-bold text-base hover:text-brand block mb-2">
                  Categories
                </Link>
                {navCategories.map((cat) => (
                  <div key={cat.id} className="ml-3 mb-2">
                    <Link href={`/categories/${cat.slug}`} onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-slate-700 hover:text-brand block py-1">
                      {cat.name}
                    </Link>
                    {cat.subCategories?.length > 0 && (
                      <div className="flex flex-wrap gap-1 ml-2 mt-1">
                        {cat.subCategories.map((sub) => (
                          <Link key={sub.id} href={`/products?subcategory=${sub.slug}`} onClick={() => setMobileMenuOpen(false)}
                            className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full hover:bg-brand/10 hover:text-brand transition">
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {/* Industries */}
              <div className="border-b border-slate-100 py-3">
                <Link href="/industries" onClick={() => setMobileMenuOpen(false)} className="font-bold text-base hover:text-brand block mb-2">
                  Industries
                </Link>
                <div className="flex flex-wrap gap-1 ml-3">
                  {navIndustries.map((ind) => (
                    <Link key={ind.slug} href={`/industries/${ind.slug}`} onClick={() => setMobileMenuOpen(false)}
                      className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full hover:text-brand hover:border-brand transition">
                      {ind.name}
                    </Link>
                  ))}
                </div>
              </div>
              {SIMPLE_NAV.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} className="font-bold text-base py-3 border-b border-slate-100 hover:text-brand">
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="space-y-4">
              <div className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-4 text-sm">
                <p className="font-semibold text-slate-900">Need specifications fast?</p>
                <p className="text-slate-500">Call our direct hotline for immediate help.</p>
                <div className="mt-2 flex flex-col gap-1.5">
                  <a href="tel:+919211781378" className="font-bold text-brand flex items-center gap-1.5">
                    <Phone className="h-4 w-4" /> +91 92117 81378
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Content Container */}
      <main className="flex-1 w-full mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 pb-20 lg:pb-8" onClick={() => setOpenDropdown(null)}>
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 grid-cols-2 lg:grid-cols-4">
            {/* Col 1 */}
            <div className="space-y-4">
              <Link href="/" className="flex flex-col group">
                <Image src="/logo-nobg.png" alt="Radiant Rays Logo" width={200} height={100} className="rounded-full" />
              </Link>
              <p className="text-xs text-slate-500 leading-relaxed">
                Precision-engineered cleanroom cabinets, containment boxes, air flow benches,
                and SS modular furniture. ISO 9001 and CE compliant manufacturing.
              </p>
              <div className="flex flex-col gap-2.5 text-xs text-slate-500 pt-2">
                <span className="flex items-start gap-2">
                  <Phone className="h-3.5 w-3.5 text-brand mt-0.5" />
                  <span className="flex flex-col">
                    <a href="tel:+919211781378" className="hover:text-brand transition">+91 92117 81378</a>
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-brand" />
                  info@radiantraysindia.com
                </span>
                <span className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-brand" />
                  JAGRAM 406/21, SHANTI NAGAR, GURUGRAM, HARYANA - 122001
                </span>
              </div>
            </div>

            {/* Col 2 */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Products & Solutions
              </h4>
              <ul className="mt-4 space-y-2.5 text-xs text-slate-500">
                <li>
                  <Link href="/products" className="transition hover:text-brand">
                    All Cleanroom Catalog
                  </Link>
                </li>
                <li>
                  <Link href="/categories/biosafety-cabinets" className="transition hover:text-brand">
                    Biosafety Cabinets
                  </Link>
                </li>
                <li>
                  <Link href="/categories/laminar-air-flow" className="transition hover:text-brand">
                    Laminar Air Flow Workstations
                  </Link>
                </li>
                <li>
                  <Link href="/categories/pass-boxes" className="transition hover:text-brand">
                    Dynamic Pass Boxes
                  </Link>
                </li>
                <li>
                  <Link href="/categories/cleanroom-furniture" className="transition hover:text-brand">
                    B2C Stainless Steel Furniture
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3 */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Company & Resources
              </h4>
              <ul className="mt-4 space-y-2.5 text-xs text-slate-500">
                <li>
                  <Link href="/about" className="transition hover:text-brand">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/gallery" className="transition hover:text-brand">
                    Project Gallery
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="transition hover:text-brand">
                    Request Quote / Contact Info
                  </Link>
                </li>
                <li>
                  <Link href="/account" className="transition hover:text-brand">
                    Customer Account Panel
                  </Link>
                </li>
                <li>
                  <Link href="/shipping-policy" className="transition hover:text-brand">
                    Shipping Policy
                  </Link>
                </li>
                <li>
                  <Link href="/privacy-policy" className="transition hover:text-brand">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms-and-conditions" className="transition hover:text-brand">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/refund-policy" className="transition hover:text-brand">
                    Refund & Returns Policy
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="transition hover:text-brand">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4 */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Subscribe to Catalog Updates
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Receive specifications updates, technical guides, and regulatory notifications directly.
              </p>
              <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                <input
                  type="email"
                  required
                  placeholder="Enter work email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs placeholder-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-slate-50 focus:bg-white"
                />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-brand py-2 text-xs font-bold text-white transition hover:bg-brand-dark shadow"
                >
                  Subscribe
                </button>
              </form>
              {newsletterSuccess && (
                <p className="text-xs font-semibold text-emerald-600">
                  Thank you! You have successfully subscribed.
                </p>
              )}
              {newsletterError && (
                <p className="text-xs font-semibold text-rose-600">
                  {newsletterError}
                </p>
              )}
            </div>
          </div>

          <div className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Radiant Rays Pvt. Ltd. All rights reserved. Precision-engineered solutions for controlled contamination.
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-slate-200/80 px-4 py-2 flex items-center justify-around shadow-[0_-4px_12px_rgba(0,0,0,0.05)] pb-[calc(env(safe-area-inset-bottom)+8px)]">
        <Link href="/" className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-brand transition py-1 px-3">
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-bold">Home</span>
        </Link>
        <button onClick={() => setSearchOpen(!searchOpen)} className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-brand transition py-1 px-3">
          <Search className="h-5 w-5" />
          <span className="text-[10px] font-bold">Search</span>
        </button>
        <Link href="/cart" className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-brand transition py-1 px-3 relative">
          <ShoppingBag className="h-5 w-5" />
          {cartCount > 0 && (
            <span className="absolute top-0 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-white">
              {cartCount}
            </span>
          )}
          <span className="text-[10px] font-bold">Cart</span>
        </Link>
        <Link href="/wishlist" className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-brand transition py-1 px-3 relative">
          <Heart className="h-5 w-5" />
          {wishlist.length > 0 && (
            <span className="absolute top-0 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-white">
              {wishlist.length}
            </span>
          )}
          <span className="text-[10px] font-bold">Wishlist</span>
        </Link>
        <Link href="/account" className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-brand transition py-1 px-3">
          <User className="h-5 w-5" />
          <span className="text-[10px] font-bold">Account</span>
        </Link>
      </div>

      {/* WhatsApp float button */}
      <a
        href="https://wa.me/919211781378?text=Hello%2C%20I%20have%20an%20inquiry%20about%20your%20products."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 right-4 sm:bottom-8 sm:right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-2xl hover:scale-110 transition-transform duration-200"
        aria-label="Chat on WhatsApp"
      >
        <Image src="/whatsapp.png" alt="WhatsApp" width={56} height={56} className="w-14 h-14 rounded-full" />
      </a>
    </div>
  );
}
