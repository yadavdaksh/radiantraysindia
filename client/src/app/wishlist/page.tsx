"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { useWishlist } from "@/contexts/wishlist-context";
import { useAuth } from "@/contexts/auth-context";
import { apiClient } from "@/lib/api-client";
import { getProductImage } from "@/lib/site-data";
import { Heart, Trash2, ShoppingCart, ArrowRight, LogIn } from "lucide-react";
import { useCart } from "@/contexts/cart-context";

export default function WishlistPage() {
  const { wishlist, toggleWishlist } = useWishlist();
  const { customer } = useAuth();
  const { addToCart } = useCart();
  const [mounted, setMounted] = useState(false);
  const [enriched, setEnriched] = useState<any[]>([]);
  const [enriching, setEnriching] = useState(false);

  useEffect(() => setMounted(true), []);

  // For guest entries that only have productId (slug), fetch full product data
  useEffect(() => {
    if (!mounted) return;

    const needsFetch = wishlist.filter((e) => !e.product);
    if (needsFetch.length === 0) {
      setEnriched(wishlist);
      return;
    }

    setEnriching(true);
    Promise.all(
      needsFetch.map((e) =>
        apiClient
          .get(`/public/products/${e.productId}`)
          .then((r) => ({ ...e, product: r.data.data }))
          .catch(() => ({ ...e, product: { name: e.productId, slug: e.productId } }))
      )
    ).then((fetched) => {
      const map = Object.fromEntries(fetched.map((e) => [e.productId, e]));
      setEnriched(wishlist.map((e) => map[e.productId] || e));
      setEnriching(false);
    });
  }, [wishlist, mounted]);

  if (!mounted || enriching) {
    return (
      <SiteShell title="My Wishlist" subtitle="Products you've saved">
        <div className="animate-pulse space-y-4 my-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-100" />
          ))}
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell title="My Wishlist" subtitle={`${enriched.length} saved item${enriched.length !== 1 ? "s" : ""}`}>
      <div className="my-6 space-y-4">

        {/* Guest nudge */}
        {!customer && (
          <div className="flex items-center gap-4 rounded-2xl bg-brand/5 border border-brand/20 px-5 py-4">
            <LogIn className="h-5 w-5 text-brand shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800">Sign in to sync your wishlist</p>
              <p className="text-xs text-slate-500 mt-0.5">Items saved as guest are stored only on this device.</p>
            </div>
            <Link href="/login" className="shrink-0 rounded-xl bg-brand text-white text-xs font-bold px-4 py-2 hover:bg-brand-dark transition">
              Sign In
            </Link>
          </div>
        )}

        {/* Empty state */}
        {enriched.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center rounded-3xl border border-dashed border-slate-200 bg-white py-20 px-8">
            <div className="h-16 w-16 rounded-full bg-rose-50 flex items-center justify-center mb-5">
              <Heart className="h-8 w-8 text-rose-300" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-800 mb-2">Your wishlist is empty</h2>
            <p className="text-sm text-slate-500 max-w-xs">
              Browse our catalog and tap the heart icon to save products here.
            </p>
            <Link href="/products" className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-bold text-white hover:bg-brand-dark transition shadow-sm shadow-brand/20">
              Browse Products <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
              {enriched.map((entry) => {
                const prod = entry.product || {};
                const variant = entry.variant || null;
                const isB2C = (prod.productType || prod.type) === "B2C";
                const price = variant?.salePrice
                  ? Number(variant.salePrice)
                  : variant?.price
                  ? Number(variant.price)
                  : Number(prod.salePrice || prod.basePrice || 0);
                const img = variant?.images?.[0]?.url
                  || variant?.imageUrl
                  || getProductImage(prod.slug, prod.images, prod.variants);
                const slug = prod.slug || entry.productId;

                return (
                  <div key={entry.id || prod.id || slug} className="flex items-center gap-4 px-4 py-4 sm:px-6">
                    {/* Image */}
                    <Link href={`/products/${slug}`} className="shrink-0 h-16 w-16 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center p-1 hover:border-brand/30 transition">
                      <img src={img} alt={prod.name || slug} className="max-h-full max-w-full object-contain" />
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <Link href={`/products/${slug}`} className="block font-bold text-sm text-slate-900 hover:text-brand transition truncate">
                        {prod.name || slug}
                      </Link>
                      {variant?.name && (
                        <span className="inline-block rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-[10px] font-bold">
                          {variant.name}
                        </span>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${isB2C ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                          {isB2C ? "B2C" : "B2B"}
                        </span>
                        {isB2C && price > 0 && (
                          <span className="text-sm font-extrabold text-brand-dark">
                            ₹{price.toLocaleString("en-IN")}
                          </span>
                        )}
                        {!isB2C && (
                          <span className="text-xs font-bold text-amber-700">Price on Request</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isB2C ? (
                        <button
                          onClick={() => addToCart(prod, variant, 1)}
                          className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-brand text-white text-xs font-bold px-3 py-2 hover:bg-brand-dark transition"
                        >
                          <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
                        </button>
                      ) : (
                        <Link href={`/products/${slug}#quote-form`}
                          className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold px-3 py-2 hover:bg-amber-600 transition">
                          Get Quote
                        </Link>
                      )}
                      <Link href={`/products/${slug}`}
                        className="sm:hidden inline-flex items-center gap-1 rounded-xl bg-brand text-white text-xs font-bold px-3 py-2 hover:bg-brand-dark transition">
                        View
                      </Link>
                      <button
                        onClick={() => toggleWishlist(slug, null)}
                        className="h-8 w-8 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 transition"
                        aria-label="Remove from wishlist"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-400">{enriched.length} item{enriched.length !== 1 ? "s" : ""} saved</p>
              <Link href="/products" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:underline">
                Continue Shopping <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </SiteShell>
  );
}
