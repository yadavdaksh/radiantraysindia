import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductDetailClient } from "./_client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
const BASE_URL = "https://radiantraysindia.com";

async function getProduct(slug: string) {
  try {
    const res = await fetch(`${API_URL}/public/products/${slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) {
    return { title: "Product Not Found | Radiant Rays" };
  }

  const title = `${product.name} | Radiant Rays Pvt. Ltd.`;
  const description = product.shortDescription
    ? product.shortDescription.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160)
    : `Buy ${product.name} from Radiant Rays — ISO 9001:2015 certified cleanroom equipment manufacturer. Get quote or buy online.`;

  const rawImage =
    product.images?.find((i: any) => i.isPrimary)?.url ||
    product.images?.[0]?.url ||
    product.variants?.[0]?.images?.[0]?.url ||
    product.variants?.find((v: any) => v.isDefault)?.images?.[0]?.url ||
    null;
  const image = rawImage
    ? rawImage.startsWith("http") ? rawImage : `${BASE_URL}${rawImage}`
    : `${BASE_URL}/logo.jpeg`;

  const url = `${BASE_URL}/products/${params.slug}`;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description,
    image,
    sku: product.sku,
    brand: { "@type": "Brand", name: "Radiant Rays" },
    url,
    ...(product.productType === "B2C" && product.basePrice
      ? {
        offers: {
          "@type": "Offer",
          price: product.salePrice || product.basePrice,
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
          url,
        },
      }
      : {
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
          priceSpecification: { "@type": "PriceSpecification", description: "Price on request" },
          url,
        },
      }),
  };

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: product.name }],
      siteName: "Radiant Rays Pvt. Ltd.",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    other: {
      "application/ld+json": JSON.stringify(productSchema),
    },
  };
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  return (
    <Suspense fallback={
      <div className="w-full animate-pulse">
        <div className="mb-8 space-y-2 mt-4">
          <div className="h-3 bg-slate-100 rounded w-24" />
          <div className="h-9 bg-slate-100 rounded w-64" />
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="bg-slate-100 min-h-[460px] rounded-3xl" />
          <div className="space-y-4">
            <div className="h-10 bg-slate-100 rounded w-2/3" />
            <div className="h-20 bg-slate-100 rounded" />
            <div className="h-12 bg-slate-100 rounded" />
          </div>
        </div>
      </div>
    }>
      <ProductDetailClient params={params} />
    </Suspense>
  );
}
