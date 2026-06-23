import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  IconArrowLeft, IconDeviceFloppy, IconPlus, IconTrash,
  IconX, IconInfoCircle, IconCheck,
} from "@tabler/icons-react";
import { ProductImageUploader, ProductDocUploader } from "../components/Views";
import { RichEditorLazy as SimpleEditor } from "../components/RichEditorLazy";

import { apiFetch } from "../lib/api";

function Label({ children }: { children: React.ReactNode }) {
  return <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">{children}</span>;
}
const inputCls = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 transition";
const selectCls = `${inputCls} bg-white appearance-none`;

type TabKey = "basic" | "relations" | "seo" | "media" | "variants" | "logistics";

interface Variant {
  id?: string;
  name: string;
  sku: string;
  price: string;
  salePrice: string;
  stock: number;
  attributeValueIds: string[];
  imageUrl: string;
  images: Array<{ url: string; altText?: string; isPrimary?: boolean; sortOrder?: number }>;
  documents: Array<{ title: string; url: string; key?: string; mimeType?: string }>;
  specification: Record<string, string>;
  isDefault: boolean;
  isActive: boolean;
  weight: string;
  length: string;
  width: string;
  height: string;
  hsn: string;
  packageDetails: string;
}

const emptyVariant = (): Variant => ({
  name: "", sku: "", price: "", salePrice: "", stock: 0, imageUrl: "", images: [], attributeValueIds: [],
  documents: [],
  specification: {}, isDefault: false, isActive: true,
  weight: "1.0", length: "10.0", width: "10.0", height: "10.0",
  hsn: "9403", packageDetails: "",
});

const emptyForm = {
  id: "",
  name: "", slug: "", sku: "",
  productType: "B2B",
  basePrice: "", salePrice: "", badge: "",
  shortDescription: "", description: "",
  featured: false, newArrival: false, trending: false, isActive: true,
  b2bInquiryLabel: "Request Quote",
  hasVariants: false,
  categoryIds: [] as string[],
  subCategoryIds: [] as string[],
  industryIds: [] as string[],
  metaTitle: "", metaDescription: "", canonicalUrl: "",
  images: [] as Array<{ url: string; altText?: string; isPrimary?: boolean; sortOrder?: number }>,
  documents: [] as Array<{ title: string; url: string; key?: string; mimeType?: string }>,
  variants: [emptyVariant()] as Variant[],
  // product-level logistics (used when hasVariants = false)
  weight: "1.0", length: "10.0", width: "10.0", height: "10.0",
  hsn: "9403", packageDetails: "",
  selectedAttributeIds: [] as string[],
};



