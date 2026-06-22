import React, { useState, useEffect } from "react";
import {
  IconPlus, IconEdit, IconTrash, IconX,
  IconChevronDown, IconChevronRight,
  IconTag, IconCategory, IconCategory2, IconAlertCircle,
} from "@tabler/icons-react";
import { ImageUploadField } from "../components/Views";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4002/api/v1";

async function api(path: string, opts: RequestInit = {}) {
  const r = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.message || `Error ${r.status}`);
  return j;
}

interface SubCat {
  id: string; name: string; slug: string;
  description?: string; imageUrl?: string; categoryId: string;
  _count?: { productLinks: number };
}
interface Cat {
  id: string; name: string; slug: string;
  description?: string; imageUrl?: string; order: number;
  subCategories: SubCat[];
  _count?: { productLinks: number };
}

// ── Shared inputs ─────────────────────────────────────────────────────────────
const inp = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 transition";
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      {children}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ title, subtitle, onClose, children }: {
  title: string; subtitle?: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-slate-950 text-base">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition mt-0.5 shrink-0">
            <IconX size={20} />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ── Category Form ─────────────────────────────────────────────────────────────
function CategoryForm({ initial, onSave, onClose, showToast }: {
  initial?: Cat | null;
  onSave: () => void; onClose: () => void;
  showToast: (m: string, t?: "success" | "error") => void;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [desc, setDesc] = useState(initial?.description || "");
  const [img, setImg] = useState(initial?.imageUrl || "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleNameChange = (val: string) => {
    setName(val);
    if (!initial) {
      const slugified = val.toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
      setSlug(slugified);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setErr("Category name is required"); return; }
    setSaving(true); setErr("");
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: desc || null,
        imageUrl: img || null
      };
      if (initial) {
        await api(`/categories/${initial.id}`, { method: "PUT", body: JSON.stringify(payload) });
        showToast("Category updated successfully");
      } else {
        await api("/categories", { method: "POST", body: JSON.stringify(payload) });
        showToast("Category created successfully");
      }
      onSave();
    } catch (ex: any) { setErr(ex.message || "Save failed"); setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      {err && (
        <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700 font-semibold">
          <IconAlertCircle size={16} className="shrink-0 mt-0.5" /> {err}
        </div>
      )}
      <F label="Category Name *">
        <input value={name} onChange={e => handleNameChange(e.target.value)} required autoFocus
          className={inp} placeholder="e.g. Biosafety Cabinets" />
      </F>
      <F label="Category Slug (URL Path) *">
        <input value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-"))} required
          className={`${inp} font-mono`} placeholder="e.g. biosafety-cabinets" />
      </F>
      <F label="Description">
        <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3}
          className={`${inp} resize-none`} placeholder="Brief description shown on website..." />
      </F>
      <ImageUploadField label="Category Image (800×600px)" value={img} onChange={setImg}
        showToast={showToast} dimensions="800 × 600 px" />
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose}
          className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="flex-1 rounded-xl bg-sky-700 hover:bg-sky-800 py-3 text-sm font-bold text-white transition shadow-sm disabled:opacity-60">
          {saving
            ? <span className="flex items-center justify-center gap-2"><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</span>
            : initial ? "Update Category" : "Create Category"}
        </button>
      </div>
    </form>
  );
}

