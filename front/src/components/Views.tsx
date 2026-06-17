import React, { useState, useEffect, useMemo } from "react";
import { useDropzone } from "react-dropzone";

// --- Types ---
interface ViewProps {
  active: string;
  data: any;
  busy: boolean;
  can: (res: string, act: string) => boolean;
  apiFetch: <T>(path: string, options?: RequestInit) => Promise<ApiResponse<T>>;
  showToast: (msg: string) => void;
  loadResource: (res: string, endpoint: string) => void;
}

type ApiResponse<T> = {
  data: T;
  message?: string;
};

// --- API R2 Upload Helpers ---
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4002/api/v1";

async function uploadToR2(file: File): Promise<{ url: string; key: string }> {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("folder", "admin");
  const res = await fetch(`${API_BASE}/uploads`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  if (!res.ok) {
    throw new Error(`Upload failed: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}

async function deleteFromR2(key: string): Promise<void> {
  const res = await fetch(`${API_BASE}/uploads`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ key }),
  });
  if (!res.ok) {
    throw new Error(`Delete failed: ${res.statusText}`);
  }
}

// --- Icons (Clean SVG Icons) ---
const SearchIcon = () => (
  <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const PlusIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);
const TrashIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const EditIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const DownloadIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);
const UploadIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);
const CloseIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const SpinnerIcon = () => (
  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

// --- Local Storage Helpers ---
function getMockData<T>(key: string, defaultVal: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function saveMockData<T>(key: string, val: T): void {
  localStorage.setItem(key, JSON.stringify(val));
}

// --- Image Upload Field Component ---
interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  showToast: (msg: string) => void;
  dimensions?: string;
}

export function ImageUploadField({ label, value, onChange, showToast, dimensions }: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      // Delete existing R2 image before uploading replacement
      if (value && !value.startsWith("blob:")) {
        const oldKey = value.split("/").pop() || "";
        if (oldKey) deleteFromR2(oldKey).catch(() => { }); // non-blocking
      }
      const data = await uploadToR2(file);
      onChange(data.url);
      showToast("Image uploaded to Cloudflare R2 successfully.");
    } catch (err) {
      console.warn("R2 Endpoint failed, triggering sandbox mock fallback", err);
      const fakeUrl = URL.createObjectURL(file);
      onChange(fakeUrl);
      showToast("Image uploaded (Sandbox Offline Fallback).");
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
  });

  const handleDelete = async () => {
    if (!value) return;
    setUploading(true);
    try {
      if (!value.startsWith("blob:")) {
        const key = value.split("/").pop() || "";
        if (key) await deleteFromR2(key);
      }
      onChange("");
      showToast("Image deleted from Cloudflare R2.");
    } catch (err) {
      console.warn("Delete asset failed:", err);
      onChange("");
      showToast("Image cleared from database record.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">{label}</span>
        {dimensions && <span className="text-[10px] text-sky-600 font-semibold">{dimensions}</span>}
      </div>
      {value ? (
        <div className="relative inline-block group rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
          <img src={value} alt="Preview" className="h-32 w-48 object-cover" />
          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={uploading}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-full p-2 text-xs font-bold transition flex items-center gap-1 shadow-md cursor-pointer"
            >
              <TrashIcon /> Delete
            </button>
            <div {...getRootProps()} className="bg-sky-600 hover:bg-sky-700 text-white rounded-full p-2 text-xs font-bold cursor-pointer transition flex items-center gap-1 shadow-md">
              <input {...getInputProps()} />
              <UploadIcon /> Replace
            </div>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl h-36 cursor-pointer transition p-4 text-center ${isDragActive
            ? "border-sky-500 bg-sky-50/30"
            : "border-slate-300 hover:border-sky-500 hover:bg-sky-50/10"
            }`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <span className="animate-spin h-5 w-5 text-sky-600 border-2 border-t-transparent border-sky-600 rounded-full" />
              <span className="text-xs text-slate-500 font-medium">Uploading to R2...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-slate-400">
              <UploadIcon />
              <span className="text-xs font-semibold text-slate-600 mt-1">
                {isDragActive ? "Drop the image here" : "Drag & drop image here, or click"}
              </span>
              <span className="text-[10px] text-slate-400">Supports PNG, JPG, WEBP</span>
            </div>
          )}
        </div>
      )}
      {error && <p className="text-[10px] text-rose-600 font-bold">{error}</p>}
    </div>
  );
}

