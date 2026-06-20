import type { Metadata } from "next";
import { Suspense } from "react";
import { IndustryDetailClient } from "./_client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
const BASE_URL = "https://radiantraysindia.com";

async function getIndustry(slug: string) {
  try {
    const res = await fetch(`${API_URL}/public/industries`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json();
    const inds: any[] = json.data || [];
    return inds.find((i: any) => i.slug === slug) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const industry = await getIndustry(params.slug);
  const name = industry?.name || params.slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const description = industry?.description || industry?.summary ||
    `Radiant Rays supplies ISO-certified cleanroom containment systems for ${name}. Custom biosafety cabinets, pass boxes, air showers and more.`;

  const title = `${name} Cleanroom Solutions | Radiant Rays Pvt. Ltd.`;
  const url = `${BASE_URL}/industries/${params.slug}`;
  const image = industry?.imageUrl || `${BASE_URL}/og-default.jpg`;

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

export default function IndustryPage({ params }: { params: { slug: string } }) {
  return (
    <Suspense fallback={
      <div className="animate-pulse space-y-6 my-8">
        <div className="h-6 bg-slate-200 rounded w-1/4" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="bg-slate-200 h-64 rounded-2xl" />)}
        </div>
      </div>
    }>
      <IndustryDetailClient params={params} />
    </Suspense>
  );
}
