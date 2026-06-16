"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { useAuth } from "@/contexts/auth-context";
import { apiClient } from "@/lib/api-client";
import { getProductImage } from "@/lib/site-data";
import { toast } from "sonner";
import {
  ArrowLeft, Printer, Truck, CheckCircle2, Clock,
  XCircle, MapPin, User, CreditCard,
  ExternalLink, RotateCcw, Loader2,
} from "lucide-react";

function statusColor(s: string) {
  if (s === "DELIVERED") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (s === "CANCELLED" || s === "REFUNDED") return "bg-rose-100 text-rose-800 border-rose-200";
  if (s === "SHIPPED") return "bg-sky-100 text-sky-800 border-sky-200";
  if (s === "PAID" || s === "PROCESSING") return "bg-violet-100 text-violet-800 border-violet-200";
  return "bg-amber-100 text-amber-800 border-amber-200";
}

const TIMELINE_STEPS = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED"];

// ── Modal helper ─────────────────────────────────────────────────────────────
function ReasonModal({
  title, subtitle, confirmLabel, confirmClass, onConfirm, onClose, busy,
}: {
  title: string; subtitle: string; confirmLabel: string; confirmClass: string;
  onConfirm: (reason: string) => void; onClose: () => void; busy: boolean;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-950">{title}</h3>
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Reason *</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              autoFocus
              placeholder="Please describe your reason in detail..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:border-brand focus:bg-white transition resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
              Cancel
            </button>
            <button
              type="button"
              disabled={!reason.trim() || busy}
              onClick={() => onConfirm(reason.trim())}
              className={`flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition disabled:opacity-50 ${confirmClass}`}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { customer } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState(false);
  const [returnModal, setReturnModal] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  const loadOrder = useCallback(() => {
    apiClient.get(`/orders/mine/${params.id}`)
      .then(r => setOrder(r.data.data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    if (!customer) { router.push(`/login?redirect=/account/orders/${params.id}`); return; }
    loadOrder();
  }, [customer, params.id, loadOrder, router]);

  const handleCancel = async (reason: string) => {
    setActionBusy(true);
    try {
      await apiClient.post(`/orders/mine/${params.id}/cancel`, { reason });
      toast.success("Order cancelled successfully");
      setCancelModal(false);
      loadOrder();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Cancel failed");
    } finally {
      setActionBusy(false);
    }
  };

  const handleReturn = async (reason: string) => {
    setActionBusy(true);
    try {
      await apiClient.post(`/orders/mine/${params.id}/return`, { reason });
      toast.success("Return request submitted! Our team will contact you within 24 hours.");
      setReturnModal(false);
      loadOrder();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Return request failed");
    } finally {
      setActionBusy(false);
    }
  };

  if (loading) {
    return (
      <SiteShell title="Loading Order..." subtitle="">
        <div className="animate-pulse space-y-5 my-6">
          <div className="h-5 bg-slate-100 rounded w-32" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1,2,3].map(i => <div key={i} className="h-28 rounded-2xl bg-slate-100" />)}
          </div>
          <div className="h-64 rounded-2xl bg-slate-100" />
        </div>
      </SiteShell>
    );
  }

  if (!order) return notFound();

  const canCancel = ["PENDING", "PAID"].includes(order.status);
  const canReturn = order.status === "DELIVERED";
  const shipment = order.shipments?.[0];
  const trackingUrl = shipment?.awbCode
    ? `https://shiprocket.co/tracking/${shipment.awbCode}`
    : null;

  // Build timeline
  const currentStep = TIMELINE_STEPS.indexOf(order.status);

  return (
    <SiteShell
      title={`Order ${order.orderNumber}`}
      subtitle={`Placed on ${new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`}
    >
      <div className="my-6 space-y-6 print:my-0">

        {/* Action bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link href="/account/orders"
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition">
            <ArrowLeft className="h-4 w-4" /> All Orders
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            {trackingUrl && (
              <a href={trackingUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-violet-50 border border-violet-200 px-4 py-2.5 text-xs font-bold text-violet-700 hover:bg-violet-100 transition">
                <Truck className="h-3.5 w-3.5" /> Track on Shiprocket <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {canReturn && (
              <button onClick={() => setReturnModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs font-bold text-amber-700 hover:bg-amber-100 transition">
                <RotateCcw className="h-3.5 w-3.5" /> Request Return
              </button>
            )}
            {canCancel && (
              <button onClick={() => setCancelModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-100 transition">
                <XCircle className="h-3.5 w-3.5" /> Cancel Order
              </button>
            )}
            <button onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition shadow">
              <Printer className="h-3.5 w-3.5" /> Print Invoice
            </button>
          </div>
        </div>

        {/* Status + shipment banner */}
        <div className={`rounded-2xl border px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${statusColor(order.status)}`}>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold uppercase border ${statusColor(order.status)}`}>
              <CheckCircle2 className="h-3.5 w-3.5" /> {order.status}
            </span>
            {shipment?.awbCode && (
              <span className="text-xs font-bold">AWB: <code className="font-mono">{shipment.awbCode}</code></span>
            )}
          </div>
          {trackingUrl && (
            <a href={trackingUrl} target="_blank" rel="noopener noreferrer"
              className="text-xs font-bold underline flex items-center gap-1">
              Track shipment on Shiprocket <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {/* Progress timeline */}
        {!["CANCELLED","REFUNDED"].includes(order.status) && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4">Delivery Progress</p>
            <div className="flex items-center gap-0">
              {TIMELINE_STEPS.map((step, idx) => {
                const done = idx <= currentStep;
                const active = idx === currentStep;
                return (
                  <div key={step} className="flex-1 flex flex-col items-center">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-extrabold border-2 transition ${
                      done ? "bg-brand border-brand text-white" : "bg-white border-slate-200 text-slate-300"
                    } ${active ? "ring-4 ring-brand/20" : ""}`}>
                      {done ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                    </div>
                    <p className={`text-[9px] font-bold uppercase tracking-wider mt-1 text-center ${done ? "text-brand" : "text-slate-400"}`}>
                      {step}
                    </p>
                    {idx < TIMELINE_STEPS.length - 1 && (
                      <div className={`absolute h-0.5 w-[calc(20%-8px)] mt-4 ml-[10%] ${done && idx < currentStep ? "bg-brand" : "bg-slate-200"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3 info cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">
              <MapPin className="h-3.5 w-3.5" /> Delivery Address
            </div>
            {order.shippingAddress && (
              <div className="text-xs text-slate-700 space-y-0.5">
                <p className="font-bold text-slate-900">{(order.shippingAddress as any).label || "Shipping"}</p>
                <p>{(order.shippingAddress as any).addressLine1}</p>
                {(order.shippingAddress as any).addressLine2 && <p>{(order.shippingAddress as any).addressLine2}</p>}
                <p>{(order.shippingAddress as any).city}, {(order.shippingAddress as any).state} — {(order.shippingAddress as any).postalCode}</p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">
              <User className="h-3.5 w-3.5" /> Customer
            </div>
            <div className="text-xs text-slate-700 space-y-0.5">
              <p className="font-bold text-slate-900">{order.customerName}</p>
              <p>{order.customerEmail}</p>
              <p>{order.customerPhone}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">
              <CreditCard className="h-3.5 w-3.5" /> Payment
            </div>
            <div className="text-xs text-slate-700 space-y-0.5">
              <p className="font-bold text-slate-900">{order.paymentStatus}</p>
              {order.payments?.[0] && (
                <>
                  <p className="font-mono text-[10px]">{order.payments[0].razorpayPaymentId || "—"}</p>
                  <p>₹{Number(order.total).toLocaleString("en-IN")}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Order items */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-900">Order Items</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3 text-left">Item</th>
                  <th className="px-5 py-3 text-left">SKU</th>
                  <th className="px-5 py-3 text-center">Qty</th>
                  <th className="px-5 py-3 text-right">Unit Price</th>
                  <th className="px-5 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items?.map((item: any, idx: number) => {
                  const img = item.variant?.images?.[0]?.url
                    || item.variant?.imageUrl
                    || item.product?.images?.find((i: any) => i.isPrimary)?.url
                    || item.product?.images?.[0]?.url
                    || getProductImage(item.productId);
                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 shrink-0 rounded-xl border border-slate-100 bg-slate-50 overflow-hidden flex items-center justify-center p-1.5">
                            <img src={img} alt={item.productName} className="max-h-full max-w-full object-contain" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{item.productName}</p>
                            {item.variantName && (
                              <span className="text-[10px] font-extrabold text-brand uppercase tracking-wider">{item.variantName}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-slate-500">{item.sku || "—"}</td>
                      <td className="px-5 py-4 text-center font-bold">{item.quantity}</td>
                      <td className="px-5 py-4 text-right">₹{Number(item.unitPrice).toLocaleString("en-IN")}</td>
                      <td className="px-5 py-4 text-right font-bold text-slate-950">₹{Number(item.totalPrice).toLocaleString("en-IN")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pricing summary */}
          <div className="px-5 py-4 border-t border-slate-100 flex justify-end">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-bold text-slate-800">₹{Number(order.subtotal).toLocaleString("en-IN")}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount</span>
                  <span>−₹{Number(order.discount).toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>GST (18%)</span>
                <span className="font-bold text-slate-800">₹{Number(order.tax).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span className={`font-bold ${Number(order.shipping) === 0 ? "text-emerald-600" : "text-slate-800"}`}>
                  {Number(order.shipping) === 0 ? "FREE" : `₹${Number(order.shipping).toLocaleString("en-IN")}`}
                </span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-950 pt-2 border-t border-slate-200">
                <span>Grand Total</span>
                <span>₹{Number(order.total).toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status history */}
        {order.statusHistory?.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" /> Order Timeline
            </h3>
            <div className="relative border-l-2 border-slate-100 pl-6 ml-3 space-y-5">
              {order.statusHistory.map((h: any, idx: number) => (
                <div key={idx} className="relative">
                  <span className="absolute -left-[29px] top-0.5 h-5 w-5 rounded-full bg-brand/10 border-2 border-white flex items-center justify-center">
                    <CheckCircle2 className="h-3 w-3 text-brand" />
                  </span>
                  <p className="text-xs font-extrabold text-slate-800 uppercase">{h.status}</p>
                  {h.notes && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{h.notes}</p>}
                  <p className="text-[10px] text-slate-400 mt-0.5">{new Date(h.createdAt).toLocaleString("en-IN")}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cancel modal */}
      {cancelModal && (
        <ReasonModal
          title="Cancel Order"
          subtitle="Please tell us why you want to cancel. This helps us improve."
          confirmLabel="Confirm Cancel"
          confirmClass="bg-rose-600 hover:bg-rose-700"
          onConfirm={handleCancel}
          onClose={() => setCancelModal(false)}
          busy={actionBusy}
        />
      )}

      {/* Return modal */}
      {returnModal && (
        <ReasonModal
          title="Request Return"
          subtitle="Please describe the reason for return. We'll contact you within 24 hours."
          confirmLabel="Submit Return Request"
          confirmClass="bg-amber-600 hover:bg-amber-700"
          onConfirm={handleReturn}
          onClose={() => setReturnModal(false)}
          busy={actionBusy}
        />
      )}
    </SiteShell>
  );
}