// --- Product Image Uploader with Drag-Drop Reorder ---
interface ProductImage {
  url: string;
  altText?: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

interface ProductImageUploaderProps {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  showToast: (msg: string) => void;
}

export function ProductImageUploader({ images, onChange, showToast }: ProductImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    setUploading(true);
    const newImgs: ProductImage[] = [];
    for (const file of files) {
      try {
        const data = await uploadToR2(file);
        newImgs.push({ url: data.url, altText: file.name, isPrimary: false, sortOrder: images.length + newImgs.length });
        showToast(`Uploaded: ${file.name}`);
      } catch {
        const fakeUrl = URL.createObjectURL(file);
        newImgs.push({ url: fakeUrl, altText: file.name, isPrimary: false, sortOrder: images.length + newImgs.length });
        showToast(`Uploaded (offline): ${file.name}`);
      }
    }
    const updated = [...images, ...newImgs];
    if (updated.length > 0) updated[0].isPrimary = true;
    onChange(updated);
    setUploading(false);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    const newImgs: ProductImage[] = [];
    for (const file of files) {
      try {
        const data = await uploadToR2(file);
        newImgs.push({ url: data.url, altText: file.name, isPrimary: false, sortOrder: images.length + newImgs.length });
      } catch {
        const fakeUrl = URL.createObjectURL(file);
        newImgs.push({ url: fakeUrl, altText: file.name, isPrimary: false, sortOrder: images.length + newImgs.length });
      }
    }
    const updated = [...images, ...newImgs];
    if (updated.length > 0) updated[0].isPrimary = true;
    onChange(updated);
    setUploading(false);
    e.target.value = "";
    showToast(`${newImgs.length} image(s) uploaded`);
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const updated = [...images];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    updated.forEach((img, i) => { img.sortOrder = i; img.isPrimary = i === 0; });
    onChange(updated);
  };

