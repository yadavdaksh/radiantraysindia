"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "./auth-context";

export interface WishlistEntry {
  id: string;
  productId: string; // always slug when possible
  variantId: string | null;
  product?: any;
  variant?: any;
}

interface WishlistContextType {
  wishlist: WishlistEntry[];
  toggleWishlist: (productSlugOrId: string, variantId?: string | null) => Promise<void>;
  isInWishlist: (productSlugOrId: string, variantId?: string | null) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);
const STORAGE_KEY = "rr_wishlist_v2";
const LEGACY_STORAGE_KEY = "rr_wishlist";

// Always prefer slug over cuid for productId key
function extractProductKey(entry: any): string {
  return String(
    entry?.product?.slug ||
    entry?.productId ||
    entry?.product?.id ||
    entry?.id ||
    ""
  );
}

function normalizeEntry(entry: any): WishlistEntry {
  const productId = extractProductKey(entry);
  const variantId = entry?.variantId ?? entry?.variant?.id ?? null;
  return {
    id: entry?.id || `${productId}:${variantId || "base"}`,
    productId,
    variantId,
    product: entry?.product,
    variant: entry?.variant,
  };
}

function readStoredWishlist(): WishlistEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(normalizeEntry).filter((item) => item.productId);
    }
  } catch { /* fall through */ }
  try {
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacy) return [];
    const parsed = JSON.parse(legacy);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((v) => typeof v === "string" && v.trim())
        .map((productId) => normalizeEntry({ productId, variantId: null }));
    }
  } catch { /* ignore */ }
  return [];
}

function saveStoredWishlist(items: WishlistEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(items.map((i) => i.productId)));
}

// Check if two keys refer to same product (slug == slug, or slug == product.slug in entry)
function keyMatches(item: WishlistEntry, key: string): boolean {
  if (item.productId === key) return true;
  if (item.product?.slug && item.product.slug === key) return true;
  if (item.product?.id && item.product.id === key) return true;
  return false;
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { customer } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (customer) {
        try {
          const res = await apiClient.get("/wishlist");
          const items = Array.isArray(res.data.data) ? res.data.data.map(normalizeEntry) : [];
          if (!cancelled) setWishlist(items);
          return;
        } catch { /* fall back */ }
      }
      if (!cancelled) setWishlist(readStoredWishlist());
    };
    load();
    return () => { cancelled = true; };
  }, [customer]);

  const syncLocal = (items: WishlistEntry[]) => {
    setWishlist(items);
    saveStoredWishlist(items);
  };

  const toggleWishlist = async (productSlugOrId: string, variantId: string | null = null) => {
    const existing = wishlist.find((item) => keyMatches(item, productSlugOrId));

    if (customer) {
      try {
        if (existing) {
          // use the stored productId for the API call (server accepts slug OR id)
          await apiClient.delete(`/wishlist/${encodeURIComponent(existing.productId)}`, {
            data: { variantId: variantId ?? null },
          });
        } else {
          await apiClient.post("/wishlist", {
            productId: productSlugOrId,
            variantId: variantId ?? null,
          });
        }
        const res = await apiClient.get("/wishlist");
        const items = Array.isArray(res.data.data) ? res.data.data.map(normalizeEntry) : [];
        setWishlist(items);
      } catch (e) {
        throw e;
      }
      return;
    }

    // Guest: localStorage
    const next = existing
      ? wishlist.filter((item) => !keyMatches(item, productSlugOrId))
      : [...wishlist, normalizeEntry({ productId: productSlugOrId, variantId })];
    syncLocal(next);
  };

  const isInWishlist = (productSlugOrId: string) => {
    return wishlist.some((item) => keyMatches(item, productSlugOrId));
  };

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) throw new Error("useWishlist must be used within a WishlistProvider");
  return context;
}
