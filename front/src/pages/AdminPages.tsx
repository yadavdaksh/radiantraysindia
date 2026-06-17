/**
 * AdminPages.tsx — real-API pages for:
 * customers, addresses, wishlist, leads, contactForms, newsletter, testimonials
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { apiFetch } from "../lib/api";
import {
  IconUsers, IconMapPin, IconHeart, IconTarget, IconMail,
  IconNews, IconMessageCircle, IconCheck, IconX, IconRefresh,
  IconSearch, IconChevronDown, IconChevronRight, IconTrash, IconPhoneCall, IconBuildingStore,
  IconShoppingCart, IconStar, IconEye, IconLock,
} from "@tabler/icons-react";

// ── shared ──────────────────────────────────────────────────────────────────

const inp = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-sky-500 focus:bg-white transition";

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${color}`}>
      {children}
    </span>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 rounded-xl bg-slate-100" />)}
    </div>
  );
}

function Empty({ icon: Icon, msg }: { icon: any; msg: string }) {
  return (
    <div className="flex flex-col items-center py-16 gap-3 text-slate-300">
      <Icon size={40} strokeWidth={1.25} />
      <p className="text-sm font-semibold text-slate-400">{msg}</p>
    </div>
  );
}

function PageHeader({ title, count, onRefresh, refreshing, children }: {
  title: string; count?: number; onRefresh: () => void; refreshing: boolean; children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
      <div>
        <h1 className="text-xl font-extrabold text-slate-950">{title}</h1>
        {count !== undefined && <p className="text-xs text-slate-400 mt-0.5">{count} total</p>}
      </div>
      <div className="flex items-center gap-2">
        {children}
        <button onClick={onRefresh} disabled={refreshing}
          className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 transition text-slate-500 disabled:opacity-50">
          <IconRefresh size={15} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>
    </div>
  );
}

// ── CUSTOMERS ───────────────────────────────────────────────────────────────

export function CustomersPage({ showToast }: { showToast: (m: string, t?: "success" | "error" | "info") => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [resetPw, setResetPw] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch(`/system/customers?limit=100&search=${encodeURIComponent(search)}`)
      .then(j => { setItems(j.data?.items || []); setTotal(j.data?.total || 0); })
      .catch(e => showToast(e.message, "error"))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const update = async (id: string, data: any) => {
    setSaving(true);
    try {
      await apiFetch(`/system/customers/${id}`, { method: "PUT", body: JSON.stringify(data) });
      showToast("Customer updated");
      if (selected?.id === id) setSelected((p: any) => ({ ...p, ...data }));
      load();
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const resetPassword = async () => {
    if (!resetPw.trim() || resetPw.length < 6) { showToast("Password must be 6+ chars", "error"); return; }
    await update(selected.id, { newPassword: resetPw });
    setResetPw("");
    showToast("Password reset successfully");
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Customers" count={total} onRefresh={load} refreshing={loading}>
        <div className="relative">
          <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email…"
            className="pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 bg-white outline-none focus:border-sky-500 w-52 transition" />
        </div>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        {/* List */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Phone</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="p-6"><Skeleton /></td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={4}><Empty icon={IconUsers} msg="No customers yet" /></td></tr>
              ) : items.map(c => (
                <tr key={c.id}
                  onClick={() => setSelected(c)}
                  className={`hover:bg-slate-50 cursor-pointer transition ${selected?.id === c.id ? "bg-sky-50" : ""}`}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{c.name}</p>
                    <p className="text-[10px] text-slate-400">{c.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">{c.phone || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <Badge color={c.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}>
                        {c.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge color={c.isVerified ? "bg-sky-100 text-sky-800" : "bg-amber-100 text-amber-700"}>
                        {c.isVerified ? "Verified" : "Unverified"}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-700">{c._count?.orders ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-300">
              <IconEye size={32} strokeWidth={1.25} />
              <p className="text-sm text-slate-400 mt-3">Click a customer to view details</p>
            </div>
          ) : (
            <div className="p-5 space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-950">{selected.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{selected.email}</p>
                  <p className="text-xs text-slate-400">{selected.phone || "No phone"}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Joined {new Date(selected.createdAt).toLocaleDateString("en-IN")}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-slate-300 hover:text-slate-600">
                  <IconX size={16} />
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Orders", val: selected._count?.orders ?? 0, icon: IconShoppingCart },
                  { label: "Addresses", val: selected._count?.addresses ?? 0, icon: IconMapPin },
                  { label: "Wishlist", val: selected._count?.wishlist ?? 0, icon: IconHeart },
                ].map(({ label, val, icon: Icon }) => (
                  <div key={label} className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
                    <Icon size={14} className="text-slate-400 mx-auto mb-1" />
                    <p className="text-lg font-extrabold text-slate-950">{val}</p>
                    <p className="text-[10px] text-slate-400">{label}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => update(selected.id, { isActive: !selected.isActive })}
                    disabled={saving}
                    className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${selected.isActive ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"}`}
                  >
                    {selected.isActive ? "Deactivate" : "Activate"} Account
                  </button>
                  <button
                    onClick={() => update(selected.id, { isVerified: !selected.isVerified })}
                    disabled={saving}
                    className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${selected.isVerified ? "bg-slate-50 text-slate-600 border border-slate-200" : "bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100"}`}
                  >
                    {selected.isVerified ? "Unverify" : "Verify Email"}
                  </button>
                </div>

                <div className="rounded-xl border border-slate-200 p-3 space-y-2">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <IconLock size={11} /> Reset Password
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={resetPw}
                      onChange={e => setResetPw(e.target.value)}
                      placeholder="New password (min 6)"
                      className={`${inp} flex-1 text-xs py-2`}
                    />
                    <button onClick={resetPassword} disabled={saving || !resetPw}
                      className="px-3 py-2 rounded-xl bg-sky-700 text-white text-xs font-bold hover:bg-sky-800 transition disabled:opacity-50">
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ADDRESSES ────────────────────────────────────────────────────────────────

export function AddressesPage({ showToast }: { showToast: (m: string, t?: any) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    apiFetch("/system/addresses")
      .then(j => { setItems(j.data?.items || []); setTotal(j.data?.total || 0); })
      .catch(e => showToast(e.message, "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-5">
      <PageHeader title="Customer Addresses" count={total} onRefresh={load} refreshing={loading} />
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Label</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">Address</th>
              <th className="px-4 py-3 text-left hidden sm:table-cell">City / State</th>
              <th className="px-4 py-3 text-center">Default</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan={5} className="p-6"><Skeleton /></td></tr>
              : items.length === 0 ? <tr><td colSpan={5}><Empty icon={IconMapPin} msg="No addresses yet" /></td></tr>
                : items.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{a.customer?.name || "—"}</p>
                      <p className="text-[10px] text-slate-400">{a.customer?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color="bg-slate-100 text-slate-700">{a.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 hidden md:table-cell max-w-48 truncate">
                      {a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ""}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">
                      {a.city}, {a.state} — {a.postalCode}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {a.isDefault ? <IconCheck size={14} className="text-emerald-600 mx-auto" /> : <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── WISHLIST ─────────────────────────────────────────────────────────────────

export function WishlistPage({ showToast }: { showToast: (m: string, t?: any) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    apiFetch("/system/wishlists")
      .then(j => setItems(j.data?.items || []))
      .catch(e => showToast(e.message, "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-5">
      <PageHeader title="Customer Wishlists" count={items.length} onRefresh={load} refreshing={loading} />
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left hidden sm:table-cell">Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan={4} className="p-6"><Skeleton /></td></tr>
              : items.length === 0 ? <tr><td colSpan={4}><Empty icon={IconHeart} msg="No wishlist items" /></td></tr>
                : items.map((w: any) => {
                  const img = w.product?.images?.find((i: any) => i.isPrimary)?.url || w.product?.images?.[0]?.url;
                  return (
                    <tr key={w.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {img && <img src={img} alt="" className="h-10 w-10 rounded-lg object-contain bg-slate-50 border border-slate-100" />}
                          <p className="font-semibold text-slate-900 max-w-48 truncate">{w.product?.name || "—"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={w.product?.productType === "B2C" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-700"}>
                          {w.product?.productType || "—"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{w.customer?.name || "—"}</p>
                        <p className="text-[10px] text-slate-400">{w.customer?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 hidden sm:table-cell">
                        {new Date(w.createdAt).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── LEADS ────────────────────────────────────────────────────────────────────

export function LeadsPage({ showToast }: { showToast: (m: string, t?: any) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [viewingLead, setViewingLead] = useState<any | null>(null);

  const load = () => {
    setLoading(true);
    apiFetch("/leads?limit=100")
      .then(j => { setItems(j.data?.items || []); setTotal(j.data?.total || 0); })
      .catch(e => showToast(e.message, "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await apiFetch(`/leads/${id}`, { method: "PUT", body: JSON.stringify({ status }) });
      showToast("Lead updated");
      load();
    } catch (e: any) { showToast(e.message, "error"); }
  };

  const deleteLead = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    try {
      await apiFetch(`/leads/${id}`, { method: "DELETE" });
      showToast("Lead deleted successfully");
      load();
    } catch (e: any) { showToast(e.message, "error"); }
  };

  const statusColors: Record<string, string> = {
    NEW: "bg-sky-100 text-sky-800",
    CONTACTED: "bg-blue-100 text-blue-800",
    QUALIFIED: "bg-violet-100 text-violet-800",
    QUOTED: "bg-amber-100 text-amber-800",
    WON: "bg-emerald-100 text-emerald-800",
    LOST: "bg-rose-100 text-rose-800",
    CLOSED: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="space-y-5">
      <PageHeader title="B2B Leads & Inquiries" count={total} onRefresh={load} refreshing={loading} />
      <div className="space-y-3">
        {loading ? <Skeleton />
          : items.length === 0 ? <Empty icon={IconTarget} msg="No leads yet" />
            : items.map((lead: any) => (
              <div key={lead.id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-start justify-between gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-slate-900">{lead.name}</p>
                      <Badge color={statusColors[lead.status] || "bg-slate-100 text-slate-600"}>{lead.status}</Badge>
                      {lead.source && (
                        <Badge color={lead.source === "CUSTOMIZE" ? "bg-purple-100 text-purple-700" : "bg-sky-100 text-sky-700"}>
                          {lead.source}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                      {lead.email && <span className="flex items-center gap-1"><IconMail size={11} />{lead.email}</span>}
                      {lead.phone && <span className="flex items-center gap-1"><IconPhoneCall size={11} />{lead.phone}</span>}
                      {lead.company && <span className="flex items-center gap-1"><IconBuildingStore size={11} />{lead.company}</span>}
                    </div>
                    {lead.product && (
                      <p className="text-[10px] text-sky-700 font-bold mt-1">Product: {lead.product.name}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={lead.status}
                      onChange={e => updateStatus(lead.id, e.target.value)}
                      className="text-xs rounded-lg border border-slate-200 bg-white px-2 py-1.5 outline-none focus:border-sky-500"
                    >
                      {["NEW", "CONTACTED", "QUALIFIED", "QUOTED", "WON", "LOST", "CLOSED"].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button onClick={() => setViewingLead(lead)} title="View detailed lead specification"
                      className="text-slate-400 hover:text-sky-600 transition p-1">
                      <IconEye size={15} />
                    </button>
                    <button onClick={() => deleteLead(lead.id)} title="Delete Lead"
                      className="text-slate-400 hover:text-rose-600 transition p-1">
                      <IconTrash size={15} />
                    </button>
                    <button onClick={() => setExpanded(expanded === lead.id ? null : lead.id)}
                      className="text-slate-400 hover:text-slate-700">
                      {expanded === lead.id ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
                    </button>
                  </div>
                </div>
                {expanded === lead.id && lead.message && (
                  <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Message</p>
                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-3 whitespace-pre-wrap">{lead.message}</p>
                    <p className="text-[10px] text-slate-400 mt-2">{new Date(lead.createdAt).toLocaleString("en-IN")}</p>
                  </div>
                )}
              </div>
            ))}
      </div>

      {/* Lead Details Modal */}
      {viewingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4"
          onClick={e => e.target === e.currentTarget && setViewingLead(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">B2B Lead Specifications</h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {viewingLead.id}</p>
              </div>
              <button onClick={() => setViewingLead(null)} className="text-slate-400 hover:text-slate-700">
                <IconX size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Contact Name</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">{viewingLead.name}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Source / Type</p>
                  <div className="mt-1.5">
                    <Badge color={viewingLead.source === "CUSTOMIZE" ? "bg-purple-100 text-purple-800" : viewingLead.source === "QUOTE" ? "bg-sky-100 text-sky-800" : "bg-slate-100 text-slate-700"}>
                      {viewingLead.source || "WEBSITE"}
                    </Badge>
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
                  <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Phone</p>
                  <p className="text-sm font-semibold text-slate-800 mt-1">{viewingLead.phone || "—"}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
                  <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Email</p>
                  <p className="text-sm font-semibold text-slate-800 mt-1 break-all">{viewingLead.email || "—"}</p>
                </div>
                {viewingLead.company && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2">
                    <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Company</p>
                    <p className="text-sm font-semibold text-slate-800 mt-1">{viewingLead.company}</p>
                  </div>
                )}
                {viewingLead.product && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2">
                    <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Requested Product</p>
                    <p className="text-xs font-bold text-sky-850 mt-1">{viewingLead.product.name}</p>
                    <p className="text-[9px] text-slate-400 font-mono mt-0.5">SKU: {viewingLead.product.sku}</p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Lead Message & Specifications</p>
                <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 border border-slate-100 rounded-xl p-3.5 whitespace-pre-wrap">
                  {viewingLead.message}
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                <span>Created: {new Date(viewingLead.createdAt).toLocaleString("en-IN")}</span>
                <span>Status: <strong className="text-slate-600">{viewingLead.status}</strong></span>
              </div>
            </div>
            <div className="flex gap-3 px-5 py-4 bg-slate-50 border-t border-slate-100 justify-end">
              <button onClick={() => deleteLead(viewingLead.id).then(() => setViewingLead(null))}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition">
                Delete Lead
              </button>
              <button onClick={() => setViewingLead(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── CONTACT FORMS ────────────────────────────────────────────────────────────

export function ContactFormsPage({ showToast }: { showToast: (m: string, t?: any) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    apiFetch("/leads?limit=100&source=Contact")
      .then(j => { setItems(j.data?.items || []); setTotal(j.data?.total || 0); })
      .catch(e => showToast(e.message, "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-5">
      <PageHeader title="Contact Form Submissions" count={total} onRefresh={load} refreshing={loading} />
      {loading ? <Skeleton />
        : items.length === 0 ? <Empty icon={IconMail} msg="No contact submissions yet" />
          : (
            <div className="space-y-3">
              {items.map((c: any) => (
                <div key={c.id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="flex items-start justify-between gap-4 p-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900">{c.name}</p>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500 flex-wrap">
                        {c.email && <span>{c.email}</span>}
                        {c.phone && <span>{c.phone}</span>}
                        {c.company && <span className="font-semibold">{c.company}</span>}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">{new Date(c.createdAt).toLocaleString("en-IN")}</p>
                    </div>
                    <button onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                      className="text-slate-400 hover:text-slate-700">
                      {expanded === c.id ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
                    </button>
                  </div>
                  {expanded === c.id && (
                    <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                      <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-3">{c.message || "No message"}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
    </div>
  );
}

// ── NEWSLETTER ───────────────────────────────────────────────────────────────

export function NewsletterPage({ showToast }: { showToast: (m: string, t?: any) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    apiFetch("/system/newsletter")
      .then(j => setItems(j.data?.items || j.data || []))
      .catch(e => showToast(e.message, "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const del = async (id: string) => {
    if (!confirm("Remove subscriber?")) return;
    try {
      await apiFetch(`/system/newsletter/${id}`, { method: "DELETE" });
      showToast("Subscriber removed");
      load();
    } catch (e: any) { showToast(e.message, "error"); }
  };

  const exportCSV = () => {
    const csv = "data:text/csv;charset=utf-8,Email,Date\n" +
      items.map((s: any) => `${s.email},${new Date(s.createdAt).toLocaleDateString()}`).join("\n");
    const a = document.createElement("a"); a.href = encodeURI(csv);
    a.download = "newsletter_subscribers.csv"; a.click();
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Newsletter Subscribers" count={items.length} onRefresh={load} refreshing={loading}>
        <button onClick={exportCSV} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition">
          Export CSV
        </button>
      </PageHeader>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left hidden sm:table-cell">Subscribed On</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan={5} className="p-6"><Skeleton /></td></tr>
              : items.length === 0 ? <tr><td colSpan={5}><Empty icon={IconNews} msg="No subscribers yet" /></td></tr>
                : items.map((s: any, i: number) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 text-xs text-slate-400 font-mono">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{s.email}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">
                      {new Date(s.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={s.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}>
                        {s.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => del(s.id)}
                        className="text-slate-300 hover:text-rose-500 transition">
                        <IconTrash size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── TESTIMONIALS ──────────────────────────────────────────────────────────────

export function TestimonialsPage({ showToast }: { showToast: (m: string, t?: any) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | "create" | any>(null);
  const [form, setForm] = useState({ name: "", designation: "", company: "", quote: "", rating: 5 });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    apiFetch("/content/testimonials?limit=100")
      .then(j => setItems(j.data?.items || []))
      .catch(e => showToast(e.message, "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ name: "", designation: "", company: "", quote: "", rating: 5 });
    setModal("create");
  };

  const openEdit = (t: any) => {
    setForm({ name: t.name, designation: t.designation || "", company: t.company || "", quote: t.quote, rating: t.rating || 5 });
    setModal(t);
  };

  const save = async () => {
    if (!form.name || !form.quote) { showToast("Name and quote required", "error"); return; }
    setSaving(true);
    try {
      if (modal === "create") {
        await apiFetch("/content/testimonials", { method: "POST", body: JSON.stringify(form) });
        showToast("Testimonial created");
      } else {
        await apiFetch(`/content/testimonials/${modal.id}`, { method: "PUT", body: JSON.stringify(form) });
        showToast("Testimonial updated");
      }
      setModal(null); load();
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete testimonial?")) return;
    try {
      await apiFetch(`/content/testimonials/${id}`, { method: "DELETE" });
      showToast("Deleted"); load();
    } catch (e: any) { showToast(e.message, "error"); }
  };

  const toggle = async (t: any) => {
    try {
      await apiFetch(`/content/testimonials/${t.id}`, { method: "PUT", body: JSON.stringify({ isActive: !t.isActive }) });
      showToast(t.isActive ? "Hidden" : "Published"); load();
    } catch (e: any) { showToast(e.message, "error"); }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Testimonials" count={items.length} onRefresh={load} refreshing={loading}>
        <button onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-xl bg-sky-700 hover:bg-sky-800 px-4 py-2 text-xs font-bold text-white transition">
          + Add Testimonial
        </button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? [1, 2, 3].map(i => <div key={i} className="h-48 rounded-xl bg-slate-100 animate-pulse" />) :
          items.length === 0 ? <Empty icon={IconMessageCircle} msg="No testimonials yet" /> :
            items.map((t: any) => (
              <div key={t.id} className={`rounded-xl border bg-white p-5 shadow-sm space-y-3 ${!t.isActive ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-extrabold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.designation}{t.company ? ` · ${t.company}` : ""}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => toggle(t)} title={t.isActive ? "Hide" : "Publish"}
                      className={`h-7 w-7 flex items-center justify-center rounded-lg transition ${t.isActive ? "text-emerald-600 hover:bg-emerald-50" : "text-slate-400 hover:bg-slate-50"}`}>
                      {t.isActive ? <IconCheck size={13} /> : <IconX size={13} />}
                    </button>
                    <button onClick={() => openEdit(t)} className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition">
                      <IconStar size={13} />
                    </button>
                    <button onClick={() => del(t.id)} className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition">
                      <IconTrash size={13} />
                    </button>
                  </div>
                </div>
                {/* Stars */}
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(n => (
                    <IconStar key={n} size={12} className={n <= (t.rating || 5) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"} />
                  ))}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 italic">"{t.quote}"</p>
                <Badge color={t.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}>
                  {t.isActive ? "Published" : "Hidden"}
                </Badge>
              </div>
            ))}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4"
          onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900">{modal === "create" ? "Add Testimonial" : "Edit Testimonial"}</h3>
              <button onClick={() => setModal(null)}><IconX size={18} className="text-slate-400" /></button>
            </div>
            <div className="p-5 space-y-3">
              {([
                { label: "Name *", key: "name", ph: "Customer name" },
                { label: "Designation", key: "designation", ph: "QA Manager" },
                { label: "Company", key: "company", ph: "Pharma Pvt Ltd" },
              ] as any[]).map(f => (
                <div key={f.key} className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">{f.label}</label>
                  <input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.ph} className={inp} />
                </div>
              ))}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button" onClick={() => setForm(p => ({ ...p, rating: n }))}>
                      <IconStar size={20} className={n <= form.rating ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">Quote *</label>
                <textarea value={form.quote} onChange={e => setForm(p => ({ ...p, quote: e.target.value }))}
                  rows={3} placeholder="Customer testimonial text..." className={`${inp} resize-none`} />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setModal(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button onClick={save} disabled={saving} className="flex-1 rounded-xl bg-sky-700 hover:bg-sky-800 py-2.5 text-sm font-bold text-white disabled:opacity-60 transition">
                  {saving ? "Saving…" : modal === "create" ? "Create" : "Update"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ORDERS ──────────────────────────────────────────────────────────────────

export function OrdersPage({ showToast }: { showToast: (m: string, t?: any) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [rates, setRates] = useState<Record<string, any[]>>({});
  const [loadingRates, setLoadingRates] = useState<Record<string, boolean>>({});
  const [selectedCourier, setSelectedCourier] = useState<Record<string, any>>({});

  const fetchRates = async (orderId: string) => {
    setLoadingRates(prev => ({ ...prev, [orderId]: true }));
    try {
      const res = await apiFetch(`/shipments/rates/${orderId}`);
      setRates(prev => ({ ...prev, [orderId]: res.data?.available_courier_companies || [] }));
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoadingRates(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const processShipment = async (orderId: string, courierId: any) => {
    setUpdatingId(orderId);
    try {
      await apiFetch(`/shipments/create`, {
        method: "POST",
        body: JSON.stringify({ orderId, courierId })
      });
      showToast("Shipment processed successfully in Shiprocket");
      load();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const load = useCallback(() => {
    setLoading(true);
    let url = `/orders?limit=100`;
    if (statusFilter) {
      url += `&status=${statusFilter}`;
    }
    apiFetch(url)
      .then(j => {
        setItems(j.data?.items || []);
      })
      .catch(e => showToast(e.message, "error"))
      .finally(() => setLoading(false));
  }, [statusFilter, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (id: string, newStatus: string, newPaymentStatus: string) => {
    setUpdatingId(id);
    try {
      await apiFetch(`/orders/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: newStatus,
          paymentStatus: newPaymentStatus,
          reason: `Updated via Admin Console`
        })
      });
      showToast("Order updated successfully");
      load();
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(item =>
      item.orderNumber.toLowerCase().includes(q) ||
      item.customerName.toLowerCase().includes(q) ||
      (item.customerEmail && item.customerEmail.toLowerCase().includes(q)) ||
      item.customerPhone.includes(q)
    );
  }, [items, search]);

  const statusColors: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800 border-amber-250",
    PAID: "bg-emerald-100 text-emerald-800 border-emerald-250",
    PROCESSING: "bg-blue-100 text-blue-800 border-blue-200",
    SHIPPED: "bg-indigo-100 text-indigo-800 border-indigo-200",
    DELIVERED: "bg-teal-100 text-teal-800 border-teal-200",
    CANCELLED: "bg-rose-100 text-rose-800 border-rose-200",
    REFUNDED: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const paymentStatusColors: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 border border-amber-200",
    SUCCESS: "bg-emerald-50 text-emerald-700 border border-emerald-250",
    FAILED: "bg-rose-50 text-rose-700 border border-rose-200",
    REFUNDED: "bg-slate-50 text-slate-600 border border-slate-200",
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Orders Management" count={filteredItems.length} onRefresh={load} refreshing={loading}>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-sky-500 transition"
          >
            <option value="">All Statuses</option>
            {["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <div className="relative">
            <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search order #, customer..."
              className="pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 bg-white outline-none focus:border-sky-500 w-56 transition"
            />
          </div>
        </div>
      </PageHeader>

      <div className="space-y-3">
        {loading ? (
          <Skeleton />
        ) : filteredItems.length === 0 ? (
          <Empty icon={IconShoppingCart} msg="No orders found" />
        ) : (
          filteredItems.map((order: any) => (
            <div key={order.id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden transition hover:shadow-md">
              <div className="flex items-start justify-between gap-4 p-4 flex-wrap sm:flex-nowrap">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <p className="font-extrabold text-slate-900 text-sm sm:text-base">{order.orderNumber}</p>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${statusColors[order.status] || "bg-slate-100 text-slate-650"}`}>
                      {order.status}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${paymentStatusColors[order.paymentStatus] || "bg-slate-150 text-slate-600"}`}>
                      Payment: {order.paymentStatus}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 space-y-0.5 mt-1">
                    <p className="font-semibold text-slate-800">{order.customerName}</p>
                    <p>{order.customerEmail || "No Email"} · {order.customerPhone}</p>
                    <p className="text-[10px] text-slate-450">Date: {new Date(order.createdAt).toLocaleString("en-IN")}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end justify-between gap-3 min-w-[200px]">
                  <p className="text-sm font-extrabold text-sky-700 sm:text-right">
                    Total: ₹{Number(order.total || 0).toLocaleString("en-IN")}
                  </p>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <select
                      value={order.status}
                      disabled={updatingId === order.id}
                      onChange={e => updateStatus(order.id, e.target.value, order.paymentStatus)}
                      className="text-xs rounded-lg border border-slate-200 bg-white px-2 py-1.5 outline-none focus:border-sky-500 disabled:opacity-50 transition"
                    >
                      {["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>

                    <select
                      value={order.paymentStatus}
                      disabled={updatingId === order.id}
                      onChange={e => updateStatus(order.id, order.status, e.target.value)}
                      className="text-xs rounded-lg border border-slate-200 bg-white px-2 py-1.5 outline-none focus:border-sky-500 disabled:opacity-50 transition"
                    >
                      {["PENDING", "SUCCESS", "FAILED", "REFUNDED"].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                    >
                      {expanded === order.id ? <IconChevronDown size={18} /> : <IconChevronRight size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {expanded === order.id && (
                <div className="px-4 pb-4 border-t border-slate-100 pt-4 bg-slate-50/50 space-y-4">
                  {/* Items list */}
                  <div>
                    <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">Order Items</h4>
                    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                          <tr>
                            <th className="px-4 py-2 text-left">Product</th>
                            <th className="px-4 py-2 text-center">Qty</th>
                            <th className="px-4 py-2 text-right">Unit Price</th>
                            <th className="px-4 py-2 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {order.items?.map((item: any) => (
                            <tr key={item.id}>
                              <td className="px-4 py-2.5">
                                <p className="font-bold text-slate-800">{item.productName}</p>
                                {item.variantName && <p className="text-[10px] text-slate-450">{item.variantName}</p>}
                                <p className="text-[9px] font-mono text-slate-400">{item.sku}</p>
                              </td>
                              <td className="px-4 py-2.5 text-center font-semibold text-slate-700">{item.quantity}</td>
                              <td className="px-4 py-2.5 text-right text-slate-600">₹{Number(item.unitPrice || 0).toLocaleString("en-IN")}</td>
                              <td className="px-4 py-2.5 text-right font-semibold text-slate-800">₹{Number(item.totalPrice || 0).toLocaleString("en-IN")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Address & Pricing Grid */}
                  <div className="grid gap-4 md:grid-cols-3">
                    {order.shippingAddress && (
                      <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1">
                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Shipping Address</p>
                        <div className="text-xs text-slate-700 space-y-0.5">
                          <p className="font-semibold">{(order.shippingAddress as any).name || order.customerName}</p>
                          <p>{(order.shippingAddress as any).addressLine1}</p>
                          {(order.shippingAddress as any).addressLine2 && <p>{(order.shippingAddress as any).addressLine2}</p>}
                          <p>{(order.shippingAddress as any).city}, {(order.shippingAddress as any).state} - {(order.shippingAddress as any).postalCode}</p>
                          <p>{(order.shippingAddress as any).country || "India"}</p>
                        </div>
                      </div>
                    )}

                    {order.billingAddress && (
                      <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1">
                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Billing Address</p>
                        <div className="text-xs text-slate-700 space-y-0.5">
                          <p className="font-semibold">{(order.billingAddress as any).name || order.customerName}</p>
                          <p>{(order.billingAddress as any).addressLine1}</p>
                          {(order.billingAddress as any).addressLine2 && <p>{(order.billingAddress as any).addressLine2}</p>}
                          <p>{(order.billingAddress as any).city}, {(order.billingAddress as any).state} - {(order.billingAddress as any).postalCode}</p>
                          <p>{(order.billingAddress as any).country || "India"}</p>
                        </div>
                      </div>
                    )}

                    <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1.5 text-xs">
                      <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Financial Summary</p>
                      <div className="space-y-1 text-slate-650">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span className="font-bold text-slate-800">₹{Number(order.subtotal || 0).toLocaleString("en-IN")}</span>
                        </div>
                        {Number(order.discount || 0) > 0 && (
                          <div className="flex justify-between text-emerald-600 font-semibold">
                            <span>Discount {order.couponCode ? `(${order.couponCode})` : ""}:</span>
                            <span>−₹{Number(order.discount).toLocaleString("en-IN")}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>GST (18%):</span>
                          <span className="font-bold text-slate-800">₹{Number(order.tax || 0).toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Shipping:</span>
                          <span className="font-bold text-slate-800">₹{Number(order.shipping || 0).toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-100 pt-1 font-extrabold text-sky-700">
                          <span>Grand Total:</span>
                          <span>₹{Number(order.total || 0).toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Logistics / Shipping section */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                    <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Logistics & Shiprocket Shipping</p>

                    {order.awbCode ? (
                      <div className="rounded-xl bg-sky-50 border border-sky-100 p-3.5 flex flex-wrap justify-between items-center gap-3">
                        <div className="text-xs">
                          <p className="font-bold text-sky-900">Shipment Registered in Shiprocket</p>
                          <p className="text-slate-600 mt-1">Courier Partner: <span className="font-semibold text-slate-800">{order.courierName || "Standard Courier"}</span></p>
                          <p className="text-slate-600">AWB Code: <code className="font-mono bg-sky-100 px-1.5 py-0.5 rounded text-sky-700 font-bold">{order.awbCode}</code></p>
                          <p className="text-slate-600">Shiprocket Status: <span className="font-bold text-sky-800">{order.shiprocketStatus || "AWB_ASSIGNED"}</span></p>
                        </div>
                        <a href={`https://shiprocket.co/tracking/${order.awbCode}`} target="_blank" rel="noopener noreferrer"
                          className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 transition">
                          Track Shipment
                        </a>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => fetchRates(order.id)}
                            disabled={loadingRates[order.id]}
                            className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 transition disabled:opacity-50"
                          >
                            {loadingRates[order.id] ? "Fetching Courier Rates..." : "Check Logistics / Fetch Rates"}
                          </button>
                          <p className="text-[10px] text-slate-400 leading-relaxed max-w-md">
                            Calculates Shiprocket real-time rates based on pickup coordinates, order dimensions, weight, and delivery pincode.
                          </p>
                        </div>

                        {rates[order.id] && rates[order.id].length > 0 && (
                          <div className="space-y-2.5">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Select Delivery Courier partner (Prepaid by Admin):</p>
                            <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                              {rates[order.id].map((c: any) => {
                                const isSelected = selectedCourier[order.id] === c.courier_company_id;
                                return (
                                  <div
                                    key={c.courier_company_id || c.courier_name}
                                    onClick={() => setSelectedCourier(prev => ({ ...prev, [order.id]: c.courier_company_id }))}
                                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${isSelected ? "border-sky-600 bg-sky-50/50" : "border-slate-205 bg-white hover:border-slate-300"
                                      }`}
                                  >
                                    <div>
                                      <p className="font-bold text-slate-800 text-xs">{c.courier_name}</p>
                                      <p className="text-[10px] text-slate-400 mt-0.5">Delivery: {c.expected_delivery_date || "3-4 Days"}</p>
                                    </div>
                                    <p className="text-xs font-extrabold text-sky-700 mt-2">₹{c.rate}</p>
                                  </div>
                                );
                              })}
                            </div>
                            <button
                              onClick={() => processShipment(order.id, selectedCourier[order.id])}
                              disabled={!selectedCourier[order.id] || updatingId === order.id}
                              className="w-full sm:w-auto rounded-xl bg-sky-600 hover:bg-sky-700 px-6 py-2.5 text-xs font-extrabold text-white transition disabled:opacity-50 shadow"
                            >
                              Process Shiprocket Order & AWB (Paid by Admin)
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {order.notes && (
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Customer Order Notes</p>
                      <p className="text-xs text-slate-700 italic">{order.notes}</p>
                    </div>
                  )}

                  {(() => {
                    const cancelHistoryLog = order.statusHistory?.find((h: any) => h.status === "CANCELLED");
                    if (cancelHistoryLog) {
                      return (
                        <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3.5 mt-2">
                          <p className="text-[9px] font-extrabold uppercase tracking-wider text-rose-700 mb-1">Cancellation / Return Reason</p>
                          <p className="text-xs text-rose-800 font-semibold leading-relaxed">{cancelHistoryLog.notes}</p>
                          <p className="text-[9px] text-rose-450 mt-1">Logged on: {new Date(cancelHistoryLog.createdAt).toLocaleString("en-IN")}</p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
