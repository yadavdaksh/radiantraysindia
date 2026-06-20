import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { Tag } from "lucide-react";
import { industries as mockIndustries } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Industries We Serve | Cleanroom Solutions | Radiant Rays India",
  description: "Radiant Rays serves pharma, biotech, healthcare, electronics, and food industries with ISO-certified cleanroom containment systems. Explore industry applications.",
  alternates: { canonical: "https://radiantraysindia.com/industries" },
  openGraph: {
    title: "Industries We Serve | Radiant Rays India",
    description: "Cleanroom solutions for pharma, biotech, healthcare, electronics, and food industries.",
    url: "https://radiantraysindia.com/industries",
    type: "website",
    siteName: "Radiant Rays India",
  },
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

async function getIndustries() {
  try {
    const res = await fetch(`${API_URL}/public/industries`, { cache: "no-store" });
    if (!res.ok) throw new Error("failed");
    const json = await res.json();
    return json.data as any[];
  } catch {
    try {
      const res = await fetch(`${API_URL}/industries`, { cache: "no-store" });
      if (!res.ok) throw new Error("failed");
      const json = await res.json();
      return json.data as any[];
    } catch {
      return mockIndustries.map((c) => ({
        id: c.slug,
        name: c.name,
        slug: c.slug,
        description: c.summary,
      }));
    }
  }
}

export const metadata = {
  title: "Industries",
  description: "Industry-specific cleanroom use cases for Radiant Rays products.",
};

export default async function IndustriesPage() {
  const industriesList = await getIndustries();

  return (
    <SiteShell
      title="Industries"
      subtitle="Target industries, operational workflows and sector-specific cleanroom needs."
    >
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {industriesList.map((industry) => (
          <Link
            href={`/industries/${industry.slug}`}
            key={industry.slug}
            className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-[0_20px_70px_rgba(3,95,150,0.12)] flex items-start gap-4"
          >
            <div className="h-12 w-12 shrink-0 rounded-2xl bg-brand/10 overflow-hidden flex items-center justify-center transition group-hover:bg-brand/15">
              {industry.imageUrl ? (
                <img
                  src={industry.imageUrl}
                  alt={industry.name}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              ) : (
                <Tag className="h-5 w-5 text-brand" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-slate-950 group-hover:text-brand transition duration-200">
                {industry.name}
              </h2>
              <p className="mt-2 leading-6 text-sm text-slate-600 line-clamp-3">
                {industry.description || industry.summary || "View specifications and custom solutions for this industry."}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </SiteShell>
  );
}
