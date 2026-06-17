"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "./auth-context";

export interface WishlistEntry {
  id: string;
  productId: string;
  variantId: string | null;
  product?: any;
  variant?: any;
}

interface WishlistContextType {
  wishlist: WishlistEntry[];
  toggleWishlist: (productId: string, variantId?: string | null) => Promise<void>;
  isInWishlist: (productId: string, variantId?: string | null) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);
const STORAGE_KEY = "rr_wishlist_v2";
const LEGACY_STORAGE_KEY = "rr_wishlist";

function normalizeEntry(entry: any): WishlistEntry {
  const productId = String(entry?.productId || entry?.product?.id || entry?.product?.slug || entry?.id || "");
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
  } catch {
    // fall through to legacy format
  }

  try {
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacy) return [];
    const parsed = JSON.parse(legacy);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((value) => typeof value === "string" && value.trim())
        .map((productId) => normalizeEntry({ productId, variantId: null }));
    }
  } catch {
    // ignore malformed storage
  }

  return [];
}

function saveStoredWishlist(items: WishlistEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(items.map((item) => item.productId)));
}

function sameWishlistItem(a: WishlistEntry, productId: string, variantId: string | null) {
  if (a.productId !== productId) return false;
  if (variantId != null) return a.variantId === variantId;
  return true;
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
        } catch {
          // fall back to local storage so the UI still works if the API is unavailable
        }
      }

      if (!cancelled) setWishlist(readStoredWishlist());
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [customer]);

  const syncLocal = (items: WishlistEntry[]) => {
    setWishlist(items);
    saveStoredWishlist(items);
  };

  const toggleWishlist = async (productId: string, variantId: string | null = null) => {
    const existing = wishlist.find((item) => sameWishlistItem(item, productId, variantId) || (variantId != null && item.productId === productId));

    if (customer) {
      if (existing) {
        await apiClient.delete(`/wishlist/${encodeURIComponent(productId)}`, {
          data: { variantId: variantId ?? null },
        });
      } else {
        await apiClient.post("/wishlist", {
          productId,
          variantId: variantId ?? null,
        });
      }

      const res = await apiClient.get("/wishlist");
      const items = Array.isArray(res.data.data) ? res.data.data.map(normalizeEntry) : [];
      setWishlist(items);
      return;
    }

    const next = existing
      ? wishlist.filter((item) => !sameWishlistItem(item, productId, variantId))
      : [...wishlist, normalizeEntry({ productId, variantId })];

    syncLocal(next);
  };

  const isInWishlist = (productId: string, variantId: string | null = null) => {
    if (variantId != null) {
      return wishlist.some((item) => sameWishlistItem(item, productId, variantId) || item.productId === productId);
    }
    return wishlist.some((item) => item.productId === productId);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
