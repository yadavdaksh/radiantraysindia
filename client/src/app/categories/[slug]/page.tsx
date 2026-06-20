import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoryDetailClient } from "./_client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
const BASE_URL = "https://radiantraysindia.com";

async function getCategory(slug: string) {
  try {
    const res = await fetch(`${API_URL}/public/categories`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json();
    const cats: any[] = json.data || [];
    return cats.find((c: any) => c.slug === slug) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const category = await getCategory(params.slug);
  const name = category?.name || params.slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const description = category?.description ||
    `Browse ${name} cleanroom systems from Radiant Rays Pvt. Ltd. — ISO certified biosafety cabinets, laminar flow units, and containment solutions.`;

  const title = `${name} | Cleanroom Equipment | Radiant Rays Pvt. Ltd.`;
  const url = `${BASE_URL}/categories/${params.slug}`;
  const rawImage = category?.imageUrl;
  const image = rawImage
    ? rawImage.startsWith("http") ? rawImage : `${BASE_URL}${rawImage}`
    : `${BASE_URL}/logo.png`;

  return {
    title,
    description: description.slice(0, 160),
    alternates: { canonical: url },
    openGraph: {
      title,
      description: description.slice(0, 160),
      url,
      type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: name }],
      siteName: "Radiant Rays Pvt. Ltd.",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description.slice(0, 160),
      images: [image],
    },
  };
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
  return (
    <Suspense fallback={
      <div className="space-y-6 my-6 animate-pulse">
        <div className="h-8 bg-slate-100 rounded w-64" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="rounded-2xl bg-slate-100 h-64" />)}
        </div>
      </div>
    }>
      <CategoryDetailClient params={params} />
    </Suspense>
  );
}
