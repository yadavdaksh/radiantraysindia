import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconPlus, IconSearch, IconEdit, IconTrash, IconDots,
  IconBox, IconFilter, IconChevronLeft, IconChevronRight,
  IconCheck, IconX, IconPhoto, IconTableExport,
} from "@tabler/icons-react";

import { apiFetch } from "../lib/api";
import { ExportModal } from "../components/ExportModal";

const PRODUCT_EXPORT_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "sku", label: "SKU" },
  { key: "productType", label: "Product Type" },
  { key: "basePrice", label: "Base Price" },
  { key: "salePrice", label: "Sale Price" },
  { key: "isActive", label: "Active" },
  { key: "badge", label: "Badge" },
  { key: "createdAt", label: "Created At" },
];

const CLIENT_URL = "http://localhost:3000";
function getSlugFallback(slug: string): string {
  const s = (slug || "").toLowerCase();
  if (s.includes("biosafety")) return `${CLIENT_URL}/images/products/biosafety-cabinet-class-ii-a2.png`;
  if (s.includes("laminar"))   return `${CLIENT_URL}/images/products/laminar-air-flow-system.png`;
  if (s.includes("pass"))      return `${CLIENT_URL}/images/products/pass-box-system.png`;
  if (s.includes("storage") || s.includes("cabinet") || s.includes("furniture") || s.includes("table"))
    return `${CLIENT_URL}/images/products/cleanroom-storage-cabinet.png`;
  return `${CLIENT_URL}/images/products/biosafety-cabinet-class-ii-a2.png`;
}

const PAGE_SIZE = 30;

function Badge({ type }: { type: "B2B" | "B2C" }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${type === "B2B" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
      {type}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${active ? "bg-sky-50 text-sky-700" : "bg-slate-100 text-slate-400"}`}>
      {active ? <IconCheck size={10} /> : <IconX size={10} />}
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[1,2,3,4,5,6].map(i => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-slate-100 rounded" />
        </td>
      ))}
    </tr>
  );
}

// Ellipsis dropdown
function RowMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-slate-100 transition text-slate-500">
        <IconDots size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-36 rounded-xl border border-slate-200 bg-white shadow-xl py-1 text-xs">
          <button onClick={() => { onEdit(); setOpen(false); }} className="flex items-center gap-2.5 w-full px-3.5 py-2.5 hover:bg-slate-50 text-slate-700 font-semibold">
            <IconEdit size={13} /> Edit
          </button>
          <button onClick={() => { onDelete(); setOpen(false); }} className="flex items-center gap-2.5 w-full px-3.5 py-2.5 hover:bg-rose-50 text-rose-600 font-semibold">
            <IconTrash size={13} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage({ showToast }: { showToast: (msg: string, type?: "success"|"error") => void }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL"|"B2B"|"B2C">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL"|"active"|"inactive">("ALL");
  const [deleting, setDeleting] = useState<string|null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (search) params.set("search", search);
      if (typeFilter !== "ALL") params.set("productType", typeFilter);
      if (statusFilter !== "ALL") params.set("isActive", statusFilter === "active" ? "true" : "false");
      const j = await apiFetch(`/products?${params}`);
      setProducts(j.data.items || []);
      setTotal(j.data.total || 0);
    } catch { showToast("Failed to load products", "error"); }
    finally { setLoading(false); }
  }, [page, search, typeFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  // Debounce search
  const searchTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(1);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {}, 300);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Archive product "${name}"?`)) return;
    setDeleting(id);
    try {
      await apiFetch(`/products/${id}`, { method: "DELETE" });
      showToast("Product archived");
      load();
    } catch (e: any) { showToast(e.message || "Delete failed", "error"); }
    finally { setDeleting(null); }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-950">Products</h1>
          <p className="text-xs text-slate-400 mt-0.5">{total} total products in catalog</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExportOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            <IconTableExport size={14} /> Export
          </button>
          <button
            onClick={() => navigate("/products/add")}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-700 hover:bg-sky-800 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition"
          >
            <IconPlus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search by name, SKU..."
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition"
          />
          {search && (
            <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
              <IconX size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <IconFilter size={14} className="text-slate-400" />
          <div className="flex bg-slate-100 rounded-xl p-1 text-xs font-bold">
            {(["ALL","B2B","B2C"] as const).map(t => (
              <button key={t} onClick={() => { setTypeFilter(t); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg transition ${typeFilter === t ? "bg-white text-sky-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                {t}
              </button>
            ))}
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value as any); setPage(1); }}
            className="text-xs font-semibold rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-sky-500">
            <option value="ALL">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3 text-left w-12"></th>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">SKU</th>
                <th className="px-4 py-3 text-left">Price</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Variants</th>
                <th className="px-4 py-3 text-right w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-300">
                      <IconBox size={36} strokeWidth={1.25} />
                      <p className="text-sm font-semibold text-slate-400">No products found</p>
                      {(search || typeFilter !== "ALL") && (
                        <button onClick={() => { setSearch(""); setTypeFilter("ALL"); setPage(1); }}
                          className="text-xs font-bold text-sky-600 hover:underline">Clear filters</button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : products.map(p => {
                // product images → default variant images → slug-based fallback
                const img = p.images?.find((i: any) => i.isPrimary)?.url
                  || p.images?.[0]?.url
                  || (() => {
                    const defVar = p.variants?.find((v: any) => v.isDefault) || p.variants?.[0];
                    return defVar?.images?.[0]?.url || defVar?.imageUrl || null;
                  })()
                  || getSlugFallback(p.slug);
                const price = p.productType === "B2C"
                  ? (p.salePrice ? `₹${Number(p.salePrice).toLocaleString("en-IN")}` : p.basePrice ? `₹${Number(p.basePrice).toLocaleString("en-IN")}` : "—")
                  : "Quote";
                return (
                  <tr key={p.id} className={`hover:bg-slate-50 transition ${deleting === p.id ? "opacity-40 pointer-events-none" : ""}`}>
                    {/* Image */}
                    <td className="px-4 py-3">
                      <div className="h-11 w-11 rounded-lg border border-slate-100 bg-white overflow-hidden flex items-center justify-center p-1">
                        {img
                          ? <img src={img} alt="" className="max-h-full max-w-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          : <IconPhoto size={16} className="text-slate-300" />}
                      </div>
                    </td>
                    {/* Name */}
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 max-w-48 truncate">{p.name}</p>
                      {p.badge && <span className="text-[9px] font-extrabold text-rose-600">{p.badge}</span>}
                    </td>
                    <td className="px-4 py-3"><Badge type={p.productType} /></td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.sku}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">{price}</td>
                    <td className="px-4 py-3"><StatusBadge active={p.isActive} /></td>
                    <td className="px-4 py-3 text-xs text-slate-500">{p.variants?.length ?? 0}</td>
                    <td className="px-4 py-3 text-right">
                      <RowMenu
                        onEdit={() => navigate(`/products/edit/${p.id}`)}
                        onDelete={() => handleDelete(p.id, p.name)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 transition">
                <IconChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = page <= 3 ? i + 1 : page - 2 + i;
                if (pg < 1 || pg > totalPages) return null;
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    className={`h-8 w-8 rounded-lg border text-xs font-bold transition ${pg === page ? "bg-sky-700 text-white border-sky-700" : "border-slate-200 hover:bg-slate-50 text-slate-600"}`}>
                    {pg}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 transition">
                <IconChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Export Products"
        columns={PRODUCT_EXPORT_COLUMNS}
        data={products}
      />
    </div>
  );
}
