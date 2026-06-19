import Link from "next/link";
import { Metadata } from "next";
import { GlobalShell } from "@/components/global-shell";

export const metadata: Metadata = {
  title: "Careers | Radiant Rays India",
  description: "Join the Radiant Rays team. Explore open positions in safety, operations, engineering and more.",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

const JOB_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full Time",
  PART_TIME: "Part Time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
  REMOTE: "Remote",
};

async function getJobs() {
  try {
    const res = await fetch(`${API_URL}/careers`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

export default async function CareersPage() {
  const jobs: any[] = await getJobs();

  return (
    <GlobalShell>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-brand-dark -mx-4 sm:-mx-6 lg:-mx-8 -mt-8 px-4 sm:px-6 lg:px-8 py-16 sm:py-20 mb-10">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 bg-brand/20 text-brand border border-brand/30 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-4">
            We&#39;re Hiring
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">
            Build a Safer World<br className="hidden sm:block" /> with Radiant Rays
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Join our growing team dedicated to manufacturing world-class safety and cleanroom equipment for India and beyond.
          </p>
        </div>
      </section>

      {/* Jobs */}
      <section className="max-w-3xl mx-auto pb-16">
        {jobs.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">💼</div>
            <h2 className="text-xl font-bold text-slate-700 mb-2">No open positions right now</h2>
            <p className="text-slate-500 text-sm">Check back soon — we&#39;re always growing.</p>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-extrabold text-slate-800 mb-5">
              {jobs.length} Open Position{jobs.length !== 1 ? "s" : ""}
            </h2>
            <div className="space-y-4">
              {jobs.map((job: any) => (
                <Link key={job.id} href={`/careers/${job.slug}`}
                  className="group block rounded-2xl border border-slate-200 bg-white hover:border-brand/50 hover:shadow-md transition-all duration-200 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-extrabold text-slate-900 text-base group-hover:text-brand transition-colors truncate">
                        {job.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          {job.location}
                        </span>
                        {job.experience && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {job.experience}
                          </span>
                        )}
                        {job.department && (
                          <span className="text-xs text-slate-500">{job.department}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-700">
                          {JOB_TYPE_LABELS[job.type] || job.type}
                        </span>
                        {job.salaryMin && job.salaryMax && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                            ₹{(job.salaryMin / 100000).toFixed(1)}L – ₹{(job.salaryMax / 100000).toFixed(1)}L / yr
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center justify-center h-9 w-9 rounded-xl bg-slate-100 group-hover:bg-brand group-hover:text-white transition-all duration-200 text-slate-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </GlobalShell>
  );
}
