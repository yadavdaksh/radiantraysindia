import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { industries } from "@/lib/site-data";

export const metadata = {
  title: "Industries",
  description: "Industry-specific cleanroom use cases for Radiant Rays products.",
};

export default function IndustriesPage() {
  return (
    <SiteShell
      title="Industries"
      subtitle="Target industries, operational workflows and sector-specific cleanroom needs."
    >
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {industries.map((industry) => (
          <Link
            href={`/industries/${industry.slug}`}
            key={industry.slug}
            className="rounded-[1.75rem] border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-[0_20px_70px_rgba(3,95,150,0.12)]"
          >
            <h2 className="text-xl font-semibold text-slate-950">{industry.name}</h2>
            <p className="mt-3 leading-7 text-slate-600">{industry.summary}</p>
          </Link>
        ))}
      </div>
    </SiteShell>
  );
}

