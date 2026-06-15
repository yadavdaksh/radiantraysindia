"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { useAuth } from "@/contexts/auth-context";
import { apiClient } from "@/lib/api-client";
import {
  ArrowLeft, Truck, Eye, Package, CheckCircle2,
  Clock, XCircle, RotateCcw,
} from "lucide-react";

function statusColor(s: string) {
  if (s === "DELIVERED") return "bg-emerald-100 text-emerald-800";
  if (s === "CANCELLED" || s === "REFUNDED") return "bg-rose-100 text-rose-800";
  if (s === "SHIPPED") return "bg-sky-100 text-sky-800";
  return "bg-amber-100 text-amber-800";
}

function StatusIcon({ s }: { s: string }) {
  if (s === "DELIVERED") return <CheckCircle2 className="h-3.5 w-3.5" />;
  if (s === "CANCELLED") return <XCircle className="h-3.5 w-3.5" />;
  if (s === "SHIPPED") return <Truck className="h-3.5 w-3.5" />;
  return <Clock className="h-3.5 w-3.5" />;
}

export default function OrdersPage() {
  const router = useRouter();
  const { customer } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!customer) { router.push("/login?redirect=/account/orders"); return; }
    apiClient.get("/orders/mine")
      .then(r => setOrders(r.data.data || []))
      .catch(e => setError(e.response?.data?.message || "Failed to load orders"))
      .finally(() => setLoading(false));
  }, [customer, router]);

  if (!customer) return null;

  return (
    <SiteShell title="My Orders" subtitle="Track your cleanroom equipment orders and shipments.">
      <div className="my-6 space-y-4">
        <Link href="/account" className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition">
          <ArrowLeft className="h-4 w-4" /> Back to Account
        </Link>

        {loading && (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />)}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-6 text-center text-sm text-rose-700 font-semibold">{error}</div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="text-center py-16 border border-dashed border-slate-200 bg-white rounded-3xl">
            <Truck className="h-10 w-10 text-slate-300 mx-auto mb-4" />
            <h3 className="text-base font-bold text-slate-900">No Orders Yet</h3>
            <p className="text-xs text-slate-500 mt-1">You haven't placed any orders.</p>
            <Link href="/products" className="mt-6 inline-flex rounded-full bg-brand px-6 py-2.5 text-xs font-bold text-white shadow">
              Browse Products
            </Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order: any) => {
              const firstItem = order.items?.[0];
              const imgUrl = firstItem?.variant?.images?.[0]?.url
                || firstItem?.variant?.imageUrl
                || firstItem?.product?.images?.find((i: any) => i.isPrimary)?.url
                || firstItem?.product?.images?.[0]?.url;

              return (
                <div key={order.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    {/* Left: image + details */}
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-16 shrink-0 rounded-xl border border-slate-100 bg-slate-50 overflow-hidden flex items-center justify-center p-1.5">
                        {imgUrl
                          ? <img src={imgUrl} alt="" className="max-h-full max-w-full object-contain" />
                          : <Package className="h-7 w-7 text-slate-300" />}
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-extrabold text-slate-900">{order.orderNumber}</span>
                          <span className="text-[10px] text-slate-400">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </div>
                        <p className="text-xs text-slate-500 max-w-sm line-clamp-1">
                          {order.items?.map((i: any) => `${i.productName}${i.variantName ? ` (${i.variantName})` : ""} ×${i.quantity}`).join(", ")}
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${statusColor(order.status)}`}>
                            <StatusIcon s={order.status} /> {order.status}
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                            order.paymentStatus === "SUCCESS" || order.paymentStatus === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-600"
                          }`}>
                            {order.paymentStatus === "SUCCESS" || order.paymentStatus === "PAID" ? "✓ Paid" : order.paymentStatus}
                          </span>
                          {order.shipments?.[0]?.awbCode && (
                            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold bg-violet-100 text-violet-800">
                              <Truck className="h-3 w-3" /> AWB: {order.shipments[0].awbCode}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: total + action */}
                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Total</p>
                        <p className="text-base font-extrabold text-slate-950">₹{Number(order.total).toLocaleString("en-IN")}</p>
                      </div>
                      <Link href={`/account/orders/${order.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 hover:border-brand bg-slate-50 hover:bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:text-brand transition">
                        <Eye className="h-3.5 w-3.5" /> View Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SiteShell>
  );
}
