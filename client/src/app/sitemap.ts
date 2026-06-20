import type { MetadataRoute } from "next";

const BASE_URL = "https://radiantraysindia.com";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

async function fetchSlugs(path: string, key: string): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    const items: any[] = json.data || [];
    return items.map((i: any) => i[key]).filter(Boolean);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productSlugs, categorySlugs, industrySlugs] = await Promise.all([
    fetchSlugs("/public/products?limit=500", "slug"),
    fetchSlugs("/public/categories", "slug"),
    fetchSlugs("/public/industries", "slug"),
  ]);

  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL,                              lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE_URL}/products`,                lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE_URL}/categories`,              lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE_URL}/industries`,              lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE_URL}/about`,                   lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/contact`,                 lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/gallery`,                 lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/careers`,                 lastModified: now, changeFrequency: "weekly",  priority: 0.5 },
    { url: `${BASE_URL}/privacy-policy`,          lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE_URL}/terms-and-conditions`,    lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE_URL}/refund-policy`,           lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE_URL}/shipping-policy`,         lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
  ];

  const productPages: MetadataRoute.Sitemap = productSlugs.map((slug) => ({
    url: `${BASE_URL}/products/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const categoryPages: MetadataRoute.Sitemap = categorySlugs.map((slug) => ({
    url: `${BASE_URL}/categories/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.75,
  }));

  const industryPages: MetadataRoute.Sitemap = industrySlugs.map((slug) => ({
    url: `${BASE_URL}/industries/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticPages, ...productPages, ...categoryPages, ...industryPages];
}