  const removeImage = async (idx: number) => {
    const img = images[idx];
    if (!img.url.startsWith("blob:")) {
      const key = img.url.split("/").pop() || "";
      if (key) deleteFromR2(key).catch(() => { });
    }
    const updated = images.filter((_, i) => i !== idx);
    updated.forEach((img, i) => { img.sortOrder = i; img.isPrimary = i === 0; });
    onChange(updated);
    showToast("Image removed");
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl h-28 cursor-pointer transition p-4 text-center ${dragOver ? "border-sky-500 bg-sky-50/40" : "border-slate-300 hover:border-sky-400 hover:bg-sky-50/10"}`}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={handleFileInput}
        />
        {uploading ? (
          <div className="flex items-center gap-2 text-xs text-sky-700 font-semibold">
            <span className="animate-spin h-4 w-4 border-2 border-t-transparent border-sky-600 rounded-full" />
            Uploading to R2...
          </div>
        ) : (
          <div className="text-slate-400 space-y-1">
            <UploadIcon />
            <p className="text-xs font-semibold text-slate-600">Drag & drop images here, or click to select</p>
            <p className="text-[10px]">PNG, JPG, WEBP · Multiple allowed · First = Primary</p>
          </div>
        )}
      </div>

      {/* Image grid with drag reorder */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((img, idx) => (
            <div
              key={idx}
              draggable
              onDragStart={() => setDraggingIdx(idx)}
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={(e) => { e.preventDefault(); if (draggingIdx !== null && draggingIdx !== idx) { moveImage(draggingIdx, idx); setDraggingIdx(null); } }}
              className={`relative group rounded-xl border-2 overflow-hidden bg-slate-50 cursor-grab active:cursor-grabbing transition ${idx === 0 ? "border-sky-500" : "border-slate-200"}`}
            >
              <img src={img.url} alt={img.altText || `Image ${idx + 1}`} className="w-full h-20 object-cover" />
              {idx === 0 && (
                <span className="absolute top-1 left-1 text-[8px] font-extrabold uppercase bg-sky-500 text-white px-1.5 py-0.5 rounded">
                  Primary
                </span>
              )}
              <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={() => moveImage(idx, idx - 1)}
                  disabled={idx === 0}
                  className="bg-white/90 rounded px-1.5 py-0.5 text-[10px] font-bold disabled:opacity-30"
                >◀</button>
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="bg-rose-600 text-white rounded px-1.5 py-0.5 text-[10px] font-bold"
                >✕</button>
                <button
                  type="button"
                  onClick={() => moveImage(idx, idx + 1)}
                  disabled={idx === images.length - 1}
                  className="bg-white/90 rounded px-1.5 py-0.5 text-[10px] font-bold disabled:opacity-30"
                >▶</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Product Document (PDF) Uploader ---
async function uploadPdfToR2(file: File): Promise<{ url: string; key: string; originalName: string }> {
  const formData = new FormData();
  formData.append("document", file);
  formData.append("folder", "documents");
  const res = await fetch(`${API_BASE}/uploads`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
  const json = await res.json();
  return json.data;
}

export interface ProductDoc {
  title: string;
  url: string;
  key?: string;
  mimeType?: string;
}

interface ProductDocUploaderProps {
  documents: ProductDoc[];
  onChange: (docs: ProductDoc[]) => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export function ProductDocUploader({ documents, onChange, showToast }: ProductDocUploaderProps) {
  const [uploading, setUploading] = useState<number | null>(null);

  const handleFileUpload = async (idx: number, file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      showToast("Only PDF files are allowed", "error");
      return;
    }
    setUploading(idx);
    try {
      // Delete old file from R2 if replacing
      const existing = documents[idx];
      if (existing?.key) {
        deleteFromR2(existing.key).catch(() => { });
      }
      const data = await uploadPdfToR2(file);
      const updated = [...documents];
      updated[idx] = { ...updated[idx], url: data.url, key: data.key };
      onChange(updated);
      showToast(`PDF uploaded: ${data.originalName}`, "success");
    } catch (err: any) {
      showToast(err.message || "PDF upload failed", "error");
    } finally {
      setUploading(null);
    }
  };

  const handleAddRow = () => {
    onChange([...documents, { title: "", url: "", mimeType: "application/pdf" }]);
  };

  const handleRemove = async (idx: number) => {
    const doc = documents[idx];
    if (doc?.key) {
      deleteFromR2(doc.key).catch(() => { });
    }
    onChange(documents.filter((_, i) => i !== idx));
  };

  const handleTitleChange = (idx: number, title: string) => {
    const updated = [...documents];
    updated[idx] = { ...updated[idx], title };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Technical Documents (PDF)</span>
        <button
          type="button"
          onClick={handleAddRow}
          className="text-[10px] font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-lg hover:bg-sky-100 transition flex items-center gap-1"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add PDF
        </button>
      </div>

      {documents.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-400 italic">
          No documents yet. Click "Add PDF" to attach technical data sheets.
        </div>
      )}

      {documents.map((doc, idx) => (
        <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              value={doc.title}
              onChange={e => handleTitleChange(idx, e.target.value)}
              placeholder="Document title (e.g. Technical Data Sheet)"
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition"
            />
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              className="text-slate-400 hover:text-rose-600 transition p-1"
              title="Remove document"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {doc.url ? (
            <div className="flex items-center gap-2 rounded-lg bg-white border border-emerald-200 px-3 py-2">
              <svg className="h-4 w-4 text-rose-600 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM11 18v-4l-1.5 1.5-.7-.7 2.7-2.7 2.7 2.7-.7.7L12 14v4h-1z" /></svg>
              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-slate-700 hover:text-sky-700 truncate flex-1">
                {doc.url.split("/").pop() || "View PDF"}
              </a>
              <label className="cursor-pointer text-[10px] font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg hover:bg-sky-100 transition whitespace-nowrap relative">
                {uploading === idx ? (
                  <span className="flex items-center gap-1">
                    <span className="animate-spin h-3 w-3 border-2 border-t-transparent border-sky-600 rounded-full" />
                    Uploading...
                  </span>
                ) : "Replace PDF"}
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(idx, f); e.target.value = ""; }}
                />
              </label>
            </div>
          ) : (
            <label className={`flex items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 cursor-pointer transition ${uploading === idx ? "border-sky-300 bg-sky-50" : "border-slate-300 hover:border-sky-400 hover:bg-sky-50/20"}`}>
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(idx, f); e.target.value = ""; }}
              />
              {uploading === idx ? (
                <span className="flex items-center gap-2 text-xs text-sky-700 font-semibold">
                  <span className="animate-spin h-4 w-4 border-2 border-t-transparent border-sky-600 rounded-full" />
                  Uploading PDF to R2...
                </span>
              ) : (
                <span className="text-xs text-slate-500 font-semibold">Click to upload PDF</span>
              )}
            </label>
          )}
        </div>
      ))}
    </div>
  );
}

// --- Reusable Generic CRUD Table Component ---
interface ColumnDef<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
}

interface FormFieldDef {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "textarea" | "image" | "checkbox" | "json";
  options?: { value: string; label: string }[];
  required?: boolean;
  disabled?: boolean;
  dimensions?: string;
}

interface CRUDTableProps<T> {
  title: string;
  eyebrow: string;
  description: string;
  moduleKey?: string;
  items: T[];
  columns: ColumnDef<T>[];
  formFields: FormFieldDef[];
  onSave: (item: Partial<T>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onBulkDelete: (ids: string[]) => Promise<void>;
  onStatusChange?: (id: string, newStatus: any) => Promise<void>;
  searchPlaceholder?: string;
  searchField: string;
  filterField?: string;
  filterOptions?: { value: string; label: string }[];
  showToast: (msg: string) => void;
}

function CRUDTable<T extends { id: string; isActive?: boolean }>({
  title,
  eyebrow,
  description,
  moduleKey,
  items,
  columns,
  formFields,
  onSave,
  onDelete,
  onBulkDelete,
  onStatusChange,
  searchPlaceholder = "Search...",
  searchField,
  filterField,
  filterOptions,
  showToast,
}: CRUDTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVal, setFilterVal] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formState, setFormState] = useState<any>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [errorBanner, setErrorBanner] = useState("");

  // Filters & Search
  const filtered = useMemo(() => {
    return items.filter((item: any) => {
      const matchesSearch = String(item[searchField] || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesFilter = filterField && filterVal ? String(item[filterField] || "") === filterVal : true;
      return matchesSearch && matchesFilter;
    });
  }, [items, searchQuery, filterVal, searchField, filterField]);

  // Pagination
  const paginated = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginated.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner("");
    const errors: Record<string, string> = {};

    // Validate
    formFields.forEach((field) => {
      if (field.required && !formState[field.key]) {
        errors[field.key] = `${field.label} is required`;
      }
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSaving(true);
    try {
      await onSave(formState);
      setIsFormOpen(false);
      setFormState({});
      setFormErrors({});
      showToast(`${title} item saved successfully.`);
    } catch (err: any) {
      setErrorBanner(err.message || "Failed to save record.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: T) => {
    setFormState(item);
    setFormErrors({});
    setErrorBanner("");
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    const defaultObj: any = {};
    formFields.forEach((f) => {
      if (f.type === "checkbox") defaultObj[f.key] = false;
      else if (f.type === "number") defaultObj[f.key] = 0;
      else defaultObj[f.key] = "";
    });
    setFormState(defaultObj);
    setFormErrors({});
    setErrorBanner("");
    setIsFormOpen(true);
  };

  const handleExportCSV = () => {
    const headers = columns.map((c) => c.label).join(",");
    const rows = filtered.map((item: any) =>
      columns.map((c) => `"${String(item[c.key] || "").replace(/"/g, '""')}"`).join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, "_")}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Data exported to CSV file.");
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const list = JSON.parse(event.target?.result as string);
        if (!Array.isArray(list)) throw new Error("JSON file must be an array of objects.");
        for (const record of list) {
          await onSave(record);
        }
        showToast("Records imported successfully.");
      } catch (err: any) {
        showToast(err.message || "Failed to import JSON file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-1 pl-4">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-sky-700">{eyebrow}</p>
        <h2 className="text-xl font-extrabold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-500 leading-normal">{description}</p>
      </div>

      {/* Search and Filters Banner */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.04)]">
        <div className="flex-1 flex gap-3 max-w-lg">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-4 flex items-center">
              <SearchIcon />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-300 bg-white text-sm outline-none focus:border-sky-500 ring-sky-100 focus:ring-4 transition"
            />
          </div>
          {filterField && filterOptions && (
            <select
              value={filterVal}
              onChange={(e) => setFilterVal(e.target.value)}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm bg-white outline-none focus:border-sky-500"
            >
              <option value="">All {title}</option>
              {filterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {selectedIds.length > 0 && (
            <button
              onClick={async () => {
                if (confirm(`Are you sure you want to bulk delete ${selectedIds.length} items?`)) {
                  await onBulkDelete(selectedIds);
                  setSelectedIds([]);
                  showToast("Selected items deleted.");
                }
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition shadow-sm"
            >
              <TrashIcon /> Bulk Delete ({selectedIds.length})
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <DownloadIcon /> Export CSV
          </button>

          <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition">
            <UploadIcon /> Import JSON
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 rounded-2xl bg-sky-700 hover:bg-sky-800 px-5 py-3 text-sm font-semibold text-white transition shadow-lg shadow-sky-800/10"
          >
            <PlusIcon /> Add {title}
          </button>
        </div>
      </div>

      {/* Main Table Grid */}
      <div className="rounded-[2.5rem] border border-slate-200 bg-white/95 overflow-hidden shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-4 px-5 w-12">
                  <input
                    type="checkbox"
                    checked={paginated.length > 0 && selectedIds.length === paginated.length}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-sky-700 focus:ring-sky-500 h-4 w-4"
                  />
                </th>
                {columns.map((col) => (
                  <th key={col.key} className="py-4 px-5">
                    {col.label}
                  </th>
                ))}
                {onStatusChange && <th className="py-4 px-5">Status</th>}
                <th className="py-4 px-5 text-right w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length > 0 ? (
                paginated.map((item) => (
                  <tr key={item.id} className="hover:bg-sky-50/20 text-slate-700 transition">
                    <td className="py-4 px-5">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => handleSelectRow(item.id)}
                        className="rounded border-slate-300 text-sky-700 focus:ring-sky-500 h-4 w-4"
                      />
                    </td>
                    {columns.map((col) => (
                      <td key={col.key} className="py-4 px-5">
                        {col.render ? col.render(item) : String((item as any)[col.key] || "")}
                      </td>
                    ))}
                    {onStatusChange && (
                      <td className="py-4 px-5">
                        <select
                          value={item.isActive !== false ? "active" : "inactive"}
                          onChange={async (e) => {
                            if (onStatusChange) {
                              await onStatusChange(item.id, e.target.value === "active");
                              showToast("Status changed successfully");
                            }
                          }}
                          className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${item.isActive !== false
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </td>
                    )}
                    <td className="py-4 px-5 text-right flex justify-end gap-2.5">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-sky-700 bg-sky-50 hover:bg-sky-100 p-2 rounded-full transition"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm("Are you sure you want to delete this record?")) {
                            await onDelete(item.id);
                            showToast("Item deleted.");
                          }
                        }}
                        className="text-rose-700 bg-rose-50 hover:bg-rose-100 p-2 rounded-full transition"
                      >
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length + 3} className="py-12 text-center text-slate-400">
                    No records found. Click "Add" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between bg-slate-50/30 text-xs">
            <span className="text-slate-500">
              Showing <strong className="text-slate-800">{(page - 1) * itemsPerPage + 1}</strong> to{" "}
              <strong className="text-slate-800">{Math.min(page * itemsPerPage, filtered.length)}</strong> of{" "}
              <strong className="text-slate-800">{filtered.length}</strong> entries
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="rounded-xl border border-slate-300 px-3 py-1.5 text-slate-700 font-bold bg-white disabled:opacity-50 transition"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setPage(idx + 1)}
                  className={`rounded-xl px-3 py-1.5 font-bold transition ${page === idx + 1 ? "bg-sky-700 text-white" : "border border-slate-300 bg-white text-slate-700"
                    }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-xl border border-slate-300 px-3 py-1.5 text-slate-700 font-bold bg-white disabled:opacity-50 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Form Overlay Sheet */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white h-screen flex flex-col shadow-2xl p-6 relative animate-slide-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {formState.id ? `Edit ${title}` : `New ${title}`}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{description}</p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto py-5 space-y-4 pr-1">
              {errorBanner && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
                  {errorBanner}
                </div>
              )}

              {formFields.map((field) => {
                const hasErr = formErrors[field.key];
                const isDisabled = field.disabled === true;
                return (
                  <div key={field.key} className="space-y-1">
                    {field.type !== "image" && field.type !== "checkbox" && (
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        {field.label} {field.required && <span className="text-rose-600">*</span>}
                      </label>
                    )}

                    {field.type === "text" && (
                      <input
                        type="text"
                        value={formState[field.key] || ""}
                        onChange={(e) => setFormState({ ...formState, [field.key]: e.target.value })}
                        disabled={isDisabled}
                        className={`w-full rounded-2xl border p-3.5 text-sm outline-none bg-white focus:ring-4 focus:border-sky-400 ring-sky-100 transition disabled:opacity-60 disabled:bg-slate-100 ${hasErr ? "border-rose-500" : "border-slate-300"
                          }`}
                      />
                    )}

                    {field.type === "number" && (
                      <input
                        type="number"
                        value={formState[field.key] ?? 0}
                        onChange={(e) => setFormState({ ...formState, [field.key]: Number(e.target.value) })}
                        disabled={isDisabled}
                        className={`w-full rounded-2xl border p-3.5 text-sm outline-none bg-white focus:ring-4 focus:border-sky-400 ring-sky-100 transition disabled:opacity-60 disabled:bg-slate-100 ${hasErr ? "border-rose-500" : "border-slate-300"
                          }`}
                      />
                    )}

                    {field.type === "textarea" && (
                      field.key === "message" && moduleKey === "contactForms" ? (
                        <div className="w-full rounded-2xl border border-slate-200 p-4 text-sm bg-slate-50 text-slate-700 whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed shadow-inner font-normal">
                          {formState[field.key]}
                        </div>
                      ) : (
                        <textarea
                          value={formState[field.key] || ""}
                          onChange={(e) => setFormState({ ...formState, [field.key]: e.target.value })}
                          disabled={isDisabled}
                          className={`w-full rounded-2xl border p-3.5 text-sm outline-none bg-white focus:ring-4 focus:border-sky-400 ring-sky-100 transition min-h-24 disabled:opacity-60 disabled:bg-slate-100 ${hasErr ? "border-rose-500" : "border-slate-300"
                            }`}
                        />
                      )
                    )}

                    {field.type === "json" && (
                      <textarea
                        value={formState[field.key] || ""}
                        onChange={(e) => setFormState({ ...formState, [field.key]: e.target.value })}
                        disabled={isDisabled}
                        placeholder='{"key": "value"}'
                        className={`w-full rounded-2xl border p-3.5 text-sm font-mono outline-none bg-white focus:ring-4 focus:border-sky-400 ring-sky-100 transition min-h-24 disabled:opacity-60 disabled:bg-slate-100 ${hasErr ? "border-rose-500" : "border-slate-300"
                          }`}
                      />
                    )}

                    {field.type === "select" && (
                      <select
                        value={formState[field.key] || ""}
                        onChange={(e) => setFormState({ ...formState, [field.key]: e.target.value })}
                        disabled={isDisabled}
                        className={`w-full rounded-2xl border p-3.5 text-sm outline-none bg-white focus:ring-4 focus:border-sky-400 ring-sky-100 transition disabled:opacity-60 disabled:bg-slate-100 ${hasErr ? "border-rose-500" : "border-slate-300"
                          }`}
                      >
                        <option value="">Select Option</option>
                        {field.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {field.type === "checkbox" && (
                      <label className={`flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 ${isDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}>
                        <input
                          type="checkbox"
                          checked={!!formState[field.key]}
                          onChange={(e) => setFormState({ ...formState, [field.key]: e.target.checked })}
                          disabled={isDisabled}
                          className="rounded border-slate-300 text-sky-700 focus:ring-sky-500 h-4 w-4"
                        />
                        <span>{field.label}</span>
                      </label>
                    )}

                    {field.type === "image" && (
                      <ImageUploadField
                        label={field.label}
                        value={formState[field.key] || ""}
                        onChange={(url) => setFormState({ ...formState, [field.key]: url })}
                        showToast={showToast}
                        dimensions={field.dimensions}
                      />
                    )}

                    {hasErr && <p className="text-[10px] text-rose-600 font-bold">{hasErr}</p>}
                  </div>
                );
              })}

              <div className="border-t border-slate-100 pt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-2xl border border-slate-300 px-5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-2xl bg-sky-700 hover:bg-sky-800 px-6 py-3 text-xs font-bold text-white transition shadow-lg disabled:opacity-50"
                >
                  {saving ? <SpinnerIcon /> : null}
                  {saving ? "Saving..." : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- ModuleView Component (Router for Views.tsx) ---
export function ModuleView({
  active,
  data,
  busy,
  apiFetch,
  showToast,
  loadResource,
}: ViewProps) {
  // Skeleton loader if busy
  if (busy) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-2xl w-1/4"></div>
        <div className="h-32 bg-slate-100 rounded-[2rem]"></div>
        <div className="h-64 bg-slate-100 rounded-[2rem]"></div>
      </div>
    );
  }

  // ==========================================
  // 1. SUB CATEGORIES VIEW (Connected to API)
  // ==========================================
  const subCategoriesList = data || [];
  const handleSaveSubCategory = async (item: any) => {
    const payload = {
      name: item.name,
      slug: item.slug || item.name.toLowerCase().replace(/\s+/g, "-"),
      categoryId: item.categoryId,
      description: item.description || "",
      imageUrl: item.imageUrl || "",
      order: Number(item.order || 0),
    };
    if (item.id && !item.id.startsWith("temp-")) {
      await apiFetch(`/categories/subcategories/${item.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } else {
      await apiFetch("/categories/subcategories", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }
    loadResource("subcategories", "/categories/subcategories");
  };

  const handleDeleteSubCategory = async (id: string) => {
    await apiFetch(`/categories/subcategories/${id}`, { method: "DELETE" });
    loadResource("subcategories", "/categories/subcategories");
  };

  const handleBulkDeleteSubCategory = async (ids: string[]) => {
    for (const id of ids) {
      await apiFetch(`/categories/subcategories/${id}`, { method: "DELETE" });
    }
    loadResource("subcategories", "/categories/subcategories");
  };

  // Pre-load Category Options (For parent relation)
  const [categoriesOptions, setCategoriesOptions] = useState<{ value: string; label: string }[]>([]);
  useEffect(() => {
    if (active === "subcategories") {
      apiFetch<any>("/categories?limit=100").then(
        (res) => {
          const list = (res.data?.items || []).map((cat: any) => ({
            value: cat.id,
            label: cat.name,
          }));
          setCategoriesOptions(list);
        },
        () => {
          // fallback option
          setCategoriesOptions([
            { value: "cat-1", label: "Biosafety Cabinets" },
            { value: "cat-2", label: "Pass Boxes" },
            { value: "cat-3", label: "Air Showers" },
          ]);
        }
      );
    }
  }, [active]);




  // ==========================================
  // 3. VARIANTS VIEW (Mock)
  // ==========================================
  const [variants, setVariants] = useState<any[]>(() =>
    getMockData("rr_adm_variants", [
      { id: "var-1", name: "HEPA Filter 99.97% 24x24", sku: "HF-2424", price: 12500, stock: 45, specification: '{"efficiency":"99.97%", "size":"24x24"}', isDefault: true, isActive: true },
      { id: "var-2", name: "HEPA Filter 99.99% 24x24", sku: "HF-2424-HP", price: 15500, stock: 20, specification: '{"efficiency":"99.99%", "size":"24x24"}', isDefault: false, isActive: true },
    ])
  );

  const handleSaveVariant = async (item: any) => {
    let updated;
    if (item.id) {
      updated = variants.map((x) => (x.id === item.id ? { ...x, ...item } : x));
    } else {
      updated = [...variants, { ...item, id: `var-${Date.now()}`, isActive: true }];
    }
    setVariants(updated);
    saveMockData("rr_adm_variants", updated);
  };

  const handleDeleteVariant = async (id: string) => {
    const updated = variants.filter((x) => x.id !== id);
    setVariants(updated);
    saveMockData("rr_adm_variants", updated);
  };

  const handleBulkDeleteVariant = async (ids: string[]) => {
    const updated = variants.filter((x) => !ids.includes(x.id));
    setVariants(updated);
    saveMockData("rr_adm_variants", updated);
  };

  // ==========================================
  // 4. COUPONS VIEW (Mock)
  // ==========================================
  const [coupons, setCoupons] = useState<any[]>(() =>
    getMockData("rr_adm_coupons", [
      { id: "coup-1", code: "CLEANROOM10", discountType: "PERCENTAGE", discountValue: 10, minOrderValue: 2000, isActive: true },
      { id: "coup-2", code: "WELCOME500", discountType: "FIXED", discountValue: 500, minOrderValue: 5000, isActive: true },
    ])
  );

  const handleSaveCoupon = async (item: any) => {
    let updated;
    if (item.id) {
      updated = coupons.map((x) => (x.id === item.id ? { ...x, ...item } : x));
    } else {
      updated = [...coupons, { ...item, id: `coup-${Date.now()}`, isActive: true }];
    }
    setCoupons(updated);
    saveMockData("rr_adm_coupons", updated);
  };

  const handleDeleteCoupon = async (id: string) => {
    const updated = coupons.filter((x) => x.id !== id);
    setCoupons(updated);
    saveMockData("rr_adm_coupons", updated);
  };

  const handleBulkDeleteCoupon = async (ids: string[]) => {
    const updated = coupons.filter((x) => !ids.includes(x.id));
    setCoupons(updated);
    saveMockData("rr_adm_coupons", updated);
  };

  // ==========================================
  // 5. RETURNS VIEW (Mock)
  // ==========================================
  const returnsList = active === "returns" ? (data?.items || data || []) : [];

  // ==========================================
  // 6. REFUNDS VIEW (Mock)
  // ==========================================
  const [refunds, setRefunds] = useState<any[]>(() =>
    getMockData("rr_adm_refunds", [
      { id: "ref-1", paymentRef: "pay_rzp_991823", customerName: "Venkata Cleanrooms", amount: 12500, reason: "Order Cancellation", status: "SUCCESS", date: new Date().toISOString() },
    ])
  );

  const handleSaveRefund = async (item: any) => {
    let updated;
    if (item.id) {
      updated = refunds.map((x) => (x.id === item.id ? { ...x, ...item } : x));
    } else {
      updated = [...refunds, { ...item, id: `ref-${Date.now()}`, date: new Date().toISOString() }];
    }
    setRefunds(updated);
    saveMockData("rr_adm_refunds", updated);
  };

  const handleDeleteRefund = async (id: string) => {
    const updated = refunds.filter((x) => x.id !== id);
    setRefunds(updated);
    saveMockData("rr_adm_refunds", updated);
  };

  const handleBulkDeleteRefund = async (ids: string[]) => {
    const updated = refunds.filter((x) => !ids.includes(x.id));
    setRefunds(updated);
    saveMockData("rr_adm_refunds", updated);
  };











  return (
    <div className="space-y-6">
      {/* 1. SUB CATEGORIES VIEW */}
      {active === "subcategories" && (
        <CRUDTable
          title="Sub Category"
          eyebrow="Catalog Cataloguing"
          description="Subcategories of core catalog divisions."
          items={subCategoriesList}
          columns={[
            { key: "name", label: "Sub Category Name" },
            { key: "slug", label: "Slug Url Identifier" },
            {
              key: "categoryId",
              label: "Parent ID / Category",
              render: (item: any) => {
                const found = categoriesOptions.find((x) => x.value === item.categoryId);
                return found ? found.label : item.categoryId || "None";
              },
            },
            { key: "description", label: "Description" },
          ]}
          formFields={[
            { key: "name", label: "Sub Category Name", type: "text", required: true },
            { key: "slug", label: "Custom Slug (Optional)", type: "text" },
            {
              key: "categoryId",
              label: "Parent Category",
              type: "select",
              options: categoriesOptions,
              required: true,
            },
            { key: "description", label: "Description Copy", type: "textarea" },
            { key: "imageUrl", label: "Sub Category Image", type: "image" },
            { key: "order", label: "Ordering Weight Number", type: "number" },
          ]}
          onSave={handleSaveSubCategory}
          onDelete={handleDeleteSubCategory}
          onBulkDelete={handleBulkDeleteSubCategory}
          searchField="name"
          searchPlaceholder="Search subcategories..."
          showToast={showToast}
        />
      )}

      {/* 2. ATTRIBUTES VIEW */}
      {/* {active === "attributes" && (
        <CRUDTable
          title="Attribute"
          eyebrow="Configuration Specifications"
          description="Technical attributes that products in variants can possess."
          items={attributes}
          columns={[
            { key: "name", label: "Attribute Name Key" },
            { key: "values", label: "Predefined Options / Value Set" },
          ]}
          formFields={[
            { key: "name", label: "Attribute Key (e.g. Sash Type)", type: "text", required: true },
            { key: "values", label: "Allowed Values (Comma-separated)", type: "text", required: true },
          ]}
          onSave={handleSaveAttribute}
          onDelete={handleDeleteAttribute}
          onBulkDelete={handleBulkDeleteAttribute}
          onStatusChange={handleStatusChangeAttribute}
          searchField="name"
          searchPlaceholder="Search attribute configurations..."
          showToast={showToast}
        />
      )} */}

      {/* 3. VARIANTS VIEW */}
      {active === "variants" && (
        <CRUDTable
          title="Variant"
          eyebrow="Product Configurator"
          description="Product stock options with specs, sizes, pricing, and stock."
          items={variants}
          columns={[
            { key: "name", label: "Variant Item Name" },
            { key: "sku", label: "Unique SKU" },
            {
              key: "price",
              label: "Pricing (INR)",
              render: (item: any) => `₹${Number(item.price || 0).toLocaleString()}`,
            },
            { key: "stock", label: "Warehouse Stock" },
            {
              key: "specification",
              label: "Specifications JSON",
              render: (item: any) => (
                <pre className="text-[10px] font-mono bg-slate-50 p-2 rounded max-w-[200px] overflow-auto">
                  {item.specification}
                </pre>
              ),
            },
          ]}
          formFields={[
            { key: "name", label: "Variant Name", type: "text", required: true },
            { key: "sku", label: "Variant SKU", type: "text", required: true },
            { key: "price", label: "Price (₹)", type: "number", required: true },
            { key: "stock", label: "Stock Count", type: "number", required: true },
            { key: "specification", label: "Specification JSON Object", type: "json" },
            { key: "imageUrl", label: "Variant Specific Image", type: "image" },
            { key: "isDefault", label: "Is Default Option for Product", type: "checkbox" },
          ]}
          onSave={handleSaveVariant}
          onDelete={handleDeleteVariant}
          onBulkDelete={handleBulkDeleteVariant}
          searchField="name"
          searchPlaceholder="Search variants..."
          showToast={showToast}
        />
      )}

      {/* 4. COUPONS VIEW */}
      {active === "coupons" && (
        <CRUDTable
          title="Coupon"
          eyebrow="Promotional System"
          description="Discount codes and promotional coupons."
          items={coupons}
          columns={[
            { key: "code", label: "Promo Code" },
            { key: "discountType", label: "Deduction Type" },
            {
              key: "discountValue",
              label: "Discount Value",
              render: (item: any) =>
                item.discountType === "PERCENTAGE" ? `${item.discountValue}%` : `₹${item.discountValue}`,
            },
            {
              key: "minOrderValue",
              label: "Min Cart Value",
              render: (item: any) => `₹${item.minOrderValue}`,
            },
          ]}
          formFields={[
            { key: "code", label: "Coupon Code", type: "text", required: true },
            {
              key: "discountType",
              label: "Discount Type",
              type: "select",
              options: [
                { value: "PERCENTAGE", label: "Percentage (%)" },
                { value: "FIXED", label: "Fixed Amount (₹)" },
              ],
              required: true,
            },
            { key: "discountValue", label: "Value", type: "number", required: true },
            { key: "minOrderValue", label: "Minimum Order Total Required (₹)", type: "number" },
          ]}
          onSave={handleSaveCoupon}
          onDelete={handleDeleteCoupon}
          onBulkDelete={handleBulkDeleteCoupon}
          searchField="code"
          searchPlaceholder="Search coupons..."
          showToast={showToast}
        />
      )}

      {/* 5. RETURNS VIEW */}
      {active === "returns" && (
        <CRUDTable
          title="Return"
          eyebrow="Sales Operations"
          description="Cleanroom returns requests database log."
          items={returnsList}
          columns={[
            { key: "orderNumber", label: "Order Reference" },
            { key: "customerName", label: "Customer Name" },
            {
              key: "notes",
              label: "Reason of Return",
              render: (item: any) => {
                const returnLog = item.statusHistory?.find((h: any) => h.notes?.includes("Return requested"));
                return returnLog ? returnLog.notes.replace("Return requested by customer. Reason: ", "") : item.notes || "No reason specified";
              }
            },
            {
              key: "total",
              label: "Order Total Value",
              render: (item: any) => `₹${Number(item.total || 0).toLocaleString()}`,
            },
            {
              key: "shiprocketStatus",
              label: "Shiprocket Status",
              render: (item: any) => (
                <span className="rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase bg-sky-100 text-sky-800">
                  {item.shiprocketStatus || "CREATED"}
                </span>
              ),
            },
            {
              key: "status",
              label: "Return Status",
              render: (item: any) => (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase ${item.status === "PENDING"
                    ? "bg-amber-100 text-amber-800"
                    : item.status === "APPROVED"
                      ? "bg-sky-100 text-sky-800"
                      : item.status === "CANCELLED"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                >
                  {item.status}
                </span>
              ),
            },
          ]}
          formFields={[
            { key: "orderNumber", label: "Order ID Reference", type: "text", required: true, disabled: true },
            { key: "customerName", label: "Customer Name", type: "text", required: true, disabled: true },
            {
              key: "status",
              label: "Return Status",
              type: "select",
              options: [
                { value: "CANCELLED", label: "Return Processing" },
                { value: "REFUNDED", label: "Refunded Successfully" },
              ],
            },
          ]}
          onSave={async (item: any) => {
            await apiFetch(`/orders/${item.id}`, {
              method: "PUT",
              body: JSON.stringify({ status: item.status, reason: `Updated return status to ${item.status}` }),
            });
            showToast("Return status updated successfully.");
            loadResource("returns", "/orders?returned=true&limit=100");
          }}
          onDelete={async (id: string) => {
            await apiFetch(`/orders/${id}`, { method: "PUT", body: JSON.stringify({ status: "REFUNDED", reason: "Marked Refunded by Admin" }) });
            showToast("Return marked as Refunded.");
            loadResource("returns", "/orders?returned=true&limit=100");
          }}
          onBulkDelete={async (ids: string[]) => {
            for (const id of ids) {
              await apiFetch(`/orders/${id}`, { method: "PUT", body: JSON.stringify({ status: "REFUNDED" }) });
            }
            showToast("Returns marked as Refunded.");
            loadResource("returns", "/orders?returned=true&limit=100");
          }}
          searchField="orderNumber"
          searchPlaceholder="Search returns..."
          showToast={showToast}
        />
      )}

      {/* 6. REFUNDS VIEW */}
      {active === "refunds" && (
        <CRUDTable
          title="Refund"
          eyebrow="Finance operations"
          description="Invoices refunds via payment gateway."
          items={refunds}
          columns={[
            { key: "paymentRef", label: "Razorpay Payment Ref" },
            { key: "customerName", label: "Customer Name" },
            {
              key: "amount",
              label: "Refunded Total",
              render: (item: any) => `₹${Number(item.amount || 0).toLocaleString()}`,
            },
            { key: "reason", label: "Refund Reason" },
            {
              key: "status",
              label: "Gateway Response Status",
              render: (item: any) => (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase ${item.status === "SUCCESS" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                    }`}
                >
                  {item.status}
                </span>
              ),
            },
          ]}
          formFields={[
            { key: "paymentRef", label: "Razorpay Gateway Payment ID", type: "text", required: true },
            { key: "customerName", label: "Customer Name", type: "text", required: true },
            { key: "amount", label: "Refund Amount (₹)", type: "number", required: true },
            { key: "reason", label: "Reason Code", type: "text" },
            {
              key: "status",
              label: "Status Code",
              type: "select",
              options: [
                { value: "PENDING", label: "Initiated (Pending Gateway)" },
                { value: "SUCCESS", label: "Gateway Settled Success" },
                { value: "FAILED", label: "Refund Failed" },
              ],
            },
          ]}
          onSave={handleSaveRefund}
          onDelete={handleDeleteRefund}
          onBulkDelete={handleBulkDeleteRefund}
          searchField="paymentRef"
          searchPlaceholder="Search refunds..."
          showToast={showToast}
        />
      )}

    </div>
  );
}
