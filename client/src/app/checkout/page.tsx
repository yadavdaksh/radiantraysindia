"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { apiClient } from "@/lib/api-client";
import { getProductImage } from "@/lib/site-data";
import { toast } from "sonner";
import {
  Loader2, Plus, ShieldCheck, MapPin,
  ArrowLeft, Package, ChevronRight,
} from "lucide-react";
import Script from "next/script";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Delhi", "Jammu & Kashmir", "Ladakh",
];

type Addr = {
  id: string; label: string; addressLine1: string; addressLine2?: string;
  city: string; state: string; postalCode: string; country: string; isDefault: boolean;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { customer } = useAuth();
  const {
    cartItems, cartSubtotal, cartTax, cartShipping, cartTotal,
    coupon, discountAmount, clearCart,
  } = useCart();

  const [addresses, setAddresses] = useState<Addr[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [step, setStep] = useState<"address" | "review">("address");
  const [addrLoading, setAddrLoading] = useState(true);

  // Form state
  const [label, setLabel] = useState("Home");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pin, setPin] = useState("");
  const [phone, setPhone] = useState("");

  const loadAddresses = async () => {
    try {
      const res = await apiClient.get("/addresses");
      const list: Addr[] = res.data.data || [];
      setAddresses(list);
      const def = list.find(a => a.isDefault) || list[0];
      if (def) setSelectedId(def.id);
      if (list.length === 0) setShowForm(true);
    } catch {
      setShowForm(true);
    } finally {
      setAddrLoading(false);
    }
  };

  useEffect(() => {
    if (!customer) { router.replace("/login?redirect=/checkout"); return; }
    loadAddresses();
  }, [customer, router]);

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!line1 || !city || !state || !pin) { toast.error("Fill all required fields"); return; }
    try {
      const res = await apiClient.post("/addresses", {
        label, addressLine1: line1, addressLine2: line2 || null,
        city, state, postalCode: pin, country: "India",
        isDefault: addresses.length === 0,
      });
      const added = res.data.data;
      await loadAddresses();
      setSelectedId(added.id);
      setShowForm(false);
      setLine1(""); setLine2(""); setCity(""); setState(""); setPin(""); setPhone(""); setLabel("Home");
      toast.success("Address saved");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to save address");
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedId) { toast.error("Select a shipping address"); return; }
    const addr = addresses.find(a => a.id === selectedId);
    if (!addr) return;

    setPlacing(true);
    const toastId = toast.loading("Processing your order…");

    const items = cartItems.map(item => ({
      productId: item.productId,
      variantId: item.variantId || null,
      quantity: item.quantity,
    }));

    try {
      // Create order via real API
      const orderRes = await apiClient.post("/orders", {
        customerName: customer?.name || "",
        customerEmail: customer?.email || "",
        customerPhone: customer?.phone || phone || addr.postalCode,
        items,
        shippingAddress: addr,
        billingAddress: addr,
        couponCode: coupon?.code || null,
      });

      const { order, razorpayOrder } = orderRes.data.data;

      if (razorpayOrder && (window as any).Razorpay) {
        // Real Razorpay payment
        const rzp = new (window as any).Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          order_id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: "INR",
          name: "Radiant Rays Pvt. Ltd. ",
          description: `Order ${order.orderNumber}`,
          prefill: {
            name: customer?.name,
            email: customer?.email,
            contact: customer?.phone || "",
          },
          handler: async (response: any) => {
            try {
              await apiClient.post("/orders/verify", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              clearCart();
              toast.dismiss(toastId);
              toast.success("Payment successful! Order confirmed.", { duration: 5000 });
              router.push(`/account/orders/${order.id}`);
            } catch {
              toast.dismiss(toastId);
              toast.error("Payment verification failed. Contact support.");
              setPlacing(false);
            }
          },
          modal: { ondismiss: () => { toast.dismiss(toastId); setPlacing(false); } },
        });
        rzp.open();
      } else {
        // Razorpay not available (dev/sandbox) — simulate success
        await new Promise(r => setTimeout(r, 1500));
        clearCart();
        toast.dismiss(toastId);
        toast.success("Order placed successfully!", { duration: 5000 });
        router.push(`/account/orders/${order.id}`);
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || err.message || "Order placement failed");
      setPlacing(false);
    }
  };

  if (!customer) return null;

  const selectedAddr = addresses.find(a => a.id === selectedId);
  const grandTotal = cartTotal;

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="my-6 space-y-6 max-w-5xl mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <Link href="/cart" className="flex items-center gap-1 hover:text-brand transition">
            <ArrowLeft className="h-3.5 w-3.5" /> Cart
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
          <span className="text-slate-800 font-bold">Checkout</span>
        </nav>

        {/* Step indicator */}
        <div className="flex items-center gap-3 text-xs font-bold">
          <button onClick={() => setStep("address")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition ${step === "address" ? "bg-brand text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
            <MapPin className="h-3.5 w-3.5" /> 1. Delivery Address
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
          <button onClick={() => selectedId && setStep("review")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition ${step === "review" ? "bg-brand text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
            <Package className="h-3.5 w-3.5" /> 2. Review & Pay
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* LEFT */}
          <div className="space-y-5">

            {/* STEP 1: Addresses */}
            {step === "address" && (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                  <h3 className="font-extrabold text-slate-950">Delivery Address</h3>
                  {!showForm && (
                    <button onClick={() => setShowForm(true)}
                      className="flex items-center gap-1.5 text-xs font-bold text-brand hover:text-brand-dark transition">
                      <Plus className="h-3.5 w-3.5" /> Add New
                    </button>
                  )}
                </div>

                {showForm ? (
                  <form onSubmit={handleSaveAddress} className="p-6 space-y-4">
                    <div className="flex gap-2 flex-wrap">
                      {["Home", "Office", "Factory", "Other"].map(l => (
                        <button key={l} type="button" onClick={() => setLabel(l)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${label === l ? "bg-brand text-white border-brand" : "border-slate-200 text-slate-600 hover:border-brand/40"}`}>
                          {l}
                        </button>
                      ))}
                    </div>
                    {[
                      { val: line1, set: setLine1, ph: "Address Line 1 *", req: true },
                      { val: line2, set: setLine2, ph: "Address Line 2 (optional)", req: false },
                    ].map(f => (
                      <input key={f.ph} required={f.req} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:border-brand focus:bg-white transition" />
                    ))}
                    <div className="grid sm:grid-cols-3 gap-3">
                      <input required value={city} onChange={e => setCity(e.target.value)} placeholder="City *"
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:border-brand focus:bg-white transition" />
                      <select required value={state} onChange={e => setState(e.target.value)}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:border-brand focus:bg-white transition">
                        <option value="">State *</option>
                        {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                      </select>
                      <input required value={pin} onChange={e => setPin(e.target.value)} maxLength={6} pattern="\d{6}" placeholder="PIN Code *"
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:border-brand focus:bg-white transition" />
                    </div>
                    <div className="flex gap-3">
                      {addresses.length > 0 && (
                        <button type="button" onClick={() => setShowForm(false)}
                          className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
                          Cancel
                        </button>
                      )}
                      <button type="submit"
                        className="flex-1 rounded-xl bg-brand py-3 text-sm font-extrabold text-white hover:bg-brand-dark transition shadow shadow-brand/20">
                        Save Address
                      </button>
                    </div>
                  </form>
                ) : addrLoading ? (
                  <div className="p-6 space-y-3">
                    {[1, 2].map(i => <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />)}
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {addresses.map(addr => (
                      <label key={addr.id}
                        className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition ${selectedId === addr.id ? "border-brand bg-brand/5" : "border-slate-200 hover:border-slate-300"
                          }`}>
                        <input type="radio" name="addr" checked={selectedId === addr.id}
                          onChange={() => setSelectedId(addr.id)} className="mt-1 accent-brand" />
                        <div className="flex-1 text-sm">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{addr.label}</span>
                            {addr.isDefault && <span className="text-[10px] font-extrabold bg-brand/10 text-brand px-2 py-0.5 rounded-full">Default</span>}
                          </div>
                          <p className="font-semibold text-slate-900">{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""}</p>
                          <p className="text-slate-500 text-xs mt-0.5">{addr.city}, {addr.state} — {addr.postalCode}</p>
                        </div>
                      </label>
                    ))}
                    <button
                      onClick={() => { if (!selectedId) { toast.error("Select an address first"); return; } setStep("review"); }}
                      className="w-full mt-2 rounded-xl bg-brand py-3 text-sm font-extrabold text-white hover:bg-brand-dark transition shadow shadow-brand/20">
                      Continue to Review →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Review */}
            {step === "review" && (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                  <h3 className="font-extrabold text-slate-950">Order Items</h3>
                  <span className="text-xs text-slate-400">{cartItems.length} item{cartItems.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="divide-y divide-slate-100 px-6">
                  {cartItems.map(item => {
                    const price = Number(item.variant?.price || item.product.basePrice || 0);
                    const img = getProductImage(item.product.slug, item.product.images, item.product.variants);
                    return (
                      <div key={item.id} className="py-4 flex items-center gap-4">
                        <div className="h-14 w-14 shrink-0 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-1.5">
                          <img src={img} alt={item.product.name} className="max-h-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-slate-900 truncate">{item.product.name}</p>
                          {item.variant?.name && <p className="text-[10px] text-brand font-bold">{item.variant.name}</p>}
                          <p className="text-xs text-slate-500">Qty: {item.quantity} × ₹{price.toLocaleString("en-IN")}</p>
                        </div>
                        <p className="font-extrabold text-slate-950 shrink-0">₹{(price * item.quantity).toLocaleString("en-IN")}</p>
                      </div>
                    );
                  })}
                </div>
                {selectedAddr && (
                  <div className="mx-6 mb-5 rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-brand mt-0.5 shrink-0" />
                    <div className="text-xs flex-1">
                      <p className="font-extrabold text-slate-900 uppercase tracking-wide mb-1">{selectedAddr.label} — Delivery</p>
                      <p className="text-slate-700">{selectedAddr.addressLine1}{selectedAddr.addressLine2 ? `, ${selectedAddr.addressLine2}` : ""}</p>
                      <p className="text-slate-500">{selectedAddr.city}, {selectedAddr.state} — {selectedAddr.postalCode}</p>
                    </div>
                    <button onClick={() => setStep("address")} className="text-[10px] font-bold text-brand hover:underline shrink-0">Change</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: Payment Summary */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5 sticky top-24">
              <h3 className="font-extrabold text-slate-950 border-b border-slate-100 pb-3">Payment Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-800">₹{cartSubtotal.toLocaleString("en-IN")}</span>
                </div>
                {coupon && discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Coupon ({coupon.code})</span>
                    <span>−₹{discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>GST (18%)</span>
                  <span className="font-bold text-slate-800">₹{cartTax.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping</span>
                  <span className={`font-bold ${cartShipping === 0 ? "text-emerald-600" : "text-slate-800"}`}>
                    {cartShipping === 0 ? "FREE" : `₹${cartShipping}`}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-3 flex justify-between text-base font-extrabold text-slate-950">
                  <span>Grand Total</span>
                  <span>₹{grandTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <button
                onClick={step === "address"
                  ? () => { if (!selectedId) { toast.error("Select a shipping address"); return; } setStep("review"); }
                  : handlePlaceOrder}
                disabled={placing || !selectedId}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-sm font-extrabold text-white hover:bg-brand-dark transition shadow-lg shadow-brand/20 disabled:opacity-60"
              >
                {placing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Processing Payment…</>
                ) : step === "address" ? (
                  <>Continue to Review →</>
                ) : (
                  <>Pay ₹{grandTotal.toLocaleString("en-IN")} via Razorpay</>
                )}
              </button>

              {step === "review" && (
                <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 border border-slate-100 p-3.5">
                  <ShieldCheck className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    256-bit TLS encryption. PCI-DSS compliant Razorpay gateway. Invoice dispatched via email on confirmation.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
