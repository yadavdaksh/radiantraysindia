/**
 * MorePages.tsx — Industries, Gallery, Banners, Roles, Users
 * All real API, no mock data.
 */
import React, { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";
import { ImageUploadField } from "../components/Views";
import {
  IconBuildingFactory, IconPhoto, IconFlag, IconShieldHalf,
  IconUser, IconPlus, IconEdit, IconTrash, IconX, IconRefresh,
  IconSearch, IconCheck, IconKey, IconEye, IconEyeOff,
  IconLock, IconBriefcase, IconMapPin, IconClock, IconUsers, IconTableExport,
  IconChevronDown, IconChevronRight, IconNotes, IconPhone, IconMail,
  IconPackage, IconTruck, IconTool, IconBox, IconCircleCheck, IconAlertCircle,
  IconTarget, IconBuildingStore,
} from "@tabler/icons-react";
import { ExportModal } from "../components/ExportModal";

const USERS_EXPORT_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "isActive", label: "Active" },
  { key: "createdAt", label: "Created At" },
];

const ACTIVITY_EXPORT_COLUMNS = [
  { key: "type", label: "Type" },
  { key: "title", label: "Title" },
  { key: "entityType", label: "Entity Type" },
  { key: "actor.name", label: "Actor" },
  { key: "createdAt", label: "Created At" },
];

const CAREERS_EXPORT_COLUMNS = [
  { key: "title", label: "Title" },
  { key: "status", label: "Status" },
  { key: "type", label: "Type" },
  { key: "location", label: "Location" },
  { key: "department", label: "Department" },
  { key: "experience", label: "Experience" },
  { key: "salaryMin", label: "Salary Min" },
  { key: "salaryMax", label: "Salary Max" },
  { key: "createdAt", label: "Created At" },
];

