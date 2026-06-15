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
} from "@tabler/icons-react";

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
      .then(j => setItems(j.data?.items || []))
      .catch(e => showToast(e.message, "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm({ title: "", subtitle: "", linkUrl: "", sortOrder: 0, desktopImageUrl: "", mobileImageUrl: "" }); setModal("create"); };
  const openEdit = (item: any) => {
    setForm({ title: item.title, subtitle: item.subtitle || "", linkUrl: item.linkUrl || "", sortOrder: item.sortOrder || 0, desktopImageUrl: item.desktopImageUrl || "", mobileImageUrl: item.mobileImageUrl || "" });
    setModal(item);
  };

  const save = async () => {
    if (!form.title.trim()) { showToast("Title required", "error"); return; }
    setSaving(true);
    try {
      if (modal === "create") {
        await apiFetch("/content/banners", { method: "POST", body: JSON.stringify(form) });
        showToast("Banner created");
      } else {
        await apiFetch(`/content/banners/${modal.id}`, { method: "PUT", body: JSON.stringify(form) });
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
        <div className="text-[10px] text-slate-400 font-semibold hidden sm:block">Desktop: 1600×560px · Mobile: 768×400px</div>
        <button onClick={openCreate} className="inline-flex items-center gap-1.5 rounded-xl bg-sky-700 hover:bg-sky-800 px-4 py-2 text-xs font-bold text-white transition">
          <IconPlus size={14} /> Add Banner
        </button>
      </PageHeader>

      {loading ? <Skeleton /> : items.length === 0 ? <Empty icon={IconFlag} msg="No banners — add one to show on homepage hero" /> : (
        <div className="space-y-4">
          {items.map((item: any) => (
            <div key={item.id} className={`rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden ${!item.isActive ? "opacity-60" : ""}`}>
              {item.desktopImageUrl && (
                <div className="h-28 overflow-hidden bg-slate-100">
                  <img src={item.desktopImageUrl} alt={item.title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
              )}
              {!item.desktopImageUrl && (
                <div className="h-16 bg-gradient-to-r from-brand/20 to-slate-200/40 flex items-center px-4">
                  <p className="text-xs font-semibold text-brand/70">No desktop image — fallback gradient shown</p>
                </div>
              )}
              <div className="p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-900">{item.title}</p>
                    <Badge color={item.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}>
                      {item.isActive ? "Live" : "Hidden"}
                    </Badge>
                    <Badge color="bg-slate-100 text-slate-500">Order: {item.sortOrder}</Badge>
                  </div>
                  {item.subtitle && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.subtitle}</p>}
                  {item.linkUrl && <p className="text-[10px] text-sky-600 font-mono mt-0.5">{item.linkUrl}</p>}
                  <div className="flex gap-2 mt-1.5">
                    {item.desktopImageUrl && <Badge color="bg-sky-50 text-sky-700">Desktop ✓</Badge>}
                    {item.mobileImageUrl && <Badge color="bg-violet-50 text-violet-700">Mobile ✓</Badge>}
                    {!item.mobileImageUrl && <Badge color="bg-amber-50 text-amber-700">No mobile image</Badge>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => toggle(item)} title={item.isActive ? "Hide" : "Publish"}
                    className={`h-8 w-8 flex items-center justify-center rounded-lg transition ${item.isActive ? "text-emerald-600 hover:bg-emerald-50" : "text-slate-400 hover:bg-slate-50"}`}>
                    {item.isActive ? <IconEye size={14} /> : <IconEyeOff size={14} />}
                  </button>
                  <button onClick={() => openEdit(item)} className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition"><IconEdit size={14} /></button>
                  <button onClick={() => del(item.id)} className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition"><IconTrash size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === "create" ? "Add Banner" : "Edit Banner"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            {([
              { label: "Title *", key: "title", ph: "Precision Cleanroom Systems" },
              { label: "Subtitle", key: "subtitle", ph: "Supporting headline text..." },
              { label: "Link URL", key: "linkUrl", ph: "/products" },
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
              <p>🖥 Desktop image: <strong>1600 × 560 px</strong></p>
              <p>📱 Mobile image: <strong>768 × 400 px</strong> (optional — uses desktop if blank)</p>
            </div>
            <ImageUploadField label="Desktop Image (1600×560px) *" value={form.desktopImageUrl} onChange={url => setForm(p => ({ ...p, desktopImageUrl: url }))} showToast={showToast} dimensions="1600 × 560 px" />
            <ImageUploadField label="Mobile Image (768×400px) — optional" value={form.mobileImageUrl} onChange={url => setForm(p => ({ ...p, mobileImageUrl: url }))} showToast={showToast} dimensions="768 × 400 px" />
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
                {can("permission", "read") && (
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
                              <button onClick={() => archive(u)} className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition">
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
              { label: "Phone", key: "phone", type: "tel", ph: "+91 98765 43210" },
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
    </div>
  );
}
