import React, { useState, useEffect } from "react";
import { IconPlus, IconTrash, IconEdit, IconX, IconCheck, IconTag } from "@tabler/icons-react";
import { apiFetch } from "../lib/api";

const inputCls = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 transition";

interface AttributeValue {
  id: string;
  value: string;
  sortOrder?: number;
}

interface Attribute {
  id: string;
  name: string;
  values: AttributeValue[];
}

interface AttributesPageProps {
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export default function AttributesPage({ showToast }: AttributesPageProps) {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Create attribute
  const [newAttrName, setNewAttrName] = useState("");
  const [showAddAttr, setShowAddAttr] = useState(false);

  // Edit attribute name
  const [editAttrId, setEditAttrId] = useState<string | null>(null);
  const [editAttrName, setEditAttrName] = useState("");

  // New value per attribute
  const [newValueInputs, setNewValueInputs] = useState<Record<string, string>>({});

  // Edit value
  const [editValueId, setEditValueId] = useState<string | null>(null);
  const [editValueText, setEditValueText] = useState("");

  const loadAttributes = () => {
    setLoading(true);
    apiFetch("/attributes")
      .then((j: any) => setAttributes(Array.isArray(j.data) ? j.data : []))
      .catch(() => showToast("Failed to load attributes", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAttributes(); }, []);

  const createAttribute = async () => {
    if (!newAttrName.trim()) return;
    setBusy(true);
    try {
      await apiFetch("/attributes", { method: "POST", body: JSON.stringify({ name: newAttrName.trim() }) });
      setNewAttrName("");
      setShowAddAttr(false);
      showToast("Attribute created", "success");
      loadAttributes();
    } catch (e: any) {
      showToast(e.message || "Failed to create attribute", "error");
    } finally {
      setBusy(false);
    }
  };

  const updateAttributeName = async (id: string) => {
    if (!editAttrName.trim()) return;
    setBusy(true);
    try {
      await apiFetch(`/attributes/${id}`, { method: "PUT", body: JSON.stringify({ name: editAttrName.trim() }) });
      setEditAttrId(null);
      showToast("Attribute updated", "success");
      loadAttributes();
    } catch (e: any) {
      showToast(e.message || "Update failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const deleteAttribute = async (id: string, name: string) => {
    if (!window.confirm(`Delete attribute "${name}" and all its values? This may affect existing products.`)) return;
    setBusy(true);
    try {
      await apiFetch(`/attributes/${id}`, { method: "DELETE" });
      showToast("Attribute deleted", "success");
      loadAttributes();
    } catch (e: any) {
      showToast(e.message || "Delete failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const addValue = async (attrId: string) => {
    const val = newValueInputs[attrId]?.trim();
    if (!val) return;
    setBusy(true);
    try {
      await apiFetch(`/attributes/${attrId}/values`, { method: "POST", body: JSON.stringify({ value: val }) });
      setNewValueInputs(p => ({ ...p, [attrId]: "" }));
      showToast(`Value "${val}" added`, "success");
      loadAttributes();
    } catch (e: any) {
      showToast(e.message || "Failed to add value", "error");
    } finally {
      setBusy(false);
    }
  };

  const updateValue = async (attrId: string, valueId: string) => {
    if (!editValueText.trim()) return;
    setBusy(true);
    try {
      await apiFetch(`/attributes/${attrId}/values/${valueId}`, { method: "PUT", body: JSON.stringify({ value: editValueText.trim() }) });
      setEditValueId(null);
      showToast("Value updated", "success");
      loadAttributes();
    } catch (e: any) {
      showToast(e.message || "Update failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const deleteValue = async (attrId: string, valueId: string, val: string) => {
    if (!window.confirm(`Delete value "${val}"?`)) return;
    setBusy(true);
    try {
      await apiFetch(`/attributes/${attrId}/values/${valueId}`, { method: "DELETE" });
      showToast("Value deleted", "success");
      loadAttributes();
    } catch (e: any) {
      showToast(e.message || "Delete failed", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-950">Attributes</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Define product properties like Color, Size, Material. Variants are built from combinations of these.
          </p>
        </div>
        <button
          onClick={() => setShowAddAttr(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-700 hover:bg-sky-800 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition"
        >
          <IconPlus size={15} />
          New Attribute
        </button>
      </div>

      {/* Add Attribute Form */}
      {showAddAttr && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-5 space-y-3">
          <p className="text-xs font-extrabold uppercase tracking-wider text-sky-700">New Attribute</p>
          <div className="flex gap-3">
            <input
              autoFocus
              value={newAttrName}
              onChange={e => setNewAttrName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); createAttribute(); } if (e.key === "Escape") setShowAddAttr(false); }}
              placeholder="Attribute name (e.g. Color, Size, Material, Width)"
              className={inputCls}
            />
            <button
              type="button"
              onClick={createAttribute}
              disabled={busy || !newAttrName.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-700 hover:bg-sky-800 px-5 py-2.5 text-sm font-bold text-white transition disabled:opacity-50 whitespace-nowrap"
            >
              <IconCheck size={15} /> Create
            </button>
            <button
              type="button"
              onClick={() => { setShowAddAttr(false); setNewAttrName(""); }}
              className="h-[42px] w-[42px] flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 transition"
            >
              <IconX size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 animate-pulse space-y-3">
              <div className="h-5 bg-slate-100 rounded w-24" />
              <div className="flex gap-1.5 flex-wrap">
                {[1, 2, 3].map(j => <div key={j} className="h-6 w-16 bg-slate-100 rounded-full" />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && attributes.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center space-y-3">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mx-auto">
            <IconTag size={24} />
          </div>
          <p className="font-bold text-slate-700">No attributes yet</p>
          <p className="text-sm text-slate-400">
            Create attributes like "Color", "Size", or "Material" to enable product variants.
          </p>
          <button
            onClick={() => setShowAddAttr(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-700 hover:bg-sky-800 px-4 py-2 text-sm font-bold text-white transition"
          >
            <IconPlus size={14} /> Create First Attribute
          </button>
        </div>
      )}

      {/* Attributes Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {attributes.map(attr => (
          <div key={attr.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Attribute Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
              {editAttrId === attr.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    autoFocus
                    value={editAttrName}
                    onChange={e => setEditAttrName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") updateAttributeName(attr.id); if (e.key === "Escape") setEditAttrId(null); }}
                    className="flex-1 rounded-lg border border-sky-300 bg-white px-3 py-1.5 text-sm font-bold outline-none focus:ring-2 focus:ring-sky-100"
                  />
                  <button onClick={() => updateAttributeName(attr.id)} disabled={busy} className="text-emerald-600 hover:text-emerald-700 p-1"><IconCheck size={15} /></button>
                  <button onClick={() => setEditAttrId(null)} className="text-slate-400 hover:text-slate-600 p-1"><IconX size={14} /></button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="h-7 w-7 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
                    <IconTag size={13} className="text-sky-700" />
                  </div>
                  <p className="font-extrabold text-sm text-slate-900 truncate">{attr.name}</p>
                  <span className="ml-auto text-[10px] text-slate-400 font-semibold shrink-0">{attr.values.length} values</span>
                </div>
              )}
              {editAttrId !== attr.id && (
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  <button
                    onClick={() => { setEditAttrId(attr.id); setEditAttrName(attr.name); }}
                    className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-sky-50 text-slate-400 hover:text-sky-600 transition"
                    title="Rename attribute"
                  >
                    <IconEdit size={13} />
                  </button>
                  <button
                    onClick={() => deleteAttribute(attr.id, attr.name)}
                    className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                    title="Delete attribute"
                  >
                    <IconTrash size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* Values */}
            <div className="p-4 space-y-3">
              <div className="flex flex-wrap gap-1.5 min-h-[36px]">
                {attr.values.length === 0 && (
                  <p className="text-[11px] text-slate-400 italic">No values yet. Add values below.</p>
                )}
                {attr.values.map(val => (
                  <div key={val.id} className="group relative">
                    {editValueId === val.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          autoFocus
                          value={editValueText}
                          onChange={e => setEditValueText(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") updateValue(attr.id, val.id); if (e.key === "Escape") setEditValueId(null); }}
                          className="w-24 rounded-lg border border-sky-400 px-2 py-1 text-xs font-bold outline-none bg-white"
                        />
                        <button onClick={() => updateValue(attr.id, val.id)} className="text-emerald-600 hover:text-emerald-700"><IconCheck size={13} /></button>
                        <button onClick={() => setEditValueId(null)} className="text-slate-400"><IconX size={12} /></button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-sky-300 hover:bg-sky-50 transition">
                        {val.value}
                        <span className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition">
                          <button
                            onClick={() => { setEditValueId(val.id); setEditValueText(val.value); }}
                            className="text-slate-400 hover:text-sky-600 ml-0.5"
                            title="Edit"
                          >
                            <IconEdit size={9} />
                          </button>
                          <button
                            onClick={() => deleteValue(attr.id, val.id, val.value)}
                            className="text-slate-400 hover:text-rose-600"
                            title="Delete"
                          >
                            <IconX size={9} />
                          </button>
                        </span>
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Add value input */}
              <div className="flex gap-2">
                <input
                  value={newValueInputs[attr.id] || ""}
                  onChange={e => setNewValueInputs(p => ({ ...p, [attr.id]: e.target.value }))}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addValue(attr.id); } }}
                  placeholder={`Add value (e.g. ${attr.name === "Color" ? "Red, Blue" : attr.name === "Size" ? "S, M, L" : "Option 1"})`}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 transition"
                />
                <button
                  type="button"
                  onClick={() => addValue(attr.id)}
                  disabled={busy || !newValueInputs[attr.id]?.trim()}
                  className="inline-flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-2 transition disabled:opacity-40"
                >
                  <IconPlus size={12} /> Add
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
