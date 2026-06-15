import Link from "next/link";
import { gallery as mockGallery } from "@/lib/site-data";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4002/api/v1";

async function getGallery() {
  try {
    const res = await fetch(`${API_URL}/public/gallery`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("failed");
    const json = await res.json();
    return (json.data?.items || json.data || []) as any[];
  } catch {
    return mockGallery.map((g, i) => ({
      id: String(i),
      title: g.title,
      category: g.category,
      description: g.description,
      imageUrl: null,
    }));
  }
}

export const metadata = {
  title: "Gallery — Radiant Rays",
  description: "Project installations, manufacturing floor and client delivery snapshots.",
};

export default async function GalleryPage() {
  const items = await getGallery();

  return (
    <div className="space-y-8 my-6">
      {/* Header */}
      <div className="space-y-2">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-brand">Gallery</span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Project Gallery</h1>
        <p className="text-sm text-slate-500 max-w-xl">
          Installation, manufacturing, and delivery snapshots from real cleanroom projects across India.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-16 border border-dashed border-slate-200 bg-white rounded-2xl">
          <p className="text-sm text-slate-500">No gallery items added yet.</p>
          <p className="text-xs text-slate-400 mt-1">Admin can add gallery images from the admin panel.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item: any) => (
            <article
              key={item.id}
              className="group rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              {/* Image */}
              {item.imageUrl ? (
                <div className="aspect-[4/3] overflow-hidden bg-slate-50">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>
              ) : (
                <div className="aspect-[4/3] bg-gradient-to-br from-brand/12 to-slate-200/60 flex items-center justify-center">
                  <span className="text-xs font-bold text-brand/50 uppercase tracking-wider">
                    {item.category || "Gallery"}
                  </span>
                </div>
              )}

              {/* Info */}
              <div className="p-5 space-y-1.5">
                {item.category && (
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-brand">
                    {item.category}
                  </span>
                )}
                <h2 className="font-extrabold text-slate-950 text-sm leading-snug">{item.title}</h2>
                {item.description && (
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{item.description}</p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="rounded-2xl bg-brand/5 border border-brand/15 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-bold text-slate-900 text-sm">Interested in our work?</p>
          <p className="text-xs text-slate-500 mt-0.5">Get in touch to discuss your cleanroom project requirements.</p>
        </div>
        <Link
          href="/contact"
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-dark transition shrink-0"
        >
          Contact Us →
        </Link>
      </div>
    </div>
  );
}