// ── Sub-Category Form ─────────────────────────────────────────────────────────
function SubCategoryForm({ initial, categories, defaultCatId, onSave, onClose, showToast }: {
  initial?: SubCat | null;
  categories: Cat[];
  defaultCatId?: string;
  onSave: () => void; onClose: () => void;
  showToast: (m: string, t?: "success" | "error") => void;
}) {
  const [catId, setCatId] = useState(initial?.categoryId || defaultCatId || (categories[0]?.id ?? ""));
  const [name, setName] = useState(initial?.name || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [desc, setDesc] = useState(initial?.description || "");
  const [img, setImg] = useState(initial?.imageUrl || "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleNameChange = (val: string) => {
    setName(val);
    if (!initial) {
      const slugified = val.toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
      setSlug(slugified);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catId) { setErr("Select a parent category"); return; }
    if (!name.trim()) { setErr("Sub-category name is required"); return; }
    setSaving(true); setErr("");
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: desc || null,
        imageUrl: img || null,
        categoryId: catId
      };
      if (initial) {
        await api(`/categories/subcategories/${initial.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        showToast("Sub-category updated successfully");
      } else {
        await api("/categories/subcategories", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        showToast("Sub-category created successfully");
      }
      onSave();
    } catch (ex: any) { setErr(ex.message || "Save failed"); setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      {err && (
        <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700 font-semibold">
          <IconAlertCircle size={16} className="shrink-0 mt-0.5" /> {err}
        </div>
      )}
      <F label="Parent Category *">
        <select value={catId} onChange={e => setCatId(e.target.value)} required
          className={`${inp} bg-white`}>
          <option value="">— Select a category —</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </F>
      <F label="Sub-Category Name *">
        <input value={name} onChange={e => handleNameChange(e.target.value)} required autoFocus
          className={inp} placeholder="e.g. Class II A2, Vertical LAF" />
      </F>
      <F label="Sub-Category Slug (URL Path) *">
        <input value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-"))} required
          className={`${inp} font-mono`} placeholder="e.g. class-ii-a2" />
      </F>
      <F label="Description">
        <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
          className={`${inp} resize-none`} placeholder="Optional description..." />
      </F>
      <ImageUploadField label="Sub-Category Image (800×600px)" value={img} onChange={setImg}
        showToast={showToast} dimensions="800 × 600 px" />
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose}
          className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="flex-1 rounded-xl bg-sky-700 hover:bg-sky-800 py-3 text-sm font-bold text-white transition shadow-sm disabled:opacity-60">
          {saving
            ? <span className="flex items-center justify-center gap-2"><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</span>
            : initial ? "Update Sub-Category" : "Create Sub-Category"}
        </button>
      </div>
    </form>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CategoriesPage({ showToast }: {
  showToast: (m: string, t?: "success" | "error" | "info") => void;
}) {
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<string | null>(null);

  type CatModal = null | "create" | Cat;
  type SubModal = null | "create" | SubCat;
  const [catModal, setCatModal] = useState<CatModal>(null);
  const [subModal, setSubModal] = useState<SubModal>(null);
  const [subDefaultCatId, setSubDefault] = useState<string | undefined>();

  const load = async () => {
    setLoading(true);
    try {
      const j = await api("/categories?limit=100");
      const list: Cat[] = j.data?.items || j.data || [];
      setCats(list);
      setExpanded(new Set(list.map((c: Cat) => c.id)));
    } catch (e: any) { showToast(e.message || "Failed to load categories", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggle = (id: string) =>
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const deleteCat = async (cat: Cat) => {
    if (!confirm(`Delete "${cat.name}" and all its ${cat.subCategories?.length || 0} sub-categories?`)) return;
    setDeleting(cat.id);
    try {
      await api(`/categories/${cat.id}`, { method: "DELETE" });
      showToast("Category deleted");
      load();
    } catch (e: any) { showToast(e.message || "Delete failed", "error"); }
    finally { setDeleting(null); }
  };

  const deleteSub = async (sub: SubCat) => {
    if (!confirm(`Delete sub-category "${sub.name}"?`)) return;
    setDeleting(sub.id);
    try {
      await api(`/categories/subcategories/${sub.id}`, { method: "DELETE" });
      showToast("Sub-category deleted");
      load();
    } catch (e: any) { showToast(e.message || "Delete failed", "error"); }
    finally { setDeleting(null); }
  };

  const openAddSub = (catId?: string) => { setSubDefault(catId); setSubModal("create"); };
  const totalSubs = cats.reduce((s, c) => s + (c.subCategories?.length || 0), 0);

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">Categories</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {cats.length} categories · {totalSubs} sub-categories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => openAddSub()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 transition shadow-sm">
            <IconCategory2 size={16} /> Add Sub-Category
          </button>
          <button onClick={() => setCatModal("create")}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-700 hover:bg-sky-800 px-4 py-2.5 text-sm font-bold text-white transition shadow-sm">
            <IconPlus size={16} /> Add Category
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">

        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[40px_1fr_120px_auto] gap-0 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
          <span className="hidden sm:block" />
          <span>Name</span>
          <span className="hidden sm:block text-center">Sub-cats</span>
          <span className="text-right">Actions</span>
        </div>

        {loading ? (
          <div className="divide-y divide-slate-100">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="h-12 w-12 rounded-xl bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-48" />
                  <div className="h-3 bg-slate-100 rounded w-28" />
                </div>
              </div>
            ))}
          </div>
        ) : cats.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-4 text-slate-300">
            <IconCategory size={48} strokeWidth={1} />
            <div className="text-center">
              <p className="font-bold text-slate-500 text-base">No categories yet</p>
              <p className="text-sm text-slate-400 mt-1">Create your first category to organise products</p>
            </div>
            <button onClick={() => setCatModal("create")}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-800 transition">
              <IconPlus size={16} /> Create First Category
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {cats.map(cat => {
              const isExp = expanded.has(cat.id);
              const subs = cat.subCategories || [];
              const isDeleting = deleting === cat.id;

              return (
                <div key={cat.id} className={isDeleting ? "opacity-40 pointer-events-none" : ""}>

                  {/* ── Category row ── */}
                  <div className="group grid grid-cols-[1fr_auto] sm:grid-cols-[40px_1fr_120px_auto] items-center gap-3 px-5 py-4 hover:bg-slate-50 transition">
                    {/* Expand toggle — desktop only */}
                    <button type="button" onClick={() => toggle(cat.id)}
                      className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 transition shrink-0">
                      {isExp ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
                    </button>

                    {/* Image + info */}
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Mobile expand */}
                      <button type="button" onClick={() => toggle(cat.id)} className="sm:hidden shrink-0">
                        {isExp ? <IconChevronDown size={16} className="text-slate-400" /> : <IconChevronRight size={16} className="text-slate-400" />}
                      </button>
                      <div className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                        {cat.imageUrl
                          ? <img src={cat.imageUrl} alt={cat.name} className="h-full w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          : <IconCategory size={20} className="text-slate-300" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 text-base leading-tight">{cat.name}</p>
                          <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-extrabold text-sky-700 shrink-0">
                            {cat._count?.productLinks ?? 0} products
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono truncate mt-0.5">{cat.slug}</p>
                        {cat.description && <p className="text-xs text-slate-500 truncate mt-0.5 max-w-sm">{cat.description}</p>}
                        {/* Mobile sub count */}
                        <p className="text-xs text-slate-400 sm:hidden mt-0.5">{subs.length} sub-categories</p>
                      </div>
                    </div>

                    {/* Sub count — desktop */}
                    <div className="hidden sm:flex justify-center">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        <IconCategory2 size={12} /> {subs.length}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openAddSub(cat.id)} title="Add sub-category"
                        className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-sky-50 text-sky-600 transition" >
                        <IconTag size={16} />
                      </button>
                      <button onClick={() => setCatModal(cat)} title="Edit"
                        className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 transition">
                        <IconEdit size={16} />
                      </button>
                      <button onClick={() => deleteCat(cat)} title="Delete"
                        className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-rose-50 text-rose-500 transition">
                        <IconTrash size={16} />
                      </button>
                    </div>
                  </div>

                  {/* ── Sub-categories ── */}
                  {isExp && (
                    <div className="bg-slate-50/60 border-t border-slate-100">
                      {subs.length === 0 ? (
                        <div className="pl-16 sm:pl-20 pr-5 py-4 flex items-center gap-3">
                          <p className="text-sm text-slate-400 italic">No sub-categories</p>
                          <button onClick={() => openAddSub(cat.id)}
                            className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1">
                            <IconPlus size={11} /> Add one
                          </button>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {subs.map(sub => (
                            <div key={sub.id} className={`group grid grid-cols-[1fr_auto] items-center gap-3 pl-16 sm:pl-20 pr-5 py-3.5 hover:bg-slate-100 transition ${deleting === sub.id ? "opacity-40 pointer-events-none" : ""}`}>
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 bg-white overflow-hidden flex items-center justify-center">
                                  {sub.imageUrl
                                    ? <img src={sub.imageUrl} alt={sub.name} className="h-full w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                    : <IconCategory2 size={16} className="text-slate-300" />}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-slate-800 text-sm">{sub.name}</p>
                                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-700 shrink-0">
                                      {sub._count?.productLinks ?? 0} products
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 font-mono truncate">{sub.slug}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button onClick={() => setSubModal(sub)}
                                  className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white text-slate-400 hover:text-sky-600 transition">
                                  <IconEdit size={15} />
                                </button>
                                <button onClick={() => deleteSub(sub)}
                                  className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white text-slate-400 hover:text-rose-500 transition">
                                  <IconTrash size={15} />
                                </button>
                              </div>
                            </div>
                          ))}
                          {/* Add sub inline */}
                          <button onClick={() => openAddSub(cat.id)}
                            className="flex items-center gap-2 pl-16 sm:pl-20 pr-5 py-3 w-full text-sm font-semibold text-sky-600 hover:bg-slate-100 transition">
                            <IconPlus size={14} /> Add sub-category to "{cat.name}"
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Category Modal ── */}
      {catModal && (
        <Modal
          title={catModal === "create" ? "Add Category" : `Edit Category`}
          subtitle={catModal !== "create" ? (catModal as Cat).name : "Fill in name, description and optional image"}
          onClose={() => setCatModal(null)}
        >
          <CategoryForm
            initial={catModal === "create" ? null : catModal as Cat}
            onSave={() => { setCatModal(null); load(); }}
            onClose={() => setCatModal(null)}
            showToast={showToast}
          />
        </Modal>
      )}

      {/* ── Sub-Category Modal ── */}
      {subModal && (
        <Modal
          title={subModal === "create" ? "Add Sub-Category" : "Edit Sub-Category"}
          subtitle={subModal !== "create" ? (subModal as SubCat).name : undefined}
          onClose={() => { setSubModal(null); setSubDefault(undefined); }}
        >
          <SubCategoryForm
            initial={subModal === "create" ? null : subModal as SubCat}
            categories={cats}
            defaultCatId={subDefaultCatId}
            onSave={() => { setSubModal(null); setSubDefault(undefined); load(); }}
            onClose={() => { setSubModal(null); setSubDefault(undefined); }}
            showToast={showToast}
          />
        </Modal>
      )}
    </div>
  );
}
