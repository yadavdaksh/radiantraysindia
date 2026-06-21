"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { useAuth } from "@/contexts/auth-context";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { getProductImage } from "@/lib/site-data";
import {
  User, MapPin, Heart, Shield, Package, Loader2, Plus, Trash2,
  Edit2, Check, X, Star, ArrowRight, Eye, EyeOff, LogOut,
} from "lucide-react";

const STATES = ["Andhra Pradesh","Assam","Bihar","Chhattisgarh","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Jammu & Kashmir","Ladakh","Arunachal Pradesh"];

function Skeleton({ rows = 3 }: { rows?: number }) {
  return <div className="space-y-3 animate-pulse">{Array.from({ length: rows }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-slate-100" />)}</div>;
}

function statusBadge(s: string) {
  const map: Record<string, string> = {
    DELIVERED: "bg-emerald-100 text-emerald-800",
    CANCELLED: "bg-rose-100 text-rose-800",
    REFUNDED: "bg-rose-100 text-rose-800",
    SHIPPED: "bg-sky-100 text-sky-800",
    PAID: "bg-violet-100 text-violet-800",
    PROCESSING: "bg-blue-100 text-blue-800",
  };
  return map[s] || "bg-amber-100 text-amber-800";
}

type Tab = "profile" | "orders" | "addresses" | "wishlist" | "inquiries" | "security";

export default function AccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { customer, updateProfile, logout, isLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("profile");

  // Sync tab state from URL search params
  useEffect(() => {
    const t = searchParams.get("tab") as Tab;
    if (t && ["profile", "orders", "addresses", "wishlist", "inquiries", "security"].includes(t)) {
      setTab(t);
    }
  }, [searchParams]);

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    router.replace(`/account?tab=${newTab}`, { scroll: false });
  };

  // ── Profile ──────────────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({ name: "", phone: "" });
  const [profileLoading, setProfileLoading] = useState(false);

  // ── Orders ───────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // ── Addresses ────────────────────────────────────────────────────────────
  const [addresses, setAddresses] = useState<any[]>([]);
  const [addrsLoading, setAddrsLoading] = useState(false);
  const [addrForm, setAddrForm] = useState<any>(null); // null = hidden, obj = editing/creating
  const [addrSaving, setAddrSaving] = useState(false);

  // ── Wishlist ──────────────────────────────────────────────────────────────
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // ── Inquiries (B2B leads) ─────────────────────────────────────────────────
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);

  // ── Security ──────────────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ old: "", newPw: "", confirm: "" });
  const [showPw, setShowPw] = useState({ old: false, new: false });
  const [pwLoading, setPwLoading] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (isLoading) return;
    if (!customer) router.push("/login?redirect=/account");
    else setProfileForm({ name: customer.name, phone: customer.phone || "" });
  }, [customer, isLoading, router]);

  // Load data per tab
  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const r = await apiClient.get("/orders/mine");
      setOrders(r.data.data || []);
    } catch { toast.error("Failed to load orders"); }
    finally { setOrdersLoading(false); }
  }, []);

  const loadAddresses = useCallback(async () => {
    setAddrsLoading(true);
    try {
      const r = await apiClient.get("/addresses");
      setAddresses(r.data.data || []);
    } catch { toast.error("Failed to load addresses"); }
    finally { setAddrsLoading(false); }
  }, []);

  const loadWishlist = useCallback(async () => {
    setWishlistLoading(true);
    try {
      const r = await apiClient.get("/wishlist");
      setWishlist(r.data.data || []);
    } catch { toast.error("Failed to load wishlist"); }
    finally { setWishlistLoading(false); }
  }, []);

  const loadInquiries = useCallback(async () => {
    setInquiriesLoading(true);
    try {
      const r = await apiClient.get("/leads?limit=50");
      setInquiries(r.data.data?.items || []);
    } catch { toast.error("Failed to load inquiries"); }
    finally { setInquiriesLoading(false); }
  }, []);

  useEffect(() => {
    if (!customer) return;
    if (tab === "orders") loadOrders();
    if (tab === "addresses") loadAddresses();
    if (tab === "inquiries") loadInquiries();
    if (tab === "wishlist") loadWishlist();
  }, [tab, customer, loadOrders, loadAddresses, loadInquiries, loadWishlist]);

  if (!customer) return null;

  // ── Profile save ──────────────────────────────────────────────────────────
  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim()) { toast.error("Name is required"); return; }
    setProfileLoading(true);
    try {
      await updateProfile({ name: profileForm.name.trim(), phone: profileForm.phone });
      toast.success("Profile updated");
    } catch (err: any) { toast.error(err.response?.data?.message || err.message); }
    finally { setProfileLoading(false); }
  };

  // ── Address CRUD ──────────────────────────────────────────────────────────
  const openNewAddr = () => setAddrForm({ label: "Home", addressLine1: "", addressLine2: "", city: "", state: "", postalCode: "", country: "India", isDefault: false });
  const openEditAddr = (a: any) => setAddrForm({ ...a });

  const saveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrForm.addressLine1 || !addrForm.city || !addrForm.state || !addrForm.postalCode) {
      toast.error("Fill all required fields"); return;
    }
    setAddrSaving(true);
    try {
      if (addrForm.id) {
        await apiClient.put(`/addresses/${addrForm.id}`, addrForm);
        toast.success("Address updated");
      } else {
        await apiClient.post("/addresses", addrForm);
        toast.success("Address saved");
      }
      setAddrForm(null);
      loadAddresses();
    } catch (err: any) { toast.error(err.response?.data?.message || "Failed to save"); }
    finally { setAddrSaving(false); }
  };

  const deleteAddress = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    try { await apiClient.delete(`/addresses/${id}`); toast.success("Deleted"); loadAddresses(); }
    catch (err: any) { toast.error(err.response?.data?.message || "Delete failed"); }
  };

  const setDefault = async (id: string) => {
    try { await apiClient.put(`/addresses/${id}`, { isDefault: true }); loadAddresses(); toast.success("Default address set"); }
    catch (err: any) { toast.error(err.response?.data?.message || "Failed"); }
  };

  // ── Wishlist remove ───────────────────────────────────────────────────────
  const removeWishlist = async (productId: string, variantId: string | null = null) => {
    try {
      await apiClient.delete(`/wishlist/${productId}`, { data: { variantId } });
      setWishlist(w => w.filter((i) => {
        const itemProductId = i.productId || i.product?.id;
        const itemVariantId = i.variantId || i.variant?.id || null;
        if (variantId != null) {
          return !(itemProductId === productId && itemVariantId === variantId);
        }
        return !(itemProductId === productId && itemVariantId == null);
      }));
      toast.success("Removed from wishlist");
    } catch { toast.error("Failed to remove"); }
  };

  // ── Change password ───────────────────────────────────────────────────────
  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPw.length < 6) { toast.error("New password must be 6+ characters"); return; }
    if (pwForm.newPw !== pwForm.confirm) { toast.error("Passwords do not match"); return; }
    setPwLoading(true);
    try {
      await apiClient.post("/auth/change-password", { oldPassword: pwForm.old, newPassword: pwForm.newPw });
      setPwForm({ old: "", newPw: "", confirm: "" });
      toast.success("Password changed successfully");
    } catch (err: any) { toast.error(err.response?.data?.message || "Failed to change password"); }
    finally { setPwLoading(false); }
  };

  const TABS = [
    { id: "profile",   label: "Profile",        icon: User },
    { id: "orders",    label: "Order History",   icon: Package },
    { id: "addresses", label: "Addresses",       icon: MapPin },
    { id: "wishlist",  label: "Wishlist",        icon: Heart },
    { id: "inquiries", label: "My Inquiries",    icon: Star },
    { id: "security",  label: "Security",        icon: Shield },
  ] as { id: Tab; label: string; icon: any }[];

  return (
    <SiteShell title="My Account" subtitle="Manage your profile, orders, addresses and inquiries.">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr] my-6">

        {/* Sidebar */}
        <aside className="rounded-2xl lg:border lg:border-slate-200 lg:bg-white lg:p-3 h-fit lg:shadow-sm lg:space-y-0.5 lg:sticky lg:top-24 flex lg:flex-col overflow-x-auto lg:overflow-visible gap-2 lg:gap-0.5 max-lg:w-full max-lg:border-none max-lg:bg-transparent max-lg:p-0 max-lg:shadow-none max-lg:rounded-none max-lg:pb-2 max-lg:mb-2 max-lg:scrollbar-none">
          <div className="px-3 py-3 border-b border-slate-100 mb-2 hidden lg:block">
            <p className="font-extrabold text-sm text-slate-900 truncate">{customer.name}</p>
            <p className="text-[11px] text-slate-400 truncate">{customer.email}</p>
          </div>
          {TABS.map(t => (
            <button key={t.id} onClick={() => handleTabChange(t.id)}
              className={`flex-shrink-0 lg:w-full flex items-center gap-2 lg:gap-3 rounded-xl px-4 py-2.5 lg:px-3 text-xs font-bold transition ${
                tab === t.id ? "bg-brand/8 text-brand" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 bg-slate-50 lg:bg-transparent"
              }`}>
              <t.icon className="h-4 w-4 shrink-0" />
              {t.label}
            </button>
          ))}
          <div className="pt-2 border-t border-slate-100 mt-2 hidden lg:block">
            <button onClick={() => { logout(); router.push("/"); }}
              className="w-full text-left px-3 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition">
              Sign Out
            </button>
          </div>
          <button onClick={() => { logout(); router.push("/"); }}
            className="lg:hidden flex-shrink-0 flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 transition">
            <LogOut className="h-4 w-4 shrink-0" />
            Sign Out
          </button>
        </aside>

        {/* Main */}
        <div className="min-w-0">

          {/* ── PROFILE ── */}
          {tab === "profile" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <h2 className="text-base font-extrabold text-slate-950">Profile Details</h2>
              <form onSubmit={saveProfile} className="space-y-5 max-w-md">
                {[
                  { label: "Email (read-only)", value: customer.email, disabled: true, type: "email" },
                ].map(f => (
                  <div key={f.label} className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{f.label}</label>
                    <input type={f.type} disabled={f.disabled} value={f.value}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-400 outline-none" />
                  </div>
                ))}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Full Name *</label>
                  <input type="text" required value={profileForm.name}
                    onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand transition" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Phone Number</label>
                  <input type="tel" value={profileForm.phone}
                    onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="9211781378"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand transition" />
                </div>
                <button type="submit" disabled={profileLoading}
                  className="flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white shadow hover:bg-brand-dark transition disabled:opacity-60">
                  {profileLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Check className="h-4 w-4" /> Save Changes</>}
                </button>
              </form>
            </div>
          )}

          {/* ── ORDERS ── */}
          {tab === "orders" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-base font-extrabold text-slate-950">Order History</h2>
                <span className="text-xs text-slate-400">{orders.length} orders</span>
              </div>
              <div className="p-6">
                {ordersLoading ? <Skeleton rows={4} /> : orders.length === 0 ? (
                  <div className="text-center py-14">
                    <Package className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-500">No orders yet</p>
                    <Link href="/products" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:underline">
                      Shop Now <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((o: any) => {
                      const firstItem = o.items?.[0];
                      const img = firstItem?.variant?.images?.[0]?.url || firstItem?.product?.images?.find((i: any) => i.isPrimary)?.url || firstItem?.product?.images?.[0]?.url;
                      return (
                        <Link key={o.id} href={`/account/orders/${o.id}`}
                          className="flex items-start gap-4 rounded-2xl border border-slate-200 p-4 hover:border-brand/30 hover:shadow-md transition group">
                          <div className="h-14 w-14 shrink-0 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                            {img ? <img src={img} alt="" className="max-h-full max-w-full object-contain" /> : <Package className="h-6 w-6 text-slate-300" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-sm text-slate-900">{o.orderNumber}</span>
                              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${statusBadge(o.status)}`}>{o.status}</span>
                              {o.couponCode && <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">Coupon: {o.couponCode}</span>}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                              {o.items?.map((i: any) => `${i.productName}${i.variantName ? ` (${i.variantName})` : ""} ×${i.quantity}`).join(", ")}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-extrabold text-slate-950">₹{Number(o.total).toLocaleString("en-IN")}</p>
                            <ArrowRight className="h-4 w-4 text-slate-300 mt-2 ml-auto group-hover:text-brand transition" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── ADDRESSES ── */}
          {tab === "addresses" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-base font-extrabold text-slate-950">Saved Addresses</h2>
                {!addrForm && (
                  <button onClick={openNewAddr} className="flex items-center gap-1.5 text-xs font-bold text-brand hover:text-brand-dark transition">
                    <Plus className="h-3.5 w-3.5" /> Add Address
                  </button>
                )}
              </div>
              <div className="p-6 space-y-4">
                {addrForm && (
                  <form onSubmit={saveAddress} className="rounded-xl border border-brand/20 bg-sky-50/30 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-extrabold text-slate-900">{addrForm.id ? "Edit Address" : "New Address"}</p>
                      <button type="button" onClick={() => setAddrForm(null)} className="text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Label</label>
                        <div className="flex gap-1.5 flex-wrap">
                          {["Home","Office","Factory","Other"].map(l => (
                            <button key={l} type="button" onClick={() => setAddrForm((p: any) => ({ ...p, label: l }))}
                              className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${addrForm.label === l ? "bg-brand text-white border-brand" : "border-slate-200 text-slate-600 hover:border-brand/40"}`}>
                              {l}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Address Line 1 *</label>
                        <input required value={addrForm.addressLine1} onChange={e => setAddrForm((p: any) => ({ ...p, addressLine1: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand transition" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Address Line 2</label>
                        <input value={addrForm.addressLine2 || ""} onChange={e => setAddrForm((p: any) => ({ ...p, addressLine2: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand transition" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">City *</label>
                        <input required value={addrForm.city} onChange={e => setAddrForm((p: any) => ({ ...p, city: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand transition" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">State *</label>
                        <select required value={addrForm.state} onChange={e => setAddrForm((p: any) => ({ ...p, state: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand transition">
                          <option value="">Select state</option>
                          {STATES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">PIN Code *</label>
                        <input required value={addrForm.postalCode} onChange={e => setAddrForm((p: any) => ({ ...p, postalCode: e.target.value }))}
                          maxLength={6} pattern="\d{6}"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand transition" />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={addrForm.isDefault}
                        onChange={e => setAddrForm((p: any) => ({ ...p, isDefault: e.target.checked }))}
                        className="rounded border-slate-300 text-brand h-4 w-4" />
                      <span className="text-sm font-semibold text-slate-700">Set as default address</span>
                    </label>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setAddrForm(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                      <button type="submit" disabled={addrSaving} className="flex-1 rounded-xl bg-brand py-2.5 text-sm font-bold text-white hover:bg-brand-dark transition disabled:opacity-60">
                        {addrSaving ? "Saving…" : addrForm.id ? "Update Address" : "Save Address"}
                      </button>
                    </div>
                  </form>
                )}

                {addrsLoading ? <Skeleton rows={3} /> : addresses.length === 0 && !addrForm ? (
                  <div className="text-center py-10">
                    <MapPin className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-500">No addresses saved</p>
                    <button onClick={openNewAddr} className="mt-3 text-sm font-bold text-brand hover:underline">Add your first address</button>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {addresses.map((a: any) => (
                      <div key={a.id} className={`rounded-xl border p-4 space-y-2 relative ${a.isDefault ? "border-brand/30 bg-brand/3" : "border-slate-200"}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[9px] font-extrabold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{a.label}</span>
                            {a.isDefault && <span className="text-[9px] font-extrabold bg-brand/10 text-brand px-2 py-0.5 rounded-full">Default</span>}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => openEditAddr(a)} className="h-6 w-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition"><Edit2 className="h-3 w-3" /></button>
                            {!a.isDefault && <button onClick={() => setDefault(a.id)} title="Set as default" className="h-6 w-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"><Check className="h-3 w-3" /></button>}
                            <button onClick={() => deleteAddress(a.id)} className="h-6 w-6 flex items-center justify-center rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition"><Trash2 className="h-3 w-3" /></button>
                          </div>
                        </div>
                        <p className="text-xs font-medium text-slate-800">{a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ""}</p>
                        <p className="text-xs text-slate-500">{a.city}, {a.state} — {a.postalCode}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── WISHLIST ── */}
          {tab === "wishlist" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-base font-extrabold text-slate-950">My Wishlist</h2>
                <span className="text-xs text-slate-400">{wishlist.length} items</span>
              </div>
              <div className="p-6">
                {wishlistLoading ? <Skeleton rows={3} /> : wishlist.length === 0 ? (
                  <div className="text-center py-14">
                    <Heart className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-500">Wishlist is empty</p>
                    <Link href="/products" className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:underline">Browse Products <ArrowRight className="h-4 w-4" /></Link>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {wishlist.map((w: any) => {
                      const prod = w.product || w;
                      const isB2C = prod.productType === "B2C";
                      const variant = w.variant || null;
                      const img = variant?.images?.[0]?.url
                        || variant?.imageUrl
                        || getProductImage(prod.slug, prod.images, prod.variants);
                      const variantChips = variant?.attributes?.map((attr: any) => ({
                        label: attr?.attributeValue?.attribute?.name,
                        value: attr?.attributeValue?.value,
                      })).filter((chip: any) => chip.label && chip.value) || [];
                      return (
                        <div key={w.id || prod.id} className="py-4 flex items-center gap-4">
                          <div className="h-14 w-14 shrink-0 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center p-1">
                            <img src={img} alt={prod.name} className="max-h-full object-contain" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link href={`/products/${prod.slug}`} className="font-bold text-sm text-slate-900 hover:text-brand transition truncate block">{prod.name}</Link>
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{prod.shortDescription}</p>
                            {variant && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {variantChips.length > 0 ? variantChips.map((chip: any, idx: number) => (
                                  <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-[9px] font-bold">
                                    <span className="opacity-70">{chip.label}:</span> {chip.value}
                                  </span>
                                )) : (
                                  <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-[9px] font-bold">
                                    {variant.name}
                                  </span>
                                )}
                              </div>
                            )}
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase mt-1 inline-block ${isB2C ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                              {isB2C ? "B2C" : "B2B Quote"}
                            </span>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Link href={`/products/${prod.slug}`}
                              className="text-xs font-bold bg-brand text-white px-3 py-1.5 rounded-lg hover:bg-brand-dark transition">
                              {isB2C ? "Buy" : "Enquire"}
                            </Link>
                            <button onClick={() => removeWishlist(prod.id || prod.slug, variant?.id || w.variantId || null)}
                              className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 transition">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── MY INQUIRIES ── */}
          {tab === "inquiries" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-base font-extrabold text-slate-950">My Inquiries</h2>
                <span className="text-xs text-slate-400">{inquiries.length} total</span>
              </div>
              <div className="p-6">
                {inquiriesLoading ? <Skeleton rows={4} /> : inquiries.length === 0 ? (
                  <div className="text-center py-14">
                    <Star className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-500">No inquiries yet</p>
                    <p className="text-xs text-slate-400 mt-1">Visit any product page and submit a quote or inquiry request</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inquiries.map((q: any) => {
                      const statusColors: Record<string, string> = {
                        NEW: "bg-sky-100 text-sky-800", CONTACTED: "bg-blue-100 text-blue-800",
                        QUALIFIED: "bg-violet-100 text-violet-800", QUOTED: "bg-amber-100 text-amber-800",
                        WON: "bg-emerald-100 text-emerald-800", LOST: "bg-rose-100 text-rose-800", CLOSED: "bg-slate-100 text-slate-600",
                      };
                      return (
                        <div key={q.id} className="rounded-xl border border-slate-200 p-4 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-sm text-slate-900">{q.product?.name || "Product Inquiry"}</p>
                                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${statusColors[q.status] || "bg-slate-100 text-slate-600"}`}>{q.status}</span>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">{new Date(q.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                            </div>
                          </div>
                          {q.message && <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2.5 leading-relaxed line-clamp-2">{q.message}</p>}
                          {q.product?.slug && (
                            <Link href={`/products/${q.product.slug}`} className="text-[11px] font-bold text-brand hover:underline flex items-center gap-1">
                              View product <ArrowRight className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── SECURITY ── */}
          {tab === "security" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <h2 className="text-base font-extrabold text-slate-950">Change Password</h2>
              <form onSubmit={changePassword} className="space-y-4 max-w-md">
                {[
                  { label: "Current Password", key: "old" as const, show: showPw.old, toggle: () => setShowPw(p => ({ ...p, old: !p.old })), forgotLink: true },
                  { label: "New Password (min 6 chars)", key: "newPw" as const, show: showPw.new, toggle: () => setShowPw(p => ({ ...p, new: !p.new })), forgotLink: false },
                ].map(f => (
                  <div key={f.key} className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{f.label}</label>
                      {f.forgotLink && (
                        <Link href="/auth/forgot-password" className="text-[10px] font-bold text-brand hover:underline">
                          Forgot password?
                        </Link>
                      )}
                    </div>
                    <div className="relative">
                      <input type={f.show ? "text" : "password"} value={pwForm[f.key]}
                        onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder="••••••••" required
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 pr-11 py-2.5 text-sm outline-none focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand transition" />
                      <button type="button" onClick={f.toggle} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition">
                        {f.show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                ))}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Confirm New Password</label>
                  <input type="password" value={pwForm.confirm}
                    onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                    placeholder="••••••••" required
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand transition" />
                </div>
                <button type="submit" disabled={pwLoading}
                  className="flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-6 py-3 text-sm font-bold text-white transition disabled:opacity-60">
                  {pwLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</> : <><Shield className="h-4 w-4" /> Update Password</>}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </SiteShell>
  );
}
