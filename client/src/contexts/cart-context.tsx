"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { placeholderStore, CartItem } from "@/lib/placeholder-store";
import { useAuth } from "./auth-context";
import { apiClient } from "@/lib/api-client";

interface Coupon {
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderValue?: number;
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  cartTax: number;
  cartShipping: number;
  cartTotal: number;
  coupon: Coupon | null;
  discountAmount: number;
  couponError: string | null;
  addToCart: (product: any, variant: any | null, quantity?: number) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { customer } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Sync state with localStorage on mount
  useEffect(() => {
    setCartItems(placeholderStore.getCart());
  }, []);

  // Update cart state when customer login state changes
  useEffect(() => {
    setCartItems(placeholderStore.getCart());
  }, [customer]);

  const addToCart = (product: any, variant: any | null, quantity = 1) => {
    const items = [...cartItems];
    const productId = product.id || product.slug;
    const variantId = variant ? (variant.id || variant.slug) : null;

    const existingIndex = items.findIndex(
      (item) => item.productId === productId && item.variantId === variantId
    );

    if (existingIndex >= 0) {
      items[existingIndex].quantity += quantity;
    } else {
      items.push({
        id: `ci-${Math.random().toString(36).substr(2, 9)}`,
        productId,
        variantId,
        quantity,
        product,
        variant,
      });
    }

    setCartItems(items);
    placeholderStore.saveCart(items);
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    const items = cartItems.map((item) =>
      item.id === itemId ? { ...item, quantity } : item
    );

    setCartItems(items);
    placeholderStore.saveCart(items);
  };

  const removeFromCart = (itemId: string) => {
    const items = cartItems.filter((item) => item.id !== itemId);
    setCartItems(items);
    placeholderStore.saveCart(items);
  };

  const clearCart = () => {
    setCartItems([]);
    placeholderStore.saveCart([]);
    setCoupon(null);
  };

  const applyCoupon = async (code: string): Promise<boolean> => {
    setCouponError(null);
    const cleanedCode = code.trim().toUpperCase();
    if (!cleanedCode) return false;

    try {
      const res = await apiClient.post("/coupons/validate", {
        code: cleanedCode,
        orderAmount: cartSubtotal,
      });
      const { coupon: c } = res.data.data;
      setCoupon({
        code: c.code,
        discountType: c.discountType as "PERCENTAGE" | "FIXED",
        discountValue: Number(c.discountValue),
        minOrderValue: c.minOrderValue ? Number(c.minOrderValue) : undefined,
      });
      return true;
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Invalid coupon code";
      setCouponError(msg);
      return false;
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponError(null);
  };

  // Computations
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const cartSubtotal = cartItems.reduce((acc, item) => {
    const price = Number(item.variant ? (item.variant.price || item.product.basePrice) : item.product.basePrice);
    return acc + price * item.quantity;
  }, 0);

  // Discount
  let discountAmount = 0;
  if (coupon) {
    if (coupon.discountType === "PERCENTAGE") {
      discountAmount = (cartSubtotal * coupon.discountValue) / 100;
    } else {
      discountAmount = Math.min(coupon.discountValue, cartSubtotal);
    }
  }

  const taxableAmount = Math.max(cartSubtotal - discountAmount, 0);
  const cartTax = parseFloat((taxableAmount * 0.18).toFixed(2)); // 18% Cleanroom Standard GST

  // Free shipping above 5000 INR
  const cartShipping = cartSubtotal > 0 && taxableAmount < 5000 ? 250 : 0;

  const cartTotal = parseFloat((taxableAmount + cartTax + cartShipping).toFixed(2));

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        cartSubtotal,
        cartTax,
        cartShipping,
        cartTotal,
        coupon,
        discountAmount,
        couponError,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