const inp = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-sky-500 focus:bg-white transition";

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${color}`}>{children}</span>;
}
function Skeleton() {
  return <div className="space-y-3 animate-pulse">{[1, 2, 3, 4].map(i => <div key={i} className="h-14 rounded-xl bg-slate-100" />)}</div>;
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

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <h3 className="font-extrabold text-slate-900">{title}</h3>
          <button onClick={onClose}><IconX size={18} className="text-slate-400" /></button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ── INDUSTRIES ────────────────────────────────────────────────────────────────
export function IndustriesPage({ showToast }: { showToast: (m: string, t?: any) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | "create" | any>(null);
  const [form, setForm] = useState({ name: "", description: "", imageUrl: "" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    apiFetch("/industries?limit=100")
      .then(j => setItems(j.data?.items || j.data || []))
      .catch(e => showToast(e.message, "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm({ name: "", description: "", imageUrl: "" }); setModal("create"); };
  const openEdit = (item: any) => { setForm({ name: item.name, description: item.description || "", imageUrl: item.imageUrl || "" }); setModal(item); };

  const save = async () => {
    if (!form.name.trim()) { showToast("Name required", "error"); return; }
    setSaving(true);
    try {
      if (modal === "create") {
        await apiFetch("/industries", { method: "POST", body: JSON.stringify(form) });
        showToast("Industry created");
      } else {
        await apiFetch(`/industries/${modal.id}`, { method: "PUT", body: JSON.stringify(form) });
        showToast("Industry updated");
      }
      setModal(null); load();
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const del = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try { await apiFetch(`/industries/${id}`, { method: "DELETE" }); showToast("Deleted"); load(); }
    catch (e: any) { showToast(e.message, "error"); }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Industries" count={items.length} onRefresh={load} refreshing={loading}>
        <button onClick={openCreate} className="inline-flex items-center gap-1.5 rounded-xl bg-sky-700 hover:bg-sky-800 px-4 py-2 text-xs font-bold text-white transition">
          <IconPlus size={14} /> Add Industry
        </button>
      </PageHeader>

      {loading ? <Skeleton /> : items.length === 0 ? <Empty icon={IconBuildingFactory} msg="No industries" /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item: any) => (
            <div key={item.id} className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 flex items-start gap-3">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="h-12 w-12 rounded-xl object-cover shrink-0 border border-slate-100" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <div className="h-12 w-12 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                  <IconBuildingFactory size={20} className="text-brand" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900">{item.name}</p>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{item.description || item.slug}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(item)} className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition"><IconEdit size={13} /></button>
                <button onClick={() => del(item.id, item.name)} className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition"><IconTrash size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === "create" ? "Add Industry" : "Edit Industry"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase text-slate-500">Name *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inp} placeholder="e.g. Pharmaceutical" autoFocus /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase text-slate-500">Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className={`${inp} resize-none`} placeholder="Brief description..." /></div>
            <ImageUploadField label="Industry Image (optional)" value={form.imageUrl} onChange={url => setForm(p => ({ ...p, imageUrl: url }))} showToast={showToast} dimensions="800×600px" />
            <div className="flex gap-3 pt-1">
              <button onClick={() => setModal(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 rounded-xl bg-sky-700 hover:bg-sky-800 py-2.5 text-sm font-bold text-white disabled:opacity-60 transition">
                {saving ? "Saving…" : modal === "create" ? "Create" : "Update"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── GALLERY ───────────────────────────────────────────────────────────────────
export function GalleryPage({ showToast }: { showToast: (m: string, t?: any) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | "create" | any>(null);
  const [imgUrl, setImgUrl] = useState("");
  const [title, setTitle] = useState("");
  const [cat, setCat] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    apiFetch("/content/gallery?limit=100")
      .then(j => setItems(j.data?.items || []))
      .catch(e => showToast(e.message, "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setImgUrl(""); setTitle(""); setCat(""); setModal("create"); };
  const openEdit = (item: any) => { setImgUrl(item.imageUrl || ""); setTitle(item.title); setCat(item.category || ""); setModal(item); };

  const save = async () => {
    if (!title.trim()) { showToast("Title required", "error"); return; }
    if (!imgUrl) { showToast("Upload an image first", "error"); return; }
    setSaving(true);
    try {
      const payload = { title, imageUrl: imgUrl, category: cat || null };
      if (modal === "create") {
        await apiFetch("/content/gallery", { method: "POST", body: JSON.stringify(payload) });
        showToast("Gallery item added");
      } else {
        await apiFetch(`/content/gallery/${modal.id}`, { method: "PUT", body: JSON.stringify(payload) });
        showToast("Updated");
      }
      setModal(null); load();
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete gallery item?")) return;
    try { await apiFetch(`/content/gallery/${id}`, { method: "DELETE" }); showToast("Deleted"); load(); }
    catch (e: any) { showToast(e.message, "error"); }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Gallery" count={items.length} onRefresh={load} refreshing={loading}>
        <button onClick={openCreate} className="inline-flex items-center gap-1.5 rounded-xl bg-sky-700 hover:bg-sky-800 px-4 py-2 text-xs font-bold text-white transition">
          <IconPlus size={14} /> Add Image
        </button>
      </PageHeader>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <div key={i} className="aspect-[4/3] rounded-xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : items.length === 0 ? <Empty icon={IconPhoto} msg="No gallery images yet" /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item: any) => (
            <div key={item.id} className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm group">
              {item.imageUrl ? (
                <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                </div>
              ) : (
                <div className="aspect-[4/3] bg-gradient-to-br from-brand/10 to-slate-200/60 flex items-center justify-center">
                  <IconPhoto size={32} className="text-slate-300" />
                </div>
              )}
              <div className="p-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 text-sm truncate">{item.title}</p>
                  {item.category && <Badge color="bg-brand/10 text-brand">{item.category}</Badge>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(item)} className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition"><IconEdit size={13} /></button>
                  <button onClick={() => del(item.id)} className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition"><IconTrash size={13} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === "create" ? "Add Gallery Image" : "Edit Gallery Item"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase text-slate-500">Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className={inp} placeholder="e.g. BSC Installation Hyderabad" autoFocus /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase text-slate-500">Category (optional)</label>
              <input value={cat} onChange={e => setCat(e.target.value)} className={inp} placeholder="e.g. Installations, Manufacturing" /></div>
            <ImageUploadField label="Image *" value={imgUrl} onChange={setImgUrl} showToast={showToast} dimensions="1200×800px recommended" />
            <div className="flex gap-3 pt-1">
              <button onClick={() => setModal(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={save} disabled={saving || !imgUrl} className="flex-1 rounded-xl bg-sky-700 hover:bg-sky-800 py-2.5 text-sm font-bold text-white disabled:opacity-60 transition">
                {saving ? "Saving…" : modal === "create" ? "Add" : "Update"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── BANNERS ───────────────────────────────────────────────────────────────────
export function BannersPage({ showToast }: { showToast: (m: string, t?: any) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | "create" | any>(null);
  const [form, setForm] = useState({ title: "", subtitle: "", linkUrl: "", sortOrder: 0, desktopImageUrl: "", mobileImageUrl: "" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    apiFetch("/content/banners?limit=50")
      .then(j => {
        // Sort items by sortOrder ascending before saving to state
        const sorted = (j.data?.items || []).sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));
        setItems(sorted);
      })
      .catch(e => showToast(e.message, "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    // Find next sort order: max current sortOrder + 1
    const nextOrder = items.length > 0 ? Math.max(...items.map(x => x.sortOrder || 0)) + 1 : 0;
    setForm({ title: "", subtitle: "", linkUrl: "", sortOrder: nextOrder, desktopImageUrl: "", mobileImageUrl: "" });
    setModal("create");
  };

  const openEdit = (item: any) => {
    setForm({ title: item.title || "", subtitle: item.subtitle || "", linkUrl: item.linkUrl || "", sortOrder: item.sortOrder || 0, desktopImageUrl: item.desktopImageUrl || "", mobileImageUrl: item.mobileImageUrl || "" });
    setModal(item);
  };

  const save = async () => {
    const mainImg = form.desktopImageUrl || form.mobileImageUrl;
    if (!mainImg) { showToast("At least one image is required", "error"); return; }

    const payload = {
      ...form,
      title: form.title.trim(),
      desktopImageUrl: form.desktopImageUrl || form.mobileImageUrl,
      mobileImageUrl: form.mobileImageUrl || form.desktopImageUrl,
    };

    setSaving(true);
    try {
      if (modal === "create") {
        await apiFetch("/content/banners", { method: "POST", body: JSON.stringify(payload) });
        showToast("Banner created");
      } else {
        await apiFetch(`/content/banners/${modal.id}`, { method: "PUT", body: JSON.stringify(payload) });
        showToast("Banner updated");
      }
      setModal(null); load();
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete banner?")) return;
    try { await apiFetch(`/content/banners/${id}`, { method: "DELETE" }); showToast("Deleted"); load(); }
    catch (e: any) { showToast(e.message, "error"); }
  };

  const toggle = async (item: any) => {
    try {
      await apiFetch(`/content/banners/${item.id}`, { method: "PUT", body: JSON.stringify({ isActive: !item.isActive }) });
      showToast(item.isActive ? "Banner hidden" : "Banner published"); load();
    } catch (e: any) { showToast(e.message, "error"); }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Hero Banners" count={items.length} onRefresh={load} refreshing={loading}>
        <div className="text-[10px] text-slate-400 font-semibold hidden sm:block">Desktop: 1920×600px · Mobile: 600×800px</div>
        <button onClick={openCreate} className="inline-flex items-center gap-1.5 rounded-xl bg-sky-700 hover:bg-sky-800 px-4 py-2 text-xs font-bold text-white transition">
          <IconPlus size={14} /> Add Banner
        </button>
      </PageHeader>

      {loading ? <Skeleton /> : items.length === 0 ? <Empty icon={IconFlag} msg="No banners — add one to show on homepage hero" /> : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-left">Desktop Image Preview</th>
                  <th className="px-4 py-3 text-left">Mobile Image</th>
                  <th className="px-4 py-3 text-left">Title / Subtitle</th>
                  <th className="px-4 py-3 text-left">Redirect Path</th>
                  <th className="px-4 py-3 text-center">Sort Order</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item: any) => (
                  <tr key={item.id} className={`hover:bg-slate-50 transition ${!item.isActive ? "opacity-60 bg-slate-50/40" : ""}`}>
                    <td className="px-4 py-3.5">
                      {item.desktopImageUrl ? (
                        <div className="h-10 w-28 rounded-lg overflow-hidden border border-slate-150 bg-slate-100">
                          <img src={item.desktopImageUrl} alt="Desktop Preview" className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold italic">No Desktop Image</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {item.mobileImageUrl ? (
                        <div className="h-10 w-8 rounded-lg overflow-hidden border border-slate-150 bg-slate-100">
                          <img src={item.mobileImageUrl} alt="Mobile Preview" className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-bold">Uses Desktop</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 max-w-xs">
                      <div>
                        <p className="font-bold text-slate-900 truncate">{item.title || "Untitled"}</p>
                        {item.subtitle && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{item.subtitle}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {item.linkUrl ? (
                        <span className="font-mono text-[11px] text-sky-700 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded">
                          {item.linkUrl}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl">
                        {item.sortOrder}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge color={item.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-150 text-slate-500"}>
                        {item.isActive ? "Live" : "Hidden"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex justify-end gap-1 shrink-0">
                        <button onClick={() => toggle(item)} title={item.isActive ? "Hide Banner" : "Publish Banner"}
                          className={`h-8 w-8 flex items-center justify-center rounded-lg transition ${item.isActive ? "text-emerald-600 hover:bg-emerald-50" : "text-slate-400 hover:bg-slate-50"}`}>
                          {item.isActive ? <IconEye size={15} /> : <IconEyeOff size={15} />}
                        </button>
                        <button onClick={() => openEdit(item)} className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition"><IconEdit size={15} /></button>
                        <button onClick={() => del(item.id)} className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition"><IconTrash size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <Modal title={modal === "create" ? "Add Banner" : "Edit Banner"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            {([
              { label: "Title (Optional)", key: "title", ph: "Precision Cleanroom Systems" },
              { label: "Subtitle (Optional)", key: "subtitle", ph: "Supporting headline text..." },
              { label: "Link URL (Optional)", key: "linkUrl", ph: "/products" },
            ] as any[]).map(f => (
              <div key={f.key} className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-500">{f.label}</label>
                <input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className={inp} placeholder={f.ph} />
              </div>
            ))}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-500">Sort Order</label>
              <input type="number" value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) }))} className={inp} />
            </div>
            <div className="rounded-xl bg-sky-50 border border-sky-100 px-3 py-2 text-[10px] text-sky-700 font-semibold space-y-0.5">
              <p>🖥 Desktop image: <strong>1920 × 600 px</strong></p>
              <p>📱 Mobile image: <strong>600 × 800 px</strong> (optional — uses desktop if blank)</p>
            </div>
            <ImageUploadField label="Desktop Image (1920×600px) *" value={form.desktopImageUrl} onChange={url => setForm(p => ({ ...p, desktopImageUrl: url }))} showToast={showToast} dimensions="1920 × 600 px" />
            <ImageUploadField label="Mobile Image (600×800px) — optional" value={form.mobileImageUrl} onChange={url => setForm(p => ({ ...p, mobileImageUrl: url }))} showToast={showToast} dimensions="600 × 800 px" />
            <div className="flex flex-col gap-2 pt-1">
              {!form.desktopImageUrl && (
                <p className="text-[10px] text-rose-500 font-bold text-center bg-rose-50 border border-rose-200 rounded-lg py-1.5">
                  ⚠ Upload desktop image before saving
                </p>
              )}
              <div className="flex gap-3">
                <button onClick={() => setModal(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button onClick={save} disabled={saving || !form.desktopImageUrl} className="flex-1 rounded-xl bg-sky-700 hover:bg-sky-800 py-2.5 text-sm font-bold text-white disabled:opacity-60 transition">
                  {saving ? "Saving…" : modal === "create" ? "Create" : "Update"}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── ROLES ─────────────────────────────────────────────────────────────────────
export function RolesPage({ showToast, can }: { showToast: (m: string, t?: any) => void; can: (r: string, a: string) => boolean }) {
  const [roles, setRoles] = useState<any[]>([]);
  const [perms, setPerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [permIds, setPermIds] = useState<string[]>([]);
  const [savingPerms, setSavingPerms] = useState(false);
  const [modal, setModal] = useState<null | "create" | any>(null);
  const [form, setForm] = useState({ name: "", label: "", description: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [rr, pp] = await Promise.all([apiFetch("/system/roles"), apiFetch("/system/permissions")]);
      setRoles(rr.data || []);
      setPerms(pp.data || []);
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const selectRole = (role: any) => {
    setSelected(role);
    setPermIds((role.permissions || []).map((p: any) => p.permissionId || p.id));
  };

  const savePerms = async () => {
    if (!selected) return;
    setSavingPerms(true);
    try {
      await apiFetch("/system/roles/permissions", { method: "POST", body: JSON.stringify({ roleId: selected.id, permissionIds: permIds }) });
      showToast("Permissions saved");
      load();
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setSavingPerms(false); }
  };

  const openCreate = () => { setForm({ name: "", label: "", description: "" }); setModal("create"); };

  const saveRole = async () => {
    if (!form.name || !form.label) { showToast("Name and label required", "error"); return; }
    setSaving(true);
    try {
      if (modal === "create") {
        await apiFetch("/system/roles", { method: "POST", body: JSON.stringify(form) });
        showToast("Role created");
      } else {
        await apiFetch(`/system/roles/${modal.id}`, { method: "PUT", body: JSON.stringify(form) });
        showToast("Role updated");
      }
      setModal(null); load();
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const delRole = async (role: any) => {
    if (!confirm(`Delete role "${role.label}"?`)) return;
    try { await apiFetch(`/system/roles/${role.id}`, { method: "DELETE" }); showToast("Role deleted"); load(); setSelected(null); }
    catch (e: any) { showToast(e.message, "error"); }
  };

  // Group permissions by resource
  const grouped: Record<string, any[]> = {};
  perms.forEach((p: any) => { if (!grouped[p.resource]) grouped[p.resource] = []; grouped[p.resource].push(p); });

  return (
    <div className="space-y-5">
      <PageHeader title="Roles & Permissions" count={roles.length} onRefresh={load} refreshing={loading}>
        {can("role", "create") && (
          <button onClick={openCreate} className="inline-flex items-center gap-1.5 rounded-xl bg-sky-700 hover:bg-sky-800 px-4 py-2 text-xs font-bold text-white transition">
            <IconPlus size={14} /> Add Role
          </button>
        )}
      </PageHeader>

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        {/* Role list */}
        <div className="space-y-2">
          {loading ? <Skeleton /> : roles.map((role: any) => (
            <div key={role.id}
              onClick={() => selectRole(role)}
              className={`rounded-xl border p-4 cursor-pointer transition ${selected?.id === role.id ? "border-sky-500 bg-sky-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-slate-900">{role.label}</p>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">{role.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{role.description || "No description"}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{(role.permissions || []).length} permissions assigned</p>
                </div>
                <div className="flex gap-1">
                  {can("role", "update") && role.name !== "SUPER_ADMIN" && (
                    <button onClick={e => { e.stopPropagation(); setForm({ name: role.name, label: role.label, description: role.description || "" }); setModal(role); }}
                      className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition"><IconEdit size={12} /></button>
                  )}
                  {can("role", "delete") && role.name !== "SUPER_ADMIN" && (
                    <button onClick={e => { e.stopPropagation(); delRole(role); }}
                      className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition"><IconTrash size={12} /></button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Permissions matrix */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-300">
              <IconKey size={32} strokeWidth={1.25} />
              <p className="text-sm text-slate-400 mt-3">Select a role to manage its permissions</p>
            </div>
          ) : selected.name === "SUPER_ADMIN" ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <IconShieldHalf size={32} className="text-sky-500" />
              <p className="text-sm font-bold text-slate-700">SUPER_ADMIN has all permissions</p>
              <p className="text-xs text-slate-400">Cannot be restricted</p>
            </div>
          ) : (
            <div className="p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-extrabold text-slate-900">{selected.label}</p>
                  <p className="text-xs text-slate-400">{permIds.length} of {perms.length} permissions selected</p>
                </div>
                {can("role", "update") && (
                  <button onClick={savePerms} disabled={savingPerms}
                    className="rounded-xl bg-sky-700 hover:bg-sky-800 px-4 py-2 text-xs font-bold text-white transition disabled:opacity-60">
                    {savingPerms ? "Saving…" : "Save Permissions"}
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {Object.entries(grouped).map(([resource, pList]) => (
                  <div key={resource}>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">{resource}</p>
                    <div className="flex flex-wrap gap-2">
                      {pList.map((p: any) => {
                        const on = permIds.includes(p.id);
                        return (
                          <button key={p.id} type="button"
                            onClick={() => setPermIds(prev => on ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${on ? "bg-sky-700 text-white border-sky-700" : "border-slate-200 text-slate-600 hover:border-sky-300"}`}>
                            {on && <IconCheck size={11} />}
                            {p.action}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <Modal title={modal === "create" ? "Create Role" : "Edit Role"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase text-slate-500">Role Key * (UPPERCASE)</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value.toUpperCase() }))} className={`${inp} font-mono`} placeholder="MANAGER" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase text-slate-500">Display Label *</label>
              <input value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} className={inp} placeholder="Manager" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase text-slate-500">Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className={`${inp} resize-none`} /></div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setModal(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={saveRole} disabled={saving} className="flex-1 rounded-xl bg-sky-700 hover:bg-sky-800 py-2.5 text-sm font-bold text-white disabled:opacity-60 transition">
                {saving ? "Saving…" : modal === "create" ? "Create Role" : "Update Role"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── USERS ─────────────────────────────────────────────────────────────────────
export function UsersPage({ showToast, can, session }: { showToast: (m: string, t?: any) => void; can: (r: string, a: string) => boolean; session: any }) {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | "create" | any>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", roleId: "" });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [exportOpen, setExportOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [uu, rr] = await Promise.all([apiFetch("/system/users"), apiFetch("/system/roles")]);
      setUsers(uu.data || []);
      setRoles(rr.data || []);
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ name: "", email: "", phone: "", password: "", roleId: roles[0]?.id || "" });
    setModal("create");
  };
  const openEdit = (u: any) => {
    setForm({ name: u.name, email: u.email, phone: u.phone || "", password: "", roleId: u.roleId });
    setModal(u);
  };

  const save = async () => {
    if (!form.name || !form.email || !form.roleId) { showToast("Name, email and role required", "error"); return; }
    if (modal === "create" && !form.password) { showToast("Password required for new user", "error"); return; }
    setSaving(true);
    const payload: any = { name: form.name, email: form.email, phone: form.phone || null, roleId: form.roleId };
    if (form.password) payload.password = form.password;
    try {
      if (modal === "create") {
        await apiFetch("/system/users", { method: "POST", body: JSON.stringify(payload) });
        showToast("User created");
      } else {
        await apiFetch(`/system/users/${modal.id}`, { method: "PUT", body: JSON.stringify(payload) });
        showToast("User updated");
      }
      setModal(null); load();
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const archive = async (u: any) => {
    if (!confirm(`Archive user "${u.name}"?`)) return;
    try { await apiFetch(`/system/users/${u.id}`, { method: "DELETE" }); showToast("User archived"); load(); }
    catch (e: any) { showToast(e.message, "error"); }
  };


  const userRole = (u: any) => roles.find((r: any) => r.id === u.roleId);
  const filtered = users.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <PageHeader title="Admin Users" count={users.length} onRefresh={load} refreshing={loading}>
        <div className="relative">
          <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…"
            className="pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 bg-white outline-none focus:border-sky-500 w-44 transition" />
        </div>
        <button onClick={() => setExportOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition">
          <IconTableExport size={14} /> Export
        </button>
        {can("user", "create") && (
          <button onClick={openCreate} className="inline-flex items-center gap-1.5 rounded-xl bg-sky-700 hover:bg-sky-800 px-4 py-2 text-xs font-bold text-white transition">
            <IconPlus size={14} /> Add User
          </button>
        )}
      </PageHeader>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">Phone</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left hidden sm:table-cell">Accessible Pages</th>
              <th className="px-4 py-3 text-left">Status</th>
              {can("user", "update") && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan={6} className="p-6"><Skeleton /></td></tr>
              : filtered.length === 0 ? <tr><td colSpan={6}><Empty icon={IconUser} msg="No users found" /></td></tr>
                : filtered.map((u: any) => {
                  const role = userRole(u);
                  const isMe = u.id === session?.id;
                  const isSuperAdmin = u.role?.name === "SUPER_ADMIN" || role?.name === "SUPER_ADMIN";
                  // Pages this user can access based on their role permissions
                  const accessiblePages = isSuperAdmin ? ["All pages"] : [
                    ...new Set((role?.permissions || []).map((p: any) => {
                      const r = p.permission?.resource || "";
                      const map: Record<string, string> = {
                        product: "Products", category: "Categories", order: "Orders",
                        lead: "Leads", customer: "Customers", coupon: "Coupons",
                        gallery: "Gallery", testimonial: "Testimonials", industry: "Industries",
                        user: "Users", role: "Roles", setting: "Settings",
                      };
                      return map[r] || r;
                    }))
                  ].filter(Boolean) as string[];

                  return (
                    <tr key={u.id} className={`hover:bg-slate-50 transition ${isMe ? "bg-sky-50/30" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 text-xs font-extrabold shrink-0">
                            {u.name?.[0] || "?"}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{u.name}{isMe && <span className="ml-1 text-[9px] text-sky-600 font-bold">(you)</span>}</p>
                            <p className="text-[10px] text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">{u.phone || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge color={isSuperAdmin ? "bg-violet-100 text-violet-800" : "bg-sky-100 text-sky-800"}>
                          {role?.label || u.role?.label || "—"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {isSuperAdmin ? (
                            <Badge color="bg-violet-100 text-violet-700">All pages</Badge>
                          ) : accessiblePages.slice(0, 5).map((p: string) => (
                            <Badge key={p} color="bg-slate-100 text-slate-600">{p}</Badge>
                          ))}
                          {!isSuperAdmin && accessiblePages.length > 5 && (
                            <Badge color="bg-slate-100 text-slate-400">+{accessiblePages.length - 5} more</Badge>
                          )}
                          {!isSuperAdmin && accessiblePages.length === 0 && (
                            <Badge color="bg-rose-50 text-rose-600">No permissions</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={u.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}>
                          {u.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      {can("user", "update") && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(u)} className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition">
                              <IconEdit size={13} />
                            </button>
                            {can("user", "delete") && !isMe && (
                              <button 
                                onClick={() => archive(u)} 
                                title="Archive User"
                                className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition"
                              >
                                <IconTrash size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={modal === "create" ? "Add Admin User" : "Edit User"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            {([
              { label: "Full Name *", key: "name", type: "text", ph: "Admin Name" },
              { label: "Email *", key: "email", type: "email", ph: "admin@company.com" },
              { label: "Phone", key: "phone", type: "tel", ph: "+91 92117 81378" },
              { label: modal === "create" ? "Password *" : "New Password (leave blank to keep)", key: "password", type: "password", ph: "••••••••" },
            ] as any[]).map(f => (
              <div key={f.key} className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-500">{f.label}</label>
                <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className={inp} placeholder={f.ph} />
              </div>
            ))}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-500">Role *</label>
              <select value={form.roleId} onChange={e => setForm(p => ({ ...p, roleId: e.target.value }))}
                className={`${inp} bg-white`}>
                <option value="">— Select role —</option>
                {roles.filter((r: any) => r.name !== "SUPER_ADMIN").map((r: any) => (
                  <option key={r.id} value={r.id}>{r.label} ({r.name})</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setModal(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 rounded-xl bg-sky-700 hover:bg-sky-800 py-2.5 text-sm font-bold text-white disabled:opacity-60 transition">
                {saving ? "Saving…" : modal === "create" ? "Create User" : "Update User"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Export Users"
        columns={USERS_EXPORT_COLUMNS}
        data={users}
      />
    </div>
  );
}

// ── PERMISSIONS PAGE ──────────────────────────────────────────────────────────
export function PermissionsPage({ can: _can }: { can: (r: string, a: string) => boolean }) {
  const [perms, setPerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const pp = await apiFetch("/system/permissions");
      setPerms(pp.data || []);
    } catch { /* handled gracefully */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const grouped: Record<string, any[]> = {};
  perms
    .filter(p => !search || p.resource.includes(search.toLowerCase()) || p.action.includes(search.toLowerCase()))
    .forEach((p: any) => { if (!grouped[p.resource]) grouped[p.resource] = []; grouped[p.resource].push(p); });

  return (
    <div className="space-y-5">
      <PageHeader title="System Permissions" count={perms.length} onRefresh={load} refreshing={loading} />

      <div className="relative max-w-xs">
        <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Filter by resource or action…"
          className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-xs outline-none focus:border-sky-500 transition" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
          <IconLock size={14} className="text-slate-400" />
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Permission Matrix</span>
        </div>
        {loading ? (
          <div className="p-5"><Skeleton /></div>
        ) : Object.keys(grouped).length === 0 ? (
          <Empty icon={IconKey} msg="No permissions found" />
        ) : (
          <div className="divide-y divide-slate-100">
            {Object.entries(grouped).map(([resource, pList]) => (
              <div key={resource} className="flex flex-wrap items-center gap-2 px-5 py-3.5">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 min-w-[140px]">{resource}</span>
                <div className="flex flex-wrap gap-1.5">
                  {pList.map((p: any) => (
                    <span key={p.id} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-700">
                      <IconCheck size={9} className="text-emerald-500" />
                      {p.action}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800">
        <strong>Note:</strong> Permissions are seeded during server setup. Assign permissions to roles via the <strong>Roles</strong> page.
      </div>
    </div>
  );
}

// ── ACTIVITY LOG PAGE ─────────────────────────────────────────────────────────
const TYPE_COLORS: Record<string, string> = {
  CREATE: "bg-emerald-100 text-emerald-700",
  UPDATE: "bg-sky-100 text-sky-700",
  DELETE: "bg-rose-100 text-rose-700",
  LOGIN: "bg-violet-100 text-violet-700",
  LOGOUT: "bg-slate-100 text-slate-600",
  SYSTEM: "bg-amber-100 text-amber-700",
};

export function ActivityLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [exportOpen, setExportOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/system/activity-logs");
      setLogs(res.data || []);
    } catch { /* handled gracefully */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = logs.filter(l => {
    const matchSearch = !search || l.title?.toLowerCase().includes(search.toLowerCase()) || l.actor?.name?.toLowerCase().includes(search.toLowerCase()) || l.entityType?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "ALL" || l.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-5">
      <PageHeader title="Activity Log" count={logs.length} onRefresh={load} refreshing={loading}>
        <button onClick={() => setExportOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition">
          <IconTableExport size={14} /> Export
        </button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search logs…"
            className="rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-xs outline-none focus:border-sky-500 transition w-56" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {["ALL", "CREATE", "UPDATE", "DELETE", "LOGIN", "SYSTEM"].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase transition border ${typeFilter === t ? "bg-sky-700 text-white border-sky-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 font-extrabold uppercase tracking-wider text-slate-500 w-28">Type</th>
                <th className="text-left px-4 py-3 font-extrabold uppercase tracking-wider text-slate-500">Action</th>
                <th className="text-left px-4 py-3 font-extrabold uppercase tracking-wider text-slate-500 hidden sm:table-cell w-28">Entity</th>
                <th className="text-left px-4 py-3 font-extrabold uppercase tracking-wider text-slate-500 hidden md:table-cell w-36">Actor</th>
                <th className="text-left px-4 py-3 font-extrabold uppercase tracking-wider text-slate-500 w-36">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">No activity logs found</td></tr>
              ) : filtered.map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${TYPE_COLORS[log.type] || "bg-slate-100 text-slate-600"}`}>
                      {log.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800 max-w-[260px] truncate">{log.title}</td>
                  <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">
                    {log.entityType && <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">{log.entityType}</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                    {log.actor ? <span className="font-semibold">{log.actor.name}</span> : <span className="text-slate-400">System</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Export Activity Logs"
        columns={ACTIVITY_EXPORT_COLUMNS}
        data={logs}
      />
    </div>
  );
}

// ── CAREERS (ADMIN) ──────────────────────────────────────────────────────────
const JOB_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full Time", PART_TIME: "Part Time", CONTRACT: "Contract",
  INTERNSHIP: "Internship", REMOTE: "Remote",
};
const JOB_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-amber-100 text-amber-700",
  CLOSED: "bg-slate-100 text-slate-500",
};
const APP_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  REVIEWING: "bg-blue-100 text-blue-700",
  SHORTLISTED: "bg-purple-100 text-purple-700",
  REJECTED: "bg-red-100 text-red-600",
  HIRED: "bg-emerald-100 text-emerald-700",
};

const emptyJob = {
  title: "", description: "", requirements: "", location: "", type: "FULL_TIME",
  salaryMin: "", salaryMax: "", qualification: "", experience: "", department: "", status: "ACTIVE",
};

export function CareersPage({ showToast }: { showToast: (m: string, t?: any) => void }) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState<null | "create" | any>(null);
  const [form, setForm] = useState<any>(emptyJob);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [appsJob, setAppsJob] = useState<any>(null);
  const [apps, setApps] = useState<any[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const load = (quiet = false) => {
    if (!quiet) setLoading(true); else setRefreshing(true);
    apiFetch("/careers/admin/jobs")
      .then(j => setJobs(j.data || []))
      .catch(e => showToast(e.message, "error"))
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm({ ...emptyJob }); setModal("create"); };
  const openEdit = (job: any) => {
    setForm({
      title: job.title, description: job.description, requirements: job.requirements || "",
      location: job.location, type: job.type, salaryMin: job.salaryMin > 0 ? job.salaryMin : "",
      salaryMax: job.salaryMax > 0 ? job.salaryMax : "", qualification: job.qualification || "",
      experience: job.experience || "", department: job.department || "", status: job.status,
    });
    setModal(job);
  };

  const save = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.location.trim()) {
      showToast("Title, description and location are required", "error"); return;
    }
    setSaving(true);
    try {
      const body = {
        ...form,
        salaryMin: form.salaryMin !== "" ? Number(form.salaryMin) : null,
        salaryMax: form.salaryMax !== "" ? Number(form.salaryMax) : null,
      };
      if (modal === "create") {
        await apiFetch("/careers/admin/jobs", { method: "POST", body: JSON.stringify(body) });
        showToast("Job created");
      } else {
        await apiFetch(`/careers/admin/jobs/${modal.id}`, { method: "PUT", body: JSON.stringify(body) });
        showToast("Job updated");
      }
      setModal(null); load(true);
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const toggleStatus = async (job: any) => {
    const newStatus = job.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await apiFetch(`/careers/admin/jobs/${job.id}`, { method: "PUT", body: JSON.stringify({ status: newStatus }) });
      showToast(`Job ${newStatus === "ACTIVE" ? "activated" : "deactivated"}`);
      load(true);
    } catch (e: any) { showToast(e.message, "error"); }
  };

  const closeJob = async (job: any) => {
    if (!confirm(`Close "${job.title}"? This will remove it from public listings.`)) return;
    try {
      await apiFetch(`/careers/admin/jobs/${job.id}`, { method: "DELETE" });
      showToast("Job closed"); load(true);
    } catch (e: any) { showToast(e.message, "error"); }
  };

  const viewApps = async (job: any) => {
    setAppsJob(job); setApps([]); setAppsLoading(true);
    try {
      const j = await apiFetch(`/careers/admin/applications/${job.id}`);
      setApps(j.data || []);
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setAppsLoading(false); }
  };

  const updateAppStatus = async (appId: string, status: string) => {
    try {
      await apiFetch(`/careers/admin/applications/${appId}`, { method: "PUT", body: JSON.stringify({ status }) });
      setApps(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
      showToast("Status updated");
    } catch (e: any) { showToast(e.message, "error"); }
  };

  const filtered = jobs.filter(j => {
    const matchSearch = !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.location.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || j.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((p: any) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <PageHeader title="Jobs & Careers" count={jobs.length} onRefresh={() => load(true)} refreshing={refreshing}>
        <button onClick={() => setExportOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition">
          <IconTableExport size={14} /> Export
        </button>
        <button onClick={openCreate}
          className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 transition">
          <IconPlus size={14} /> Post Job
        </button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs…"
            className="w-full pl-8 pr-3 h-9 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-sky-500 focus:bg-white transition" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-sky-500 focus:bg-white transition">
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {loading ? <Skeleton /> : filtered.length === 0 ? (
        <Empty icon={IconBriefcase} msg="No jobs posted yet" />
      ) : (
        <div className="space-y-3">
          {filtered.map(job => (
            <div key={job.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-extrabold text-slate-900 truncate">{job.title}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${JOB_STATUS_COLORS[job.status]}`}>
                      {job.status}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-sky-100 text-sky-700">
                      {JOB_TYPE_LABELS[job.type] || job.type}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><IconMapPin size={11} />{job.location}</span>
                    {job.department && <span className="flex items-center gap-1"><IconBriefcase size={11} />{job.department}</span>}
                    {job.experience && <span className="flex items-center gap-1"><IconClock size={11} />{job.experience}</span>}
                    <span className="flex items-center gap-1 font-semibold text-slate-600">
                      <IconUsers size={11} />{job._count?.applications || 0} applicants
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => viewApps(job)} title="View Applications"
                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition">
                    <IconUsers size={14} />
                  </button>
                  <button onClick={() => openEdit(job)} title="Edit"
                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition">
                    <IconEdit size={14} />
                  </button>
                  <button onClick={() => toggleStatus(job)} title={job.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    className={`h-8 w-8 flex items-center justify-center rounded-lg border transition ${job.status === "ACTIVE" ? "border-amber-200 hover:bg-amber-50 text-amber-600" : "border-emerald-200 hover:bg-emerald-50 text-emerald-600"}`}>
                    {job.status === "ACTIVE" ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                  </button>
                  <button onClick={() => closeJob(job)} title="Close Job"
                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-red-200 hover:bg-red-50 text-red-500 transition">
                    <IconTrash size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <Modal title={modal === "create" ? "Post New Job" : "Edit Job"} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Job Title *</label>
              <input value={form.title} onChange={f("title")} placeholder="e.g. Senior Safety Officer" className={inp} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Location *</label>
                <input value={form.location} onChange={f("location")} placeholder="e.g. Indore, MP" className={inp} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
                <input value={form.department} onChange={f("department")} placeholder="e.g. Operations" className={inp} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Job Type</label>
                <select value={form.type} onChange={f("type")} className={inp}>
                  {Object.entries(JOB_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                <select value={form.status} onChange={f("status")} className={inp}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Min Salary (₹/yr)</label>
                <input value={form.salaryMin} onChange={f("salaryMin")} type="number" placeholder="e.g. 300000" className={inp} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Max Salary (₹/yr)</label>
                <input value={form.salaryMax} onChange={f("salaryMax")} type="number" placeholder="e.g. 600000" className={inp} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Experience</label>
                <input value={form.experience} onChange={f("experience")} placeholder="e.g. 2-4 years" className={inp} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Qualification</label>
                <input value={form.qualification} onChange={f("qualification")} placeholder="e.g. B.Tech / Diploma" className={inp} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Description *</label>
              <textarea value={form.description} onChange={f("description")} rows={4}
                placeholder="Describe the role, responsibilities and expectations…" className={inp} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Requirements</label>
              <textarea value={form.requirements} onChange={f("requirements")} rows={3}
                placeholder="Skills, certifications, or conditions required…" className={inp} />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setModal(null)} className="flex-1 h-10 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition">
                Cancel
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 h-10 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-50 transition">
                {saving ? "Saving…" : modal === "create" ? "Post Job" : "Save Changes"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {appsJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4"
          onClick={e => e.target === e.currentTarget && setAppsJob(null)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="font-extrabold text-slate-900">Applications</h3>
                <p className="text-xs text-slate-400">{appsJob.title}</p>
              </div>
              <button onClick={() => setAppsJob(null)}><IconX size={18} className="text-slate-400" /></button>
            </div>
            <div className="overflow-y-auto p-5">
              {appsLoading ? (
                <div className="space-y-3 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-slate-100" />)}</div>
              ) : apps.length === 0 ? (
                <p className="text-center py-12 text-slate-400 text-sm">No applications yet</p>
              ) : (
                <div className="space-y-3">
                  {apps.map(app => (
                    <div key={app.id} className="rounded-xl border border-slate-200 p-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-slate-800">{app.name}</p>
                          <p className="text-xs text-slate-500">{app.email} · {app.phone}</p>
                          <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-sky-600 font-semibold hover:underline mt-1 inline-block">
                            View Resume ↗
                          </a>
                          {app.coverLetter && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{app.coverLetter}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${APP_STATUS_COLORS[app.status]}`}>
                            {app.status}
                          </span>
                          <select value={app.status} onChange={e => updateAppStatus(app.id, e.target.value)}
                            className="text-xs rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 outline-none">
                            {Object.keys(APP_STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Export Jobs"
        columns={CAREERS_EXPORT_COLUMNS}
        data={jobs}
      />
    </div>
  );
}

// ── MANUFACTURING / LEAD PIPELINE ───────────────────────────────────────────

const MFG_STATUSES = [
  { key: "NEW",           label: "New",            color: "bg-sky-100 text-sky-800",       icon: IconAlertCircle },
  { key: "CONTACTED",     label: "Contacted",      color: "bg-blue-100 text-blue-800",     icon: IconPhone },
  { key: "QUALIFIED",     label: "Qualified",      color: "bg-violet-100 text-violet-800", icon: IconTarget },
  { key: "QUOTED",        label: "Quoted",         color: "bg-amber-100 text-amber-800",   icon: IconNotes },
  { key: "APPROVED",      label: "Approved",       color: "bg-teal-100 text-teal-800",     icon: IconCircleCheck },
  { key: "DESIGNING",     label: "Designing",      color: "bg-purple-100 text-purple-800", icon: IconTool },
  { key: "CUTTING",       label: "Cutting",        color: "bg-orange-100 text-orange-800", icon: IconTool },
  { key: "FABRICATION",   label: "Fabrication",    color: "bg-yellow-100 text-yellow-800", icon: IconBuildingFactory },
  { key: "PACKAGING",     label: "Packaging",      color: "bg-lime-100 text-lime-800",     icon: IconBox },
  { key: "READY_TO_SHIP", label: "Ready to Ship",  color: "bg-emerald-100 text-emerald-800", icon: IconPackage },
  { key: "DISPATCHED",    label: "Dispatched",     color: "bg-cyan-100 text-cyan-800",     icon: IconTruck },
  { key: "DELIVERED",     label: "Delivered",      color: "bg-green-100 text-green-800",   icon: IconCircleCheck },
  { key: "WON",           label: "Won",            color: "bg-green-200 text-green-900",   icon: IconCircleCheck },
  { key: "LOST",          label: "Lost",           color: "bg-rose-100 text-rose-800",     icon: IconAlertCircle },
  { key: "CLOSED",        label: "Closed",         color: "bg-slate-100 text-slate-600",   icon: IconCircleCheck },
];

const MFG_PIPELINE_STAGES = [
  { keys: ["NEW", "CONTACTED", "QUALIFIED", "QUOTED", "APPROVED"], label: "Pre-Production" },
  { keys: ["DESIGNING", "CUTTING", "FABRICATION", "PACKAGING"], label: "Manufacturing" },
  { keys: ["READY_TO_SHIP", "DISPATCHED", "DELIVERED"], label: "Dispatch" },
  { keys: ["WON", "LOST", "CLOSED"], label: "Closed" },
];

const MFG_EXPORT_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "company", label: "Company" },
  { key: "source", label: "Source" },
  { key: "status", label: "Status" },
  { key: "product.name", label: "Product" },
  { key: "variant.name", label: "Variant" },
  { key: "adminNotes", label: "Admin Notes" },
  { key: "message", label: "Message" },
  { key: "createdAt", label: "Created" },
];

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source?: string;
  productType?: string;
  status: string;
  message?: string;
  adminNotes?: string;
  customProduct?: string;
  createdAt: string;
  product?: {
    id: string; name: string; slug?: string;
    images?: { url: string; isPrimary?: boolean }[];
    variants?: { id: string; name: string; isDefault?: boolean; images?: { url: string }[]; imageUrl?: string }[];
  };
  variant?: { id: string; name: string };
  customer?: { id: string; name: string };
}

interface ProductOption {
  id: string;
  name: string;
  slug?: string;
  images?: { url: string; isPrimary?: boolean }[];
  variants?: { id: string; name: string; isDefault?: boolean; images?: { url: string }[]; imageUrl?: string }[];
}

const SOURCE_COLORS: Record<string, string> = {
  "Meta": "bg-purple-100 text-purple-800",
  "Facebook": "bg-purple-100 text-purple-800",
  "Instagram": "bg-pink-100 text-pink-800",
  "Website": "bg-blue-100 text-blue-800",
  "Website Product Inquiry": "bg-blue-100 text-blue-800",
  "Referral": "bg-green-100 text-green-800",
  "Call": "bg-orange-100 text-orange-800",
  "Walk-in": "bg-teal-100 text-teal-800",
  "WhatsApp": "bg-emerald-100 text-emerald-800",
  "Email": "bg-sky-100 text-sky-800",
  "Exhibition": "bg-yellow-100 text-yellow-800",
};

function sourceColor(src?: string) {
  if (!src) return "bg-slate-100 text-slate-600";
  return SOURCE_COLORS[src] || "bg-slate-100 text-slate-600";
}

function statusMeta(key: string) {
  return MFG_STATUSES.find(s => s.key === key) || MFG_STATUSES[0];
}

function leadImg(lead: Lead): string | null {
  const p = lead.product;
  if (!p) return null;
  // primary image first
  const primary = p.images?.find(i => i.isPrimary)?.url || p.images?.[0]?.url;
  if (primary) return primary;
  // fall back to default variant image
  const defVar = p.variants?.find(v => v.isDefault) || p.variants?.[0];
  return defVar?.images?.[0]?.url || defVar?.imageUrl || null;
}

function productOptionImg(p: ProductOption): string | null {
  const primary = p.images?.find(i => i.isPrimary)?.url || p.images?.[0]?.url;
  if (primary) return primary;
  const defVar = p.variants?.find(v => v.isDefault) || p.variants?.[0];
  return defVar?.images?.[0]?.url || defVar?.imageUrl || null;
}

const EMPTY_FORM = {
  name: "", email: "", phone: "", company: "", source: "",
  productType: "B2B", status: "NEW", message: "", adminNotes: "",
  productId: "", customProduct: "", variantId: "",
};

export function ManufacturingLeadsPage({ showToast }: { showToast: (m: string, t?: "success" | "error" | "info") => void }) {
  const [items, setItems] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [filterSource, setFilterSource] = useState("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState<{ id: string; notes: string } | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [view, setView] = useState<"list" | "kanban">("list");

  // Add / Edit lead modal
  const [addOpen, setAddOpen] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  // Product search for modal
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [prodSearch, setProdSearch] = useState("");

  const load = () => {
    setLoading(true);
    apiFetch("/leads?limit=500")
      .then((j: { data?: { items?: Lead[] } }) => { setItems(j.data?.items || []); })
      .catch((e: { message: string }) => showToast(e.message, "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    apiFetch("/leads?limit=500")
      .then((j: { data?: { items?: Lead[] } }) => { setItems(j.data?.items || []); })
      .catch((e: { message: string }) => showToast(e.message, "error"))
      .finally(() => setLoading(false));
    // load products for modal
    apiFetch("/products?limit=200")
      .then((j: { data?: { items?: ProductOption[] } }) => setProducts(j.data?.items || []))
      .catch(() => {/* non-critical */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAdd = () => {
    setForm({ ...EMPTY_FORM });
    setProdSearch("");
    setEditLead(null);
    setAddOpen(true);
  };

  const openEdit = (lead: Lead) => {
    setForm({
      name: lead.name || "",
      email: lead.email || "",
      phone: lead.phone || "",
      company: lead.company || "",
      source: lead.source || "",
      productType: lead.productType || (lead.company ? "B2B" : "B2C"),
      status: lead.status,
      message: lead.message || "",
      adminNotes: lead.adminNotes || "",
      productId: lead.product?.id || "",
      customProduct: lead.customProduct || "",
      variantId: lead.variant?.id || "",
    });
    setProdSearch(lead.product?.name || "");
    setEditLead(lead);
    setAddOpen(true);
  };

  const saveLead = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      showToast("Name and email required", "error"); return;
    }
    setSaving(true);
    try {
      const body: Record<string, string> = {
        name: form.name, email: form.email, phone: form.phone,
        company: form.company, source: form.source, productType: form.productType,
        status: form.status, message: form.message, adminNotes: form.adminNotes,
      };
      if (form.productId) body.productId = form.productId;
      if (form.variantId) body.variantId = form.variantId;
      if (!form.productId && form.customProduct) body.customProduct = form.customProduct;

      if (editLead) {
        const res = await apiFetch(`/leads/${editLead.id}`, { method: "PUT", body: JSON.stringify(body) });
        const updated: Lead = res.data || { ...editLead, ...body };
        setItems(prev => prev.map(l => l.id === editLead.id ? updated : l));
        showToast("Lead updated");
      } else {
        const res = await apiFetch("/leads", { method: "POST", body: JSON.stringify(body) });
        const created: Lead = res.data;
        setItems(prev => [created, ...prev]);
        showToast("Lead added");
      }
      setAddOpen(false);
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await apiFetch(`/leads/${id}`, { method: "PUT", body: JSON.stringify({ status }) });
      setItems(prev => prev.map(l => l.id === id ? { ...l, status } : l));
      showToast("Status updated");
    } catch (e: any) { showToast(e.message, "error"); }
  };

  const saveNotes = async () => {
    if (!editNotes) return;
    try {
      await apiFetch(`/leads/${editNotes.id}`, { method: "PUT", body: JSON.stringify({ adminNotes: editNotes.notes }) });
      setItems(prev => prev.map(l => l.id === editNotes.id ? { ...l, adminNotes: editNotes.notes } : l));
      showToast("Notes saved");
      setEditNotes(null);
    } catch (e: any) { showToast(e.message, "error"); }
  };

  const deleteLead = async (id: string) => {
    if (!confirm("Delete this lead?")) return;
    try {
      await apiFetch(`/leads/${id}`, { method: "DELETE" });
      setItems(prev => prev.filter(l => l.id !== id));
      showToast("Deleted");
    } catch (e: any) { showToast(e.message, "error"); }
  };

  const filtered = items.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || l.name?.toLowerCase().includes(q)
      || l.email?.toLowerCase().includes(q)
      || l.company?.toLowerCase().includes(q)
      || l.product?.name?.toLowerCase().includes(q)
      || l.customProduct?.toLowerCase().includes(q)
      || l.phone?.includes(q);
    const matchStatus = filterStatus === "ALL" || l.status === filterStatus;
    const matchType = filterType === "ALL" || (l.productType || (l.company ? "B2B" : "B2C")) === filterType;
    const matchSource = filterSource === "ALL" || l.source === filterSource;
    return matchSearch && matchStatus && matchType && matchSource;
  });

  const counts: Record<string, number> = {};
  items.forEach(l => { counts[l.status] = (counts[l.status] || 0) + 1; });

  const allSources = [...new Set(items.map(l => l.source).filter(Boolean))] as string[];

  const filteredProducts = prodSearch
    ? products.filter(p => p.name.toLowerCase().includes(prodSearch.toLowerCase())).slice(0, 8)
    : products.slice(0, 8);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Lead Pipeline</h1>
          <p className="text-xs text-slate-500 mt-0.5">{items.length} total · {filtered.length} shown</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-white transition shadow-sm"
            style={{ backgroundColor: "#035f96" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#024769")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#035f96")}>
            <IconPlus size={14} /> Add Lead
          </button>
          <div className="flex rounded-xl border border-slate-200 overflow-hidden">
            <button onClick={() => setView("list")}
              className="px-3 py-1.5 text-xs font-bold transition"
              style={view === "list" ? { backgroundColor: "#035f96", color: "#fff" } : { backgroundColor: "#fff", color: "#64748b" }}>
              List
            </button>
            <button onClick={() => setView("kanban")}
              className="px-3 py-1.5 text-xs font-bold transition"
              style={view === "kanban" ? { backgroundColor: "#035f96", color: "#fff" } : { backgroundColor: "#fff", color: "#64748b" }}>
              Kanban
            </button>
          </div>
          <button onClick={() => setExportOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition">
            <IconTableExport size={14} /> Export
          </button>
          <button onClick={load}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 transition">
            <IconRefresh size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <a href="/activity-logs" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 transition"
            title="View activity log">
            <IconClock size={14} /> Activity
          </a>
        </div>
      </div>

      {/* Pipeline summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {MFG_PIPELINE_STAGES.map(stage => {
          const count = stage.keys.reduce((s, k) => s + (counts[k] || 0), 0);
          return (
            <div key={stage.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{stage.label}</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{count}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {stage.keys.map(k => counts[k] ? (
                  <button key={k} onClick={() => setFilterStatus(filterStatus === k ? "ALL" : k)}
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full transition hover:opacity-80 ${statusMeta(k).color} ${filterStatus === k ? "ring-2 ring-offset-1 ring-current" : ""}`}>
                    {statusMeta(k).label} {counts[k]}
                  </button>
                ) : null)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48">
          <IconSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, phone, company, product…"
            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-brand" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="text-xs rounded-xl border border-slate-200 bg-white px-2 py-2 outline-none focus:border-brand">
          <option value="ALL">All Statuses</option>
          {MFG_STATUSES.map(s => (
            <option key={s.key} value={s.key}>{s.label}{counts[s.key] ? ` (${counts[s.key]})` : ""}</option>
          ))}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="text-xs rounded-xl border border-slate-200 bg-white px-2 py-2 outline-none focus:border-brand">
          <option value="ALL">B2B + B2C</option>
          <option value="B2B">B2B</option>
          <option value="B2C">B2C</option>
        </select>
        {allSources.length > 0 && (
          <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 bg-white px-2 py-2 outline-none focus:border-brand">
            <option value="ALL">All Sources</option>
            {allSources.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        {(filterStatus !== "ALL" || filterType !== "ALL" || filterSource !== "ALL" || search) && (
          <button onClick={() => { setFilterStatus("ALL"); setFilterType("ALL"); setFilterSource("ALL"); setSearch(""); }}
            className="text-xs text-slate-400 hover:text-slate-700 underline transition">
            Clear
          </button>
        )}
      </div>

      {/* LIST VIEW */}
      {view === "list" && (
        <div className="space-y-2">
          {loading ? (
            <div className="space-y-2 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl bg-slate-100" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-slate-200">
              <IconBuildingStore size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-500">No leads match filters</p>
              <button onClick={openAdd} className="mt-3 text-xs text-brand hover:underline font-semibold">+ Add manually</button>
            </div>
          ) : filtered.map(lead => {
            const sm = statusMeta(lead.status);
            const isOpen = expanded === lead.id;
            const img = leadImg(lead);
            const lType = lead.productType || (lead.company ? "B2B" : "B2C");
            return (
              <div key={lead.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-start gap-3 p-4">
                  {/* Product image or initial */}
                  <div className="shrink-0 w-12 h-12 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center">
                    {img
                      ? <img src={img} alt="" className="w-full h-full object-cover" />
                      : <span className="text-lg font-extrabold text-slate-300">{lead.name?.[0]?.toUpperCase()}</span>
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="font-extrabold text-slate-900 text-sm">{lead.name}</span>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wide ${sm.color}`}>{sm.label}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${lType === "B2B" ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-700"}`}>{lType}</span>
                      {lead.source && (
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${sourceColor(lead.source)}`}>{lead.source}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-slate-500">
                      {lead.email && <span className="flex items-center gap-1"><IconMail size={10}/>{lead.email}</span>}
                      {lead.phone && <span className="flex items-center gap-1"><IconPhone size={10}/>{lead.phone}</span>}
                      {lead.company && <span className="flex items-center gap-1"><IconBuildingStore size={10}/>{lead.company}</span>}
                    </div>
                    {(lead.product || lead.customProduct) && (
                      <div className="mt-1 flex items-center gap-1.5">
                        <IconBox size={10} className="text-brand shrink-0"/>
                        <span className="text-[11px] font-semibold text-brand">
                          {lead.product ? lead.product.name : lead.customProduct}
                          {lead.variant ? ` · ${lead.variant.name}` : ""}
                          {!lead.product && lead.customProduct && <span className="ml-1 text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold uppercase">Custom</span>}
                        </span>
                      </div>
                    )}
                    {lead.adminNotes && (
                      <p className="mt-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5 line-clamp-2">
                        <IconNotes size={11} className="shrink-0 mt-0.5" />{lead.adminNotes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                    <select value={lead.status} onChange={e => updateStatus(lead.id, e.target.value)}
                      className="text-[11px] rounded-lg border border-slate-200 bg-white px-1.5 py-1 outline-none focus:border-brand max-w-36">
                      {MFG_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                    <button onClick={() => openEdit(lead)} title="Edit lead"
                      className="p-1.5 text-slate-400 hover:text-brand transition rounded-lg">
                      <IconEdit size={14}/>
                    </button>
                    <button onClick={() => setEditNotes({ id: lead.id, notes: lead.adminNotes || "" })}
                      title="Notes"
                      className={`p-1.5 rounded-lg transition ${lead.adminNotes ? "text-amber-500 hover:text-amber-700" : "text-slate-400 hover:text-slate-700"}`}>
                      <IconNotes size={14} />
                    </button>
                    <button onClick={() => setExpanded(isOpen ? null : lead.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 transition rounded-lg">
                      {isOpen ? <IconChevronDown size={14}/> : <IconChevronRight size={14}/>}
                    </button>
                    <button onClick={() => deleteLead(lead.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition rounded-lg">
                      <IconTrash size={14}/>
                    </button>
                  </div>
                </div>

                {/* Expanded panel */}
                {isOpen && (
                  <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-3 bg-slate-50/50">
                    {/* Pipeline progress stepper */}
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">Pipeline Progress — click to jump</p>
                      <div className="flex flex-wrap gap-1">
                        {MFG_STATUSES.filter(s => !["WON","LOST","CLOSED"].includes(s.key)).map((s, i, arr) => {
                          const idx = arr.findIndex(x => x.key === lead.status);
                          const done = i < idx;
                          const active = s.key === lead.status;
                          return (
                            <button key={s.key} onClick={() => updateStatus(lead.id, s.key)}
                              className={`text-[9px] font-bold px-2 py-1 rounded-full border transition ${
                                active ? `${s.color} border-current shadow-sm` :
                                done ? "bg-slate-100 text-slate-400 border-slate-200 line-through" :
                                "bg-white text-slate-400 border-slate-200 hover:border-brand hover:text-brand"
                              }`}>
                              {i + 1}. {s.label}
                            </button>
                          );
                        })}
                        <span className="text-slate-200 self-center">|</span>
                        {["WON","LOST","CLOSED"].map(k => (
                          <button key={k} onClick={() => updateStatus(lead.id, k)}
                            className={`text-[9px] font-bold px-2 py-1 rounded-full border transition ${
                              lead.status === k ? `${statusMeta(k).color} border-current shadow-sm` :
                              "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                            }`}>
                            {statusMeta(k).label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Message */}
                    {lead.message && (
                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Message / Requirements</p>
                        <p className="text-xs text-slate-700 bg-white border border-slate-200 rounded-xl p-3 leading-relaxed whitespace-pre-wrap">{lead.message}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-slate-400">Received: {new Date(lead.createdAt).toLocaleString("en-IN")}</p>
                      <a href={`/activity-logs`} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] text-sky-600 hover:underline flex items-center gap-1 font-semibold">
                        <IconClock size={10}/> View activity log ↗
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* KANBAN VIEW */}
      {view === "kanban" && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {MFG_STATUSES.map(s => {
              const cards = filtered.filter(l => l.status === s.key);
              return (
                <div key={s.key} className="w-60 shrink-0">
                  <div className={`flex items-center justify-between px-3 py-2 rounded-t-xl ${s.color}`}>
                    <span className="text-[10px] font-extrabold uppercase tracking-wide">{s.label}</span>
                    <span className="text-[10px] font-extrabold bg-white/60 rounded-full px-1.5 py-0.5">{cards.length}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 border-t-0 rounded-b-xl p-2 space-y-2 min-h-20 max-h-[65vh] overflow-y-auto">
                    {cards.length === 0 && (
                      <p className="text-center text-[10px] text-slate-300 py-4">Empty</p>
                    )}
                    {cards.map(lead => {
                      const img = leadImg(lead);
                      const lType = lead.productType || (lead.company ? "B2B" : "B2C");
                      return (
                        <div key={lead.id} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="shrink-0 w-9 h-9 rounded-lg overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center">
                              {img
                                ? <img src={img} alt="" className="w-full h-full object-cover"/>
                                : <span className="text-sm font-extrabold text-slate-300">{lead.name?.[0]?.toUpperCase()}</span>
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-900 leading-tight truncate">{lead.name}</p>
                              {lead.company && <p className="text-[10px] text-slate-500 truncate">{lead.company}</p>}
                              <div className="flex gap-1 mt-0.5">
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase ${lType === "B2B" ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-700"}`}>{lType}</span>
                                {lead.source && <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase ${sourceColor(lead.source)}`}>{lead.source}</span>}
                              </div>
                            </div>
                          </div>
                          {(lead.product || lead.customProduct) && (
                            <p className="text-[10px] font-semibold text-brand truncate flex items-center gap-1">
                              <IconBox size={9}/>{lead.product ? lead.product.name : lead.customProduct}
                            </p>
                          )}
                          <div className="flex items-center gap-1 pt-1 border-t border-slate-100">
                            <select value={lead.status} onChange={e => updateStatus(lead.id, e.target.value)}
                              className="text-[9px] rounded-lg border border-slate-200 bg-white px-1 py-0.5 outline-none focus:border-brand flex-1">
                              {MFG_STATUSES.map(st => <option key={st.key} value={st.key}>{st.label}</option>)}
                            </select>
                            <button onClick={() => openEdit(lead)} className="p-1 text-slate-400 hover:text-brand transition rounded">
                              <IconEdit size={10}/>
                            </button>
                            <button onClick={() => setEditNotes({ id: lead.id, notes: lead.adminNotes || "" })}
                              className={`p-1 rounded transition ${lead.adminNotes ? "text-amber-500" : "text-slate-300 hover:text-slate-500"}`}>
                              <IconNotes size={10}/>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ADD / EDIT LEAD MODAL */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/50 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={e => e.target === e.currentTarget && setAddOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <IconTarget size={16} className="text-brand"/>
                {editLead ? "Edit Lead" : "Add Lead Manually"}
              </h3>
              <button onClick={() => setAddOpen(false)} className="text-slate-400 hover:text-slate-700"><IconX size={18}/></button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Name + Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                    placeholder="Full name"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:bg-white transition"/>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Email *</label>
                  <input value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))}
                    type="email" placeholder="email@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:bg-white transition"/>
                </div>
              </div>
              {/* Phone + Company */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Phone</label>
                  <input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:bg-white transition"/>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Company</label>
                  <input value={form.company} onChange={e => setForm(f => ({...f, company: e.target.value}))}
                    placeholder="Company name (B2B)"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:bg-white transition"/>
                </div>
              </div>
              {/* Source + Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Source</label>
                  <select value={form.source} onChange={e => setForm(f => ({...f, source: e.target.value}))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:bg-white transition">
                    <option value="">— Select source —</option>
                    <option>Website</option>
                    <option>Meta</option>
                    <option>Instagram</option>
                    <option>Facebook</option>
                    <option>WhatsApp</option>
                    <option>Call</option>
                    <option>Referral</option>
                    <option>Walk-in</option>
                    <option>Exhibition</option>
                    <option>Email</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Type</label>
                  <div className="flex rounded-xl border border-slate-200 overflow-hidden">
                    {["B2B","B2C"].map(t => (
                      <button key={t} type="button" onClick={() => setForm(f => ({...f, productType: t}))}
                        className={`flex-1 py-2 text-xs font-bold transition ${form.productType === t ? "text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
                        style={form.productType === t ? { backgroundColor: "#035f96" } : {}}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {/* Status */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:bg-white transition">
                  {MFG_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
              {/* Product search */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Product (from catalogue)</label>
                <input value={prodSearch} onChange={e => { setProdSearch(e.target.value); setForm(f => ({...f, productId: "", variantId: ""})); }}
                  placeholder="Search product name…"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:bg-white transition"/>
                {filteredProducts.length > 0 && !form.productId && (
                  <div className="mt-1 rounded-xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100 max-h-40 overflow-y-auto">
                    {filteredProducts.map(p => (
                      <button key={p.id} type="button" onClick={() => { setForm(f => ({...f, productId: p.id, customProduct: ""})); setProdSearch(p.name); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 transition text-left">
                        <div className="w-8 h-8 rounded-lg border border-slate-100 overflow-hidden bg-slate-50 shrink-0 flex items-center justify-center">
                          {(() => { const u = productOptionImg(p); return u ? <img src={u} alt="" className="w-full h-full object-cover"/> : <IconBox size={14} className="text-slate-300"/>; })()}
                        </div>
                        <span className="text-xs font-semibold text-slate-800 truncate">{p.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                {form.productId && (
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-brand font-semibold">
                    <IconCheck size={13}/> {prodSearch}
                    <button type="button" onClick={() => { setForm(f => ({...f, productId: "", variantId: ""})); setProdSearch(""); }}
                      className="text-slate-400 hover:text-rose-500 transition ml-1"><IconX size={12}/></button>
                  </div>
                )}
              </div>
              {/* Custom product (if none selected from catalogue) */}
              {!form.productId && (
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    Custom / New Product <span className="normal-case font-normal text-slate-400">(not in catalogue)</span>
                  </label>
                  <input value={form.customProduct} onChange={e => setForm(f => ({...f, customProduct: e.target.value}))}
                    placeholder="e.g. Custom 500L Cleanroom Panel, ISO 7 ceiling grid…"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:bg-white transition"/>
                </div>
              )}
              {/* Message */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Message / Requirements</label>
                <textarea value={form.message} onChange={e => setForm(f => ({...f, message: e.target.value}))}
                  rows={3} placeholder="Specs, quantity, delivery date, special requirements…"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:bg-white resize-none transition"/>
              </div>
              {/* Admin notes */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Admin Notes <span className="normal-case font-normal text-slate-400">(internal)</span></label>
                <textarea value={form.adminNotes} onChange={e => setForm(f => ({...f, adminNotes: e.target.value}))}
                  rows={2} placeholder="Quoted price, follow-up date, call notes…"
                  className="w-full rounded-xl border border-slate-200 bg-amber-50 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:bg-white resize-none transition"/>
              </div>
            </div>
            <div className="flex gap-3 px-5 py-4 bg-slate-50 border-t border-slate-100 justify-end">
              <button onClick={() => setAddOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition">
                Cancel
              </button>
              <button onClick={saveLead} disabled={saving}
                className="px-5 py-2 rounded-xl text-white text-xs font-bold transition disabled:opacity-50 inline-flex items-center gap-1.5"
                style={{ backgroundColor: "#035f96" }}>
                {saving && <IconRefresh size={12} className="animate-spin"/>}
                {editLead ? "Save Changes" : "Add Lead"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes modal */}
      {editNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4"
          onClick={e => e.target === e.currentTarget && setEditNotes(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <IconNotes size={16} className="text-amber-500"/> Admin Notes
              </h3>
              <button onClick={() => setEditNotes(null)} className="text-slate-400 hover:text-slate-700"><IconX size={18}/></button>
            </div>
            <div className="p-5">
              <textarea value={editNotes.notes} onChange={e => setEditNotes({ ...editNotes, notes: e.target.value })}
                rows={5} placeholder="Quoted price, promised delivery date, special requirements, follow-up notes…"
                className="w-full rounded-xl border border-slate-200 bg-amber-50 px-4 py-3 text-sm outline-none focus:border-amber-400 focus:bg-white resize-none transition"/>
            </div>
            <div className="flex gap-3 px-5 py-4 bg-slate-50 border-t border-slate-100 justify-end">
              <button onClick={() => setEditNotes(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition">
                Cancel
              </button>
              <button onClick={saveNotes}
                className="px-4 py-2 rounded-xl text-white text-xs font-bold transition"
                style={{ backgroundColor: "#035f96" }}>
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Export Lead Pipeline"
        columns={MFG_EXPORT_COLUMNS}
        data={items}
      />
    </div>
  );
}
