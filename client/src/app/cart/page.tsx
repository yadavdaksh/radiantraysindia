"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { getProductImage } from "@/lib/site-data";
import {
  ShoppingBag, Trash2, Plus, Minus, ArrowRight,
  ShieldCheck, Tag, Package, Truck, X, CheckCircle2,
} from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const { customer } = useAuth();
  const {
    cartItems, cartSubtotal, cartTax, cartShipping, cartTotal,
    coupon, discountAmount, couponError,
    updateQuantity, removeFromCart, clearCart, applyCoupon, removeCoupon,
  } = useCart();

  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    const ok = await applyCoupon(couponInput.trim());
    setCouponLoading(false);
    if (ok) {
      toast.success(`Coupon "${couponInput.trim().toUpperCase()}" applied!`);
      setCouponInput("");
    } else {
      toast.error(couponError || "Invalid coupon code");
    }
  };

  const handleRemove = (id: string, name: string) => {
    removeFromCart(id);
    toast.success(`Removed: ${name}`);
  };

  const handleClearCart = () => {
    clearCart();
    toast.info("Cart cleared");
  };

  const handleCheckout = () => {
    if (!customer) {
      toast.info("Please sign in to continue checkout");
      router.push("/login?redirect=/checkout");
    } else {
      router.push("/checkout");
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 my-6">
        <div className="h-20 w-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-5">
          <ShoppingBag className="h-9 w-9 text-slate-400" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">Your cart is empty</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-sm">
          You haven't added any cleanroom components or furniture items yet.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand/20 hover:bg-brand-dark transition"
        >
          Browse Products <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="my-6 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950">Shopping Cart</h1>
          <p className="text-sm text-slate-500 mt-0.5">{cartItems.length} item{cartItems.length !== 1 ? "s" : ""} in your cart</p>
        </div>
        <button
          onClick={handleClearCart}
          className="text-xs font-bold text-slate-400 hover:text-rose-600 transition flex items-center gap-1"
        >
          <X className="h-3.5 w-3.5" /> Clear all
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* ── Cart Items ── */}
        <div className="space-y-3">
          {cartItems.map((item) => {
            const price = Number(item.variant?.price || item.product.basePrice || 0);
            const total = price * item.quantity;
            const name = item.product.name;
            const variantName = item.variant?.name || null;
            const sku = item.variant?.sku || item.product.sku;
            const imageUrl = getProductImage(item.product.slug, item.product.images, item.product.variants);

            return (
              <div
                key={item.id}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex gap-5 items-start"
              >
                {/* Image */}
                <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden flex items-center justify-center p-2 shrink-0">
                  <img src={imageUrl} alt={name} className="max-h-full max-w-full object-contain" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <h4 className="font-bold text-slate-900 text-sm leading-snug">{name}</h4>
                  {variantName && (
                    <span className="inline-block text-[9px] font-extrabold text-brand uppercase tracking-widest bg-brand/10 px-2 py-0.5 rounded-full">
                      {variantName}
                    </span>
                  )}
                  <p className="text-[10px] text-slate-400 font-mono">SKU: {sku}</p>
                  <p className="text-sm font-extrabold text-slate-800">₹{price.toLocaleString("en-IN")}</p>
                </div>

                {/* Qty stepper */}
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="px-3 py-2.5 text-slate-500 hover:bg-white hover:text-slate-900 transition"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-10 text-center text-sm font-extrabold text-slate-900 border-x border-slate-200">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="px-3 py-2.5 text-slate-500 hover:bg-white hover:text-slate-900 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Total + remove */}
                <div className="text-right space-y-2 shrink-0">
                  <p className="font-extrabold text-slate-950">₹{total.toLocaleString("en-IN")}</p>
                  <button
                    onClick={() => handleRemove(item.id, name)}
                    className="text-slate-300 hover:text-rose-500 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Order Summary ── */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5 sticky top-24">
            <h3 className="text-base font-extrabold text-slate-950 border-b border-slate-100 pb-3">Order Summary</h3>

            {/* Pricing rows */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span className="font-bold text-slate-800">₹{cartSubtotal.toLocaleString("en-IN")}</span>
              </div>
              {coupon && discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5" /> {coupon.code}
                  </span>
                  <span>−₹{discountAmount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>GST (18%)</span>
                <span className="font-bold text-slate-800">₹{cartTax.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" /> Shipping</span>
                <span className={`font-bold ${cartShipping === 0 ? "text-emerald-600" : "text-slate-800"}`}>
                  {cartShipping === 0 ? "FREE" : `₹${cartShipping}`}
                </span>
              </div>
              {cartShipping > 0 && (
                <p className="text-[10px] text-slate-400">Add ₹{(5000 - cartSubtotal).toLocaleString("en-IN")} more for free shipping</p>
              )}
              <div className="border-t border-slate-200 pt-3 flex justify-between text-base font-extrabold text-slate-950">
                <span>Total</span>
                <span>₹{cartTotal.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Coupon */}
            {!coupon ? (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Coupon code"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-xs font-mono font-bold uppercase focus:outline-none focus:border-brand transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={couponLoading || !couponInput}
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition disabled:opacity-50"
                >
                  {couponLoading ? "..." : "Apply"}
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5">
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span className="text-xs font-bold">{coupon.code} applied</span>
                </div>
                <button
                  onClick={() => { removeCoupon(); toast.info("Coupon removed"); }}
                  className="text-slate-400 hover:text-rose-600 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <button
              onClick={handleCheckout}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-sm font-extrabold text-white hover:bg-brand-dark transition shadow-lg shadow-brand/20"
            >
              Proceed to Checkout <ArrowRight className="h-4.5 w-4.5" />
            </button>

            {/* Trust */}
            <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 border border-slate-100 p-3.5">
              <ShieldCheck className="h-5 w-5 text-brand shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Secured by 256-bit TLS encryption. All prices include 18% GST. Free shipping above ₹5,000.
              </p>
            </div>
          </div>

          {/* Perks */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Package, label: "Factory Direct" },
              { icon: Truck, label: "Pan-India Delivery" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600">
                <Icon className="h-3.5 w-3.5 text-brand" /> {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