export default function ProductForm({ showToast }: {
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
  can?: (resource: string, action: string) => boolean;
}) {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;

  const [form, setForm] = useState({ ...emptyForm });
  const [tab, setTab] = useState<TabKey>("basic");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState("");

  // Relations data
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [allSubCategories, setAllSubCategories] = useState<any[]>([]);
  const [allIndustries, setAllIndustries] = useState<any[]>([]);
  const [allAttributes, setAllAttributes] = useState<any[]>([]);

  // Subcategories filtered by selected categories
  const filteredSubs = allSubCategories.filter((sub: any) =>
    form.categoryIds.length === 0 || form.categoryIds.includes(sub.categoryId)
  );

  // Active variant index for variants tab
  const [activeVariantIdx, setActiveVariantIdx] = useState(0);

  // Load categories/industries/attributes
  useEffect(() => {
    Promise.all([
      apiFetch("/categories?limit=100"),
      apiFetch("/categories/subcategories"),
      apiFetch("/industries?limit=100"),
      apiFetch("/attributes"),
    ]).then(([cats, subs, inds, attrs]) => {
      setAllCategories(cats.data?.items || cats.data || []);
      setAllSubCategories(subs.data?.items || subs.data || []);
      setAllIndustries(inds.data?.items || inds.data || []);
      setAllAttributes(Array.isArray(attrs.data) ? attrs.data : []);
    }).catch(() => { });
  }, []);

  // Load product for edit — use id-based endpoint
  useEffect(() => {
    if (!isEdit) return;
    apiFetch(`/products/id/${id}`)
      .then((j: any) => {
        const p = j.data;
        const variants = (p.variants?.length ? p.variants : [emptyVariant()]).map((v: any) => ({
          id: v.id,
          name: v.name || "",
          sku: v.sku || "",
          price: v.price ? String(v.price) : "",
          salePrice: v.salePrice ? String(v.salePrice) : "",
          attributeValueIds: (v.attributes || []).map((a: any) => a.attributeValueId),
          stock: v.stock ?? 0,
          imageUrl: v.imageUrl || "",
          images: v.images || [],
          documents: v.documents || [],
          specification: v.specification || {},
          isDefault: v.isDefault,
          isActive: v.isActive !== false,
          weight: String(v.weight || 1.0),
          length: String(v.length || 10.0),
          width: String(v.width || 10.0),
          height: String(v.height || 10.0),
          hsn: v.hsnCode || v.hsn || "9403",
          packageDetails: v.packageDetails || "",
        }));
        const selectedAttributeIds = Array.from(
          new Set<string>(
            (p.variants || []).flatMap((variant: any) =>
              (variant.attributes || [])
                .map((attr: any) => attr.attributeValue?.attribute?.id || attr.attributeValue?.attributeId || null)
                .filter((value: string | null): value is string => Boolean(value))
            )
          )
        );
        setForm({
          id: p.id,
          name: p.name, slug: p.slug, sku: p.sku || "",
          productType: p.productType,
          basePrice: p.basePrice ? String(p.basePrice) : "",
          salePrice: p.salePrice ? String(p.salePrice) : "",
          badge: p.badge || "",
          shortDescription: p.shortDescription || "",
          description: p.description || "",
          featured: p.featured,
          newArrival: p.newArrival ?? false,
          trending: p.trending ?? false,
          isActive: p.isActive,
          b2bInquiryLabel: p.b2bInquiryLabel || "Request Quote",
          hasVariants: (p.variants?.length || 0) > 1 || (p.variants?.[0]?.name !== "Standard"),
          categoryIds: (p.categories || []).map((c: any) => c.categoryId),
          subCategoryIds: (p.subCategories || []).map((sc: any) => sc.subCategoryId),
          industryIds: (p.industries || []).map((i: any) => i.industryId),
          metaTitle: p.metaTitle || "",
          metaDescription: p.metaDescription || "",
          canonicalUrl: p.canonicalUrl || "",
          images: p.images || [],
          documents: p.documents || [],
          variants,
          weight: String(p.weight || 1.0),
          length: String(p.length || 10.0),
          width: String(p.width || 10.0),
          height: String(p.height || 10.0),
          hsn: p.hsn || "9403",
          packageDetails: p.packageDetails || "",
          selectedAttributeIds,
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  // SEO auto-fill
  const autoFillSeo = () => {
    const strip = (html: string) => html.replace(/<[^>]*>/g, "").slice(0, 160);
    setForm(f => ({
      ...f,
      metaTitle: f.metaTitle || f.name,
      metaDescription: f.metaDescription || strip(f.shortDescription || f.description || ""),
    }));
    showToast("SEO auto-filled from product data", "info");
  };

  const updateVariant = (idx: number, key: keyof Variant, val: any) => {
    setForm(f => {
      const vars = [...f.variants];
      vars[idx] = { ...vars[idx], [key]: val };
      return { ...f, variants: vars };
    });
  };

  const addVariant = () => {
    setForm(f => ({ ...f, variants: [...f.variants, emptyVariant()] }));
    setActiveVariantIdx(form.variants.length);
  };

  const removeVariant = (idx: number) => {
    setForm(f => {
      const vars = f.variants.filter((_, i) => i !== idx);
      return { ...f, variants: vars.length ? vars : [emptyVariant()] };
    });
    setActiveVariantIdx(prev => Math.min(prev, form.variants.length - 2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { setError("Product name is required"); return; }

    // B2C price validation
    if (form.productType === "B2C") {
      if (!form.basePrice || Number(form.basePrice) <= 0) { setError("Base price is required for B2C products"); return; }
      if (form.salePrice) {
        const sp = Number(form.salePrice);
        const bp = Number(form.basePrice);
        if (sp <= 0) { setError("Sale price must be greater than 0"); return; }
        if (sp >= bp) { setError("Sale price must be less than base price"); return; }
      }
    }

    // Variant sale price validation
    if (form.productType === "B2C" && form.hasVariants) {
      for (const v of form.variants) {
        if (v.salePrice && Number(v.salePrice) > 0 && Number(v.price) > 0 && Number(v.salePrice) >= Number(v.price)) {
          setError(`Variant "${v.name || "unnamed"}": sale price must be less than price`);
          return;
        }
      }
    }

    if (form.images.length === 0 && form.variants.every(v => v.images.length === 0 && !v.imageUrl)) {
      setError("Add at least one product image (in Media tab or variant image)"); return;
    }

    setSaving(true); setError("");

    const variants = form.hasVariants
      ? form.variants.map(v => ({
        id: v.id,
        name: v.name,
        sku: v.sku || undefined,
        price: v.price ? Number(v.price) : null,
        salePrice: v.salePrice ? Number(v.salePrice) : null,
        attributes: (v.attributeValueIds || []).map((attributeValueId: string) => ({ attributeValueId })),
        stock: v.stock,
        imageUrl: v.imageUrl || null,
        images: v.images,
        documents: (v.documents || []).filter((d: any) => d.title && d.url),
        specification: v.specification,
        isDefault: v.isDefault,
        isActive: v.isActive,
        weight: Number(v.weight || 1),
        length: Number(v.length || 10),
        width: Number(v.width || 10),
        height: Number(v.height || 10),
        hsn: v.hsn,
        packageDetails: v.packageDetails,
      }))
      : [{
        name: "Standard",
        sku: undefined,
        price: form.productType === "B2C" && form.basePrice ? Number(form.basePrice) : null,
        stock: form.variants[0]?.stock ?? 0,
        imageUrl: form.variants[0]?.imageUrl || null,
        images: form.variants[0]?.images || [],
        specification: form.variants[0]?.specification || {},
        isDefault: true,
        isActive: true,
        weight: Number(form.weight || 1),
        length: Number(form.length || 10),
        width: Number(form.width || 10),
        height: Number(form.height || 10),
        hsn: form.hsn,
        packageDetails: form.packageDetails,
      }];

    const payload = {
      name: form.name,
      slug: form.slug || undefined,
      productType: form.productType,
      basePrice: form.basePrice ? Number(form.basePrice) : null,
      salePrice: form.salePrice ? Number(form.salePrice) : null,
      badge: form.badge || null,
      shortDescription: form.shortDescription,
      description: form.description,
      featured: form.featured,
      newArrival: form.newArrival,
      trending: form.trending,
      isActive: form.isActive,
      b2bInquiryLabel: form.b2bInquiryLabel,
      categoryIds: form.categoryIds,
      subCategoryIds: form.subCategoryIds,
      industryIds: form.industryIds,
      metaTitle: form.metaTitle || null,
      metaDescription: form.metaDescription || null,
      canonicalUrl: form.canonicalUrl || null,
      images: form.images,
      documents: form.documents.filter((d: any) => d.title && d.url),
      variants,
    };

    try {
      if (isEdit) {
        await apiFetch(`/products/${id}`, { method: "PUT", body: JSON.stringify(payload) });
        showToast("Product updated successfully");
      } else {
        await apiFetch("/products", { method: "POST", body: JSON.stringify(payload) });
        showToast("Product created successfully");
      }
      navigate("/products");
    } catch (err: any) {
      setError(err.message || "Save failed");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-slate-100 rounded w-48" />
        <div className="h-64 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: "basic", label: "Basic Info" },
    { key: "relations", label: "Categories" },
    { key: "seo", label: "SEO" },
    // Media tab only when NO variants — variant images live inside Variants tab
    ...(!form.hasVariants ? [{ key: "media" as TabKey, label: "Images & Docs" }] : []),
    ...(form.hasVariants ? [{ key: "variants" as TabKey, label: "Variants & Images" }] : []),
    { key: "logistics", label: "Logistics" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate("/products")} className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 transition text-slate-500">
          <IconArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-slate-950">{isEdit ? "Edit Product" : "Add Product"}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{isEdit ? `Editing: ${form.name}` : "Fill all required fields, then save"}</p>
        </div>
        <button type="submit" disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-700 hover:bg-sky-800 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition disabled:opacity-60">
          {saving ? <><span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Saving...</> : <><IconDeviceFloppy size={16} />Save Product</>}
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700 flex items-start gap-2">
          <IconInfoCircle size={16} className="shrink-0 mt-0.5" />{error}
        </div>
      )}

      {/* Tab nav */}
      <div className="flex border-b border-slate-200 gap-0.5 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap -mb-px border-b-2 transition ${tab === t.key ? "border-sky-700 text-sky-700" : "border-transparent text-slate-400 hover:text-slate-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* Main content */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">

          {/* ── BASIC ── */}
          {tab === "basic" && (
            <div className="space-y-4">
              <div>
                <Label>Product Name *</Label>
                <input
                  value={form.name}
                  onChange={e => {
                    const name = e.target.value;
                    const slugified = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
                    setForm(f => ({ ...f, name, slug: f.id ? f.slug : slugified }));
                  }}
                  required
                  className={inputCls}
                  placeholder="e.g. Biosafety Cabinet Class II A2"
                />
              </div>
              <div>
                <Label>Product Slug (URL Path) *</Label>
                <div className="flex gap-2">
                  <input
                    value={form.slug}
                    onChange={e => {
                      const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
                      setForm(f => ({ ...f, slug }));
                    }}
                    required
                    className={`${inputCls} flex-1 font-mono`}
                    placeholder="e.g. biosafety-cabinet-class-ii-a2"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const slugified = form.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
                      setForm(f => ({ ...f, slug: slugified }));
                      showToast("Slug generated from product name", "info");
                    }}
                    className="px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Generate
                  </button>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Product Type</Label>
                  <select value={form.productType} onChange={e => {
                    const type = e.target.value;
                    setForm(f => ({
                      ...f,
                      productType: type,
                      // Clear pricing when switching to B2B
                      basePrice: type === "B2B" ? "" : f.basePrice,
                      salePrice: type === "B2B" ? "" : f.salePrice,
                    }));
                  }} className={selectCls}>
                    <option value="B2B">B2B — Quote / Inquiry</option>
                    <option value="B2C">B2C — Cart / Checkout</option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {form.productType === "B2B" ? "B2B: no price shown. Customer requests quote." : "B2C: price shown, add to cart enabled."}
                  </p>
                </div>
                <div>
                  <Label>Badge</Label>
                  <select value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} className={selectCls}>
                    <option value="">— None —</option>
                    <option value="NEW">New Arrival</option>
                    <option value="SALE">On Sale</option>
                    <option value="HOT">Hot Selling</option>
                    <option value="BESTSELLER">Bestseller</option>
                  </select>
                </div>
              </div>
              {form.productType === "B2C" && (
                <div className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Base Price (₹) *</Label>
                      <input type="number" min="1" value={form.basePrice}
                        onChange={e => setForm(f => ({ ...f, basePrice: e.target.value }))}
                        className={`${inputCls} ${!form.basePrice ? "border-rose-300" : ""}`}
                        placeholder="e.g. 15000" required />
                    </div>
                    <div>
                      <Label>Sale Price (₹) — optional</Label>
                      <input type="number" min="1" value={form.salePrice}
                        onChange={e => setForm(f => ({ ...f, salePrice: e.target.value }))}
                        className={`${inputCls} ${form.salePrice && Number(form.salePrice) >= Number(form.basePrice) ? "border-rose-400 bg-rose-50" : ""}`}
                        placeholder="Must be less than base price" />
                      {form.salePrice && Number(form.salePrice) >= Number(form.basePrice) && (
                        <p className="text-xs text-rose-600 font-bold mt-1">⚠ Sale price must be less than base price (₹{form.basePrice})</p>
                      )}
                      {form.salePrice && Number(form.salePrice) < Number(form.basePrice) && Number(form.basePrice) > 0 && (
                        <p className="text-xs text-emerald-600 font-semibold mt-1">
                          ✓ {Math.round((1 - Number(form.salePrice) / Number(form.basePrice)) * 100)}% discount
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {form.productType === "B2B" && (
                <div>
                  <Label>Inquiry Button Label</Label>
                  <input value={form.b2bInquiryLabel} onChange={e => setForm(f => ({ ...f, b2bInquiryLabel: e.target.value }))} className={inputCls} placeholder="Request Quote" />
                </div>
              )}
              <div>
                <Label>Short Summary Description</Label>
                <SimpleEditor value={form.shortDescription} onChange={v => setForm(f => ({ ...f, shortDescription: v }))} height={160} placeholder="One paragraph summary shown on product cards..." />
              </div>
              <div>
                <Label>Full Detailed Description</Label>
                <SimpleEditor value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} height={280} placeholder="Complete product description, features, compliance notes..." />
              </div>
              <div className="flex flex-wrap gap-5 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-sky-700" />
                  <span className="text-sm font-semibold text-slate-700">⭐ Featured</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.newArrival} onChange={e => setForm(f => ({ ...f, newArrival: e.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-sky-700" />
                  <span className="text-sm font-semibold text-slate-700">🆕 New Arrival</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.trending} onChange={e => setForm(f => ({ ...f, trending: e.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-sky-700" />
                  <span className="text-sm font-semibold text-slate-700">🔥 Trending</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-sky-700" />
                  <span className="text-sm font-semibold text-slate-700">Active in Catalog</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.hasVariants} onChange={e => {
                    const on = e.target.checked;
                    setForm(f => ({
                      ...f,
                      hasVariants: on,
                      variants: on && f.variants.length === 0 ? [emptyVariant()] : f.variants,
                    }));
                    // Switch to variants tab when enabling, back to basic when disabling
                    if (on) setTab("variants");
                    else setTab("basic");
                  }} className="h-4 w-4 rounded border-slate-300 text-sky-700" />
                  <span className="text-sm font-semibold text-slate-700">Has Multiple Variants</span>
                </label>
              </div>

              {/* Variants & Attributes explainer */}
              <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 space-y-3 text-xs text-slate-700">
                <p className="font-extrabold text-blue-800 text-sm">📦 What are Variants & Attributes?</p>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-blue-100 space-y-1">
                    <p className="font-extrabold text-slate-900">Variant = One buyable option</p>
                    <p className="text-slate-500 leading-relaxed">
                      Each variant has its own <strong>SKU, price, stock and images</strong>. Customer picks a variant to buy.
                    </p>
                    <div className="mt-2 space-y-1">
                      <p className="text-[10px] font-extrabold uppercase text-slate-400">Example — Biosafety Cabinet:</p>
                      <div className="flex flex-wrap gap-1">
                        {["2 Feet · ₹45,000 · Stock 5", "3 Feet · ₹65,000 · Stock 3", "4 Feet · ₹90,000 · Stock 2"].map(v => (
                          <span key={v} className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">{v}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-3 border border-blue-100 space-y-1">
                    <p className="font-extrabold text-slate-900">Attribute = What makes them different</p>
                    <p className="text-slate-500 leading-relaxed">
                      Attributes describe <strong>what varies</strong> (Width, Material). Values are the options (2ft, 3ft, SS304).
                    </p>
                    <div className="mt-2 space-y-1">
                      <p className="text-[10px] font-extrabold uppercase text-slate-400">Example:</p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-[10px] font-extrabold text-slate-600">Width →</span>
                          {["2ft", "3ft", "4ft", "6ft"].map(v => (
                            <span key={v} className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">{v}</span>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-[10px] font-extrabold text-slate-600">Material →</span>
                          {["SS 304", "SS 316"].map(v => (
                            <span key={v} className="bg-sky-50 text-sky-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-sky-200">{v}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                  <p className="font-extrabold text-emerald-800 text-[10px] uppercase tracking-wider mb-1">How to use together:</p>
                  <p className="text-emerald-700 leading-relaxed">
                    1. Enable "Has Multiple Variants" → go to Variants tab → create each variant (e.g. "2ft SS304", "3ft SS316").<br />
                    2. Use the "Manage Attributes" panel on the right to create attributes + values.<br />
                    3. In each variant, click attribute values to tag that variant (e.g. tag "2ft" + "SS304" on Variant 1).
                  </p>
                </div>

                {!form.hasVariants && (
                  <p className="text-[10px] text-slate-400 italic">
                    ☝ If your product has only one size/version, keep this off. Use variants only when different options have different prices or stock.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── RELATIONS ── */}
          {tab === "relations" && (
            <div className="space-y-6">
              {/* Categories — step 1 */}
              <div>
                <Label>Categories (select one or more)</Label>
                <div className="rounded-xl border border-slate-200 divide-y max-h-52 overflow-y-auto">
                  {allCategories.length === 0 ? (
                    <p className="p-3 text-xs text-slate-400 italic">No categories yet. Create categories first.</p>
                  ) : allCategories.map((cat: any) => (
                    <label key={cat.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer">
                      <input type="checkbox"
                        checked={form.categoryIds.includes(cat.id)}
                        onChange={e => {
                          const ids = e.target.checked ? [...form.categoryIds, cat.id] : form.categoryIds.filter(x => x !== cat.id);
                          // Remove sub-categories of deselected category
                          const subsToRemove = !e.target.checked ? allSubCategories.filter((s: any) => s.categoryId === cat.id).map((s: any) => s.id) : [];
                          setForm(f => ({
                            ...f,
                            categoryIds: ids,
                            subCategoryIds: f.subCategoryIds.filter(s => !subsToRemove.includes(s)),
                          }));
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-sky-700" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{cat.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{cat.description || cat.slug}</p>
                      </div>
                      {form.categoryIds.includes(cat.id) && <IconCheck size={14} className="text-sky-600 shrink-0" />}
                    </label>
                  ))}
                </div>
                {form.categoryIds.length > 0 && <p className="text-[10px] text-sky-600 font-bold mt-1">{form.categoryIds.length} selected</p>}
              </div>

              {/* Sub-categories — filtered by selected categories */}
              <div>
                <Label>Sub-Categories {form.categoryIds.length === 0 && <span className="text-slate-300 ml-1">(select category first)</span>}</Label>
                {filteredSubs.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-400 italic text-center">
                    {form.categoryIds.length === 0 ? "Select a category above to see sub-categories" : "No sub-categories in selected categories"}
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 divide-y max-h-40 overflow-y-auto">
                    {filteredSubs.map((sub: any) => (
                      <label key={sub.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer">
                        <input type="checkbox"
                          checked={form.subCategoryIds.includes(sub.id)}
                          onChange={e => {
                            const ids = e.target.checked ? [...form.subCategoryIds, sub.id] : form.subCategoryIds.filter(x => x !== sub.id);
                            setForm(f => ({ ...f, subCategoryIds: ids }));
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-sky-700" />
                        <p className="text-xs font-semibold text-slate-800 flex-1">{sub.name}</p>
                        {form.subCategoryIds.includes(sub.id) && <IconCheck size={12} className="text-sky-600" />}
                      </label>
                    ))}
                  </div>
                )}
                {form.subCategoryIds.length > 0 && <p className="text-[10px] text-sky-600 font-bold mt-1">{form.subCategoryIds.length} sub-categories selected</p>}
              </div>

              {/* Industries */}
              <div>
                <Label>Industries (optional)</Label>
                <div className="grid grid-cols-2 gap-1">
                  {allIndustries.map((ind: any) => (
                    <label key={ind.id} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 hover:bg-slate-50 cursor-pointer">
                      <input type="checkbox"
                        checked={form.industryIds.includes(ind.id)}
                        onChange={e => {
                          const ids = e.target.checked ? [...form.industryIds, ind.id] : form.industryIds.filter(x => x !== ind.id);
                          setForm(f => ({ ...f, industryIds: ids }));
                        }}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-sky-700" />
                      <span className="text-xs font-semibold text-slate-700 truncate">{ind.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── SEO ── */}
          {tab === "seo" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-700">SEO Metadata</p>
                <button type="button" onClick={autoFillSeo}
                  className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1.5 rounded-lg hover:bg-sky-100 transition flex items-center gap-1.5">
                  <IconInfoCircle size={12} /> Auto-fill from product data
                </button>
              </div>
              <div>
                <Label>Meta Title</Label>
                <input value={form.metaTitle} onChange={e => setForm(f => ({ ...f, metaTitle: e.target.value }))} className={inputCls} placeholder={form.name || "Page title for search engines"} />
                <p className="text-[10px] text-slate-400 mt-1">{form.metaTitle.length}/60 chars (ideal)</p>
              </div>
              <div>
                <Label>Meta Description</Label>
                <textarea value={form.metaDescription} onChange={e => setForm(f => ({ ...f, metaDescription: e.target.value }))}
                  rows={3} className={`${inputCls} resize-none`} placeholder={`Browse ${form.name || "this product"} — high-specification cleanroom equipment.`} />
                <p className="text-[10px] text-slate-400 mt-1">{form.metaDescription.length}/160 chars (ideal)</p>
              </div>
              <div>
                <Label>Canonical URL (optional override)</Label>
                <input value={form.canonicalUrl} onChange={e => setForm(f => ({ ...f, canonicalUrl: e.target.value }))} className={inputCls} placeholder="https://radiantraysindia.com/products/slug" />
              </div>
              {/* Preview */}
              {(form.metaTitle || form.name) && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1">
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Search Preview</p>
                  <p className="text-[#1a0dab] text-sm font-medium hover:underline cursor-pointer">{form.metaTitle || form.name} | Radiant Rays Pvt. Ltd.</p>
                  <p className="text-xs text-slate-500 line-clamp-2">{form.metaDescription || form.shortDescription?.replace(/<[^>]*>/g, "") || `High-specification cleanroom containment systems.`}</p>
                </div>
              )}
            </div>
          )}

          {/* ── MEDIA (product-level) ── */}
          {tab === "media" && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Product Images (max 5) {form.images.length === 0 && <span className="text-rose-500 ml-1">*required</span>}</Label>
                  <span className="text-[10px] text-slate-400">Drag to reorder · First = Primary</span>
                </div>
                <ProductImageUploader
                  images={form.images.slice(0, 5)}
                  onChange={imgs => setForm(f => ({ ...f, images: imgs.slice(0, 5) }))}
                  showToast={showToast}
                />
              </div>

              {/* Documents */}
              <div className="pt-4 border-t border-slate-100">
                <ProductDocUploader
                  documents={form.documents}
                  onChange={docs => setForm(f => ({ ...f, documents: docs }))}
                  showToast={showToast}
                />
              </div>
            </div>
          )}

          {/* ── VARIANTS ── */}
          {tab === "variants" && form.hasVariants && (() => {
            // Cartesian product helper
            const cartesian = (arrays: string[][]): string[][] => {
              if (!arrays.length) return [[]];
              const [first, ...rest] = arrays;
              const restProduct = cartesian(rest);
              return first.flatMap(v => restProduct.map(r => [v, ...r]));
            };

            // Which attribute ids are selected for this product
            const selectedAttrIds: string[] = (form as any).selectedAttributeIds || [];

            const setSelectedAttrIds = (ids: string[]) => {
              setForm(f => ({ ...f, selectedAttributeIds: ids } as any));
            };

            // Selected attributes (full objects)
            const selectedAttrs = allAttributes.filter((a: any) => selectedAttrIds.includes(a.id));
            const slugPrefix = (form.slug || form.name)
              .toUpperCase()
              .replace(/[^A-Z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "")
              .slice(0, 12) || "PROD";

            const getComboKey = (ids: string[]) => ids.slice().sort().join("|");

            // Generate all variant combinations from selected attributes
            const generateVariants = () => {
              if (!selectedAttrs.length) {
                showToast("Select at least one attribute first", "error");
                return;
              }

              const valArrays: { attrName: string; valueId: string; valueName: string }[][] =
                selectedAttrs.map((attr: any) =>
                  (attr.values || []).map((v: any) => ({ attrName: attr.name, valueId: v.id, valueName: v.value }))
                ).filter((arr: any[]) => arr.length > 0);

              if (valArrays.some(arr => arr.length === 0)) {
                showToast("Some selected attributes have no values. Add values on the Attributes page first.", "error");
                return;
              }

              const combinations = cartesian(valArrays as any[][]);
              const existingByKey = new Map(
                form.variants.map((variant) => [getComboKey(variant.attributeValueIds || []), variant])
              );

              const newVariants: Variant[] = combinations.map((combo: any[], ci: number) => {
                const name = combo.map((c: any) => c.valueName).join(" / ");
                const attrValueIds = combo.map((c: any) => c.valueId);
                const skuSuffix = combo
                  .map((c: any) => c.valueName.toUpperCase().replace(/[^A-Z0-9]/g, ""))
                  .filter(Boolean)
                  .join("-");
                const sku = `${slugPrefix}-${skuSuffix || "VAR"}`;
                const existing = existingByKey.get(getComboKey(attrValueIds));

                if (existing) {
                  return {
                    ...existing,
                    name,
                    sku: existing.sku || sku,
                    attributeValueIds: attrValueIds,
                  };
                }

                return {
                  ...emptyVariant(),
                  name,
                  sku,
                  attributeValueIds: attrValueIds,
                  isDefault: ci === 0,
                };
              });

              setForm(f => ({ ...f, variants: newVariants }));
              setActiveVariantIdx(0);
              showToast(`${newVariants.length} variants generated`, "success");
            };

            return (
              <div className="space-y-6">
                {/* Step 1: Select Attributes */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-extrabold text-slate-900">Step 1 — Select Attributes</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Choose the attribute groups used by this product. The form will build every value combination automatically.
                      </p>
                    </div>
                    <a
                      href="/attributes"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-sky-700 bg-sky-50 px-3 py-1.5 rounded-xl hover:bg-sky-100 transition whitespace-nowrap"
                    >
                      + Manage Attributes ↗
                    </a>
                  </div>

                  {allAttributes.length === 0 ? (
                    <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-700 font-semibold">
                      No attributes exist yet.{" "}
                      <a href="/attributes" target="_blank" className="underline">Create attributes first</a>
                      {" "}(for example: Color → Red, Blue; Size → S, M, L)
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                      {allAttributes.map((attr: any) => {
                        const isSelected = selectedAttrIds.includes(attr.id);
                        return (
                          <label
                            key={attr.id}
                            className={`flex items-start gap-3 rounded-xl border-2 p-3 cursor-pointer transition ${isSelected ? "border-sky-500 bg-sky-50" : "border-slate-200 hover:border-sky-300"}`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={e => {
                                const ids = e.target.checked
                                  ? [...selectedAttrIds, attr.id]
                                  : selectedAttrIds.filter((id: string) => id !== attr.id);
                                setSelectedAttrIds(ids);
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-sky-600 mt-0.5 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-800">{attr.name}</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(attr.values || []).slice(0, 5).map((v: any) => (
                                  <span key={v.id} className="text-[10px] font-semibold bg-white border border-slate-200 rounded-full px-2 py-0.5 text-slate-600">
                                    {v.value}
                                  </span>
                                ))}
                                {(attr.values || []).length > 5 && (
                                  <span className="text-[10px] text-slate-400">+{attr.values.length - 5} more</span>
                                )}
                                {(attr.values || []).length === 0 && (
                                  <span className="text-[10px] text-amber-600 italic">No values yet</span>
                                )}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {selectedAttrIds.length > 0 && (
                    <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                      <div className="flex-1 text-xs text-slate-600">
                        <strong>{selectedAttrs.reduce((acc: number, a: any) => acc * Math.max(a.values?.length || 0, 1), 1)}</strong> combination{selectedAttrs.reduce((acc: number, a: any) => acc * Math.max(a.values?.length || 0, 1), 1) !== 1 ? "s" : ""} will be generated from <strong>{selectedAttrs.map((a: any) => a.name).join(" × ")}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={generateVariants}
                        className="inline-flex items-center gap-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold px-4 py-2.5 transition"
                      >
                        <IconCheck size={14} />
                        Generate Variants from Attributes
                      </button>
                    </div>
                  )}
                </div>

                {/* Step 2: Variant Cards */}
                {form.variants.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-extrabold text-slate-900">Step 2 — Configure Variants ({form.variants.length})</p>
                      <button
                        type="button"
                        onClick={addVariant}
                        className="text-[10px] font-bold text-sky-700 bg-sky-50 px-3 py-1.5 rounded-xl hover:bg-sky-100 transition flex items-center gap-1"
                      >
                        <IconPlus size={11} /> Add Manual Variant
                      </button>
                    </div>

                    {/* Variant selector tabs */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {form.variants.map((v, i) => (
                        <button key={i} type="button" onClick={() => setActiveVariantIdx(i)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${activeVariantIdx === i ? "bg-sky-700 text-white border-sky-700" : "border-slate-200 text-slate-600 hover:border-sky-300 bg-white"}`}>
                          {v.name || `Variant ${i + 1}`}
                          {v.isDefault && <span className="ml-1 text-[8px] opacity-70">●</span>}
                        </button>
                      ))}
                    </div>

                    {/* Active variant detail card */}
                    {form.variants[activeVariantIdx] && (() => {
                      const v = form.variants[activeVariantIdx];
                      const i = activeVariantIdx;

                      // Resolve attribute chips for this variant
                      const attrChips: { attrName: string; valueName: string }[] = [];
                      allAttributes.forEach((attr: any) => {
                        (attr.values || []).forEach((val: any) => {
                          if (v.attributeValueIds.includes(val.id)) {
                            attrChips.push({ attrName: attr.name, valueName: val.value });
                          }
                        });
                      });

                      return (
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-5">
                          {/* Variant header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Variant {i + 1}</span>
                                {attrChips.map((chip, ci) => (
                                  <span key={ci} className="inline-flex items-center gap-1 text-[10px] font-bold rounded-full bg-sky-100 text-sky-800 px-2.5 py-0.5">
                                    <span className="text-sky-500">{chip.attrName}:</span> {chip.valueName}
                                  </span>
                                ))}
                              </div>
                              <div className="flex items-center gap-3 flex-wrap">
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 cursor-pointer">
                                  <input type="checkbox" checked={v.isDefault} onChange={e => {
                                    setForm(f => ({
                                      ...f,
                                      variants: f.variants.map((x, j) => ({ ...x, isDefault: j === i ? e.target.checked : false })),
                                    }));
                                  }} className="h-3.5 w-3.5 rounded" />
                                  Default variant
                                </label>
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 cursor-pointer">
                                  <input type="checkbox" checked={v.isActive} onChange={e => updateVariant(i, "isActive", e.target.checked)} className="h-3.5 w-3.5 rounded" />
                                  Active
                                </label>
                              </div>
                            </div>
                            {form.variants.length > 1 && (
                              <button type="button" onClick={() => removeVariant(i)}
                                className="h-8 w-8 flex items-center justify-center rounded-xl border border-rose-100 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition shrink-0">
                                <IconTrash size={13} />
                              </button>
                            )}
                          </div>

                          {/* Core fields */}
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                              <Label>Variant Name *</Label>
                              <input value={v.name} onChange={e => updateVariant(i, "name", e.target.value)} required className={inputCls} placeholder="e.g. Red / M or 3 Feet" />
                            </div>
                            <div>
                              <Label>SKU (auto-generated if blank)</Label>
                              <input value={v.sku} onChange={e => updateVariant(i, "sku", e.target.value)} className={`${inputCls} font-mono text-xs`} placeholder="Auto-generated from name" />
                              <p className="text-[10px] text-slate-400 mt-1">Leave blank to auto-generate on save</p>
                            </div>

                            {/* B2C prices */}
                            {form.productType === "B2C" && (
                              <>
                                <div>
                                  <Label>MRP / Base Price (₹) *</Label>
                                  <input type="number" min="1" value={v.price} onChange={e => updateVariant(i, "price", e.target.value)} className={inputCls} placeholder="Original price" />
                                </div>
                                <div>
                                  <Label>Sale Price (₹) — optional</Label>
                                  <input
                                    type="number" min="1"
                                    value={v.salePrice}
                                    onChange={e => updateVariant(i, "salePrice", e.target.value)}
                                    className={`${inputCls} ${v.salePrice && Number(v.salePrice) >= Number(v.price) ? "border-rose-400 bg-rose-50" : ""}`}
                                    placeholder="Must be less than MRP"
                                  />
                                  {v.salePrice && Number(v.salePrice) >= Number(v.price) && (
                                    <p className="text-[10px] text-rose-600 font-bold mt-1">⚠ Sale price must be less than MRP (₹{v.price})</p>
                                  )}
                                  {v.salePrice && Number(v.salePrice) > 0 && Number(v.salePrice) < Number(v.price) && (
                                    <p className="text-[10px] text-emerald-600 font-semibold mt-1">
                                      ✓ {Math.round((1 - Number(v.salePrice) / Number(v.price)) * 100)}% discount
                                    </p>
                                  )}
                                </div>
                              </>
                            )}
                            {form.productType === "B2B" && (
                              <div className="sm:col-span-2 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5 text-xs text-amber-700 font-semibold">
                                B2B product — price negotiated on quotation, not shown here
                              </div>
                            )}

                            <div>
                              <Label>Stock (units)</Label>
                              <input type="number" min="0" value={v.stock} onChange={e => updateVariant(i, "stock", Number(e.target.value))} className={inputCls} />
                            </div>
                          </div>

                          {/* Attribute values selector — for manual assignment / override */}
                          {allAttributes.length > 0 && (
                            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                                Attribute Values — Tagged to this variant
                              </p>
                              <p className="text-[10px] text-slate-400">Click to toggle which attribute values describe this variant option.</p>
                              <div className="space-y-2">
                                {allAttributes.map((attr: any) => (
                                  <div key={attr.id} className="flex items-start gap-2">
                                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide w-20 shrink-0 mt-1">{attr.name}</span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {(attr.values || []).map((val: any) => {
                                        const selected = v.attributeValueIds.includes(val.id);
                                        return (
                                          <button
                                            key={val.id}
                                            type="button"
                                            onClick={() => {
                                              const ids = selected
                                                ? v.attributeValueIds.filter((id: string) => id !== val.id)
                                                : [...v.attributeValueIds, val.id];
                                              updateVariant(i, "attributeValueIds", ids);
                                            }}
                                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${selected ? "bg-sky-700 text-white border-sky-700" : "border-slate-200 text-slate-600 bg-white hover:border-sky-300"}`}
                                          >
                                            {val.value}
                                          </button>
                                        );
                                      })}
                              {(attr.values || []).length === 0 && (
                                        <span className="text-[10px] text-slate-400 italic">No values</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Variant images */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Label>Variant Images (max 5)</Label>
                              <span className="text-[10px] text-slate-400">Drag to reorder</span>
                            </div>
                            <ProductImageUploader
                              images={(v.images || []).slice(0, 5)}
                              onChange={imgs => updateVariant(i, "images", imgs.slice(0, 5))}
                              showToast={showToast}
                            />
                          </div>

                          {/* Variant documents */}
                          <div className="pt-4 border-t border-slate-100">
                            <ProductDocUploader
                              documents={v.documents || []}
                              onChange={docs => updateVariant(i, "documents", docs)}
                              showToast={showToast}
                            />
                          </div>

                          {/* Technical Specifications */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Label>Technical Specifications</Label>
                              <button type="button" onClick={() => {
                                updateVariant(i, "specification", { ...v.specification, "": "" });
                              }} className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg hover:bg-sky-100 flex items-center gap-1">
                                <IconPlus size={10} /> Add Row
                              </button>
                            </div>
                            <div className="space-y-2">
                              {Object.entries(v.specification).map(([k, val], si) => (
                                <div key={si} className="flex gap-2">
                                  <input value={k} onChange={e => {
                                    const s: Record<string, string> = {};
                                    Object.entries(v.specification).forEach(([ok, ov], oi) => { s[oi === si ? e.target.value : ok] = String(ov); });
                                    updateVariant(i, "specification", s);
                                  }} placeholder="Label" className={`${inputCls} flex-1`} />
                                  <input value={String(val)} onChange={e => {
                                    updateVariant(i, "specification", { ...v.specification, [k]: e.target.value });
                                  }} placeholder="Value" className={`${inputCls} flex-1`} />
                                  <button type="button" onClick={() => {
                                    const s = { ...v.specification }; delete s[k]; updateVariant(i, "specification", s);
                                  }} className="text-slate-400 hover:text-rose-600"><IconX size={13} /></button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── LOGISTICS ── */}
          {tab === "logistics" && (
            <div className="space-y-5">
              {form.hasVariants ? (
                <>
                  {/* Per-variant logistics */}
                  <p className="text-xs text-slate-500 bg-sky-50 border border-sky-100 rounded-xl px-4 py-3">Logistics are set per variant. Select a variant below.</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {form.variants.map((v, i) => (
                      <button key={i} type="button" onClick={() => setActiveVariantIdx(i)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${activeVariantIdx === i ? "bg-sky-700 text-white border-sky-700" : "border-slate-200 text-slate-600"}`}>
                        {v.name || `Variant ${i + 1}`}
                      </button>
                    ))}
                  </div>
                  {form.variants[activeVariantIdx] && (() => {
                    const v = form.variants[activeVariantIdx]; const i = activeVariantIdx;
                    return (
                      <div className="rounded-xl border border-slate-200 p-4 space-y-4">
                        <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Variant: {v.name || `#${i + 1}`}</p>
                        <LogisticsFields
                          weight={v.weight} length={v.length} width={v.width} height={v.height}
                          hsn={v.hsn} packageDetails={v.packageDetails}
                          onChange={(k, val) => updateVariant(i, k as any, val)}
                        />
                      </div>
                    );
                  })()}
                </>
              ) : (
                <LogisticsFields
                  weight={form.weight} length={form.length} width={form.width} height={form.height}
                  hsn={form.hsn} packageDetails={form.packageDetails}
                  onChange={(k, val) => setForm(f => ({ ...f, [k]: val }))}
                />
              )}
            </div>
          )}
        </div>

        {/* Sidebar summary */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Summary</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Type</span>
                <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] uppercase ${form.productType === "B2B" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{form.productType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className={`font-bold ${form.isActive ? "text-sky-700" : "text-slate-400"}`}>{form.isActive ? "Active" : "Inactive"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Variants</span>
                <span className="font-bold text-slate-700">{form.hasVariants ? form.variants.length : "No (single)"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Images</span>
                <span className={`font-bold ${form.images.length === 0 ? "text-rose-500" : "text-slate-700"}`}>{form.images.length}/5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Categories</span>
                <span className="font-bold text-slate-700">{form.categoryIds.length}</span>
              </div>
            </div>
          </div>

          {/* Attributes quick link */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Attributes</p>
            <p className="text-[11px] text-slate-500">Manage global attributes (Color, Size, Material) and their values.</p>
            <a
              href="/attributes"
              className="flex items-center justify-between rounded-xl bg-sky-50 border border-sky-100 px-3 py-2.5 hover:bg-sky-100 transition group"
            >
              <span className="text-xs font-bold text-sky-700">Open Attributes Page</span>
              <span className="text-sky-500 group-hover:translate-x-0.5 transition-transform">→</span>
            </a>
            {allAttributes.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {allAttributes.map((a: any) => (
                  <span key={a.id} className="text-[10px] font-bold rounded-full bg-slate-100 text-slate-600 px-2 py-0.5">{a.name}</span>
                ))}
              </div>
            )}
          </div>

          {/* Quick image preview */}
          {form.images.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">Primary Image</p>
              <div className="rounded-xl overflow-hidden border border-slate-100 bg-slate-50 aspect-square flex items-center justify-center">
                <img src={form.images[0].url} alt="" className="max-h-full max-w-full object-contain" />
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}

function LogisticsFields({ weight, length, width, height, hsn, packageDetails, onChange }: {
  weight: string; length: string; width: string; height: string; hsn: string; packageDetails: string;
  onChange: (key: string, val: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Weight (kg)</Label><input type="number" step="0.1" value={weight} onChange={e => onChange("weight", e.target.value)} className={inputCls} /></div>
        <div><Label>HSN Code</Label><input value={hsn} onChange={e => onChange("hsn", e.target.value)} className={inputCls} /></div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label>Length (cm)</Label><input type="number" value={length} onChange={e => onChange("length", e.target.value)} className={inputCls} /></div>
        <div><Label>Width (cm)</Label><input type="number" value={width} onChange={e => onChange("width", e.target.value)} className={inputCls} /></div>
        <div><Label>Height (cm)</Label><input type="number" value={height} onChange={e => onChange("height", e.target.value)} className={inputCls} /></div>
      </div>
      <div><Label>Package Description</Label><input value={packageDetails} onChange={e => onChange("packageDetails", e.target.value)} className={inputCls} placeholder="Standard Cleanroom Plywood Crate" /></div>
      {/* Volumetric weight */}
      <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-xs">
        <p className="text-slate-500 font-semibold">Volumetric Weight (Shiprocket)</p>
        <p className="font-extrabold text-slate-800 mt-0.5">
          {((Number(length || 10) * Number(width || 10) * Number(height || 10)) / 5000).toFixed(2)} kg
        </p>
        <p className="text-slate-400 text-[10px] mt-0.5">L×W×H ÷ 5000 = {Number(length || 10)}×{Number(width || 10)}×{Number(height || 10)} ÷ 5000</p>
      </div>
    </div>
  );
}

