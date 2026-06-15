"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { placeholderStore } from "@/lib/placeholder-store";
import { useAuth } from "./auth-context";

interface WishlistContextType {
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { customer } = useAuth();
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    setWishlist(placeholderStore.getWishlist());
  }, []);

  useEffect(() => {
    setWishlist(placeholderStore.getWishlist());
  }, [customer]);

  const toggleWishlist = (productId: string) => {
    placeholderStore.toggleWishlist(productId);
    setWishlist(placeholderStore.getWishlist());
  };

  const isInWishlist = (productId: string) => {
    return wishlist.includes(productId);
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
