"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";

const JOB_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full Time",
  PART_TIME: "Part Time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
  REMOTE: "Remote",
};

export default function CareersPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/careers")
      .then(r => setJobs(r.data.data || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-[#012a3a] -mx-4 sm:-mx-6 lg:-mx-8 -mt-8 px-4 sm:px-6 lg:px-8 py-16 sm:py-24 mb-10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(3,95,150,0.25),transparent_70%)]" />
        <div className="relative max-w-2xl mx-auto text-center space-y-5">
          <span className="inline-flex items-center gap-2 bg-brand/20 text-brand-light border border-brand/30 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest">
            <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
            We&#39;re Hiring
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight">
            Build a Safer World<br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-brand-light via-sky-300 to-white bg-clip-text text-transparent"> with Radiant Rays</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
            Join our growing team dedicated to manufacturing world-class safety and cleanroom equipment for India and beyond.
          </p>
          <div className="pt-2">
            <a href="#jobs" className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-xs font-bold text-white hover:bg-brand-dark transition shadow-lg shadow-brand/20">
              View Open Positions
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </a>
          </div>
        </div>
      </section>

      {/* Why join */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-12">
        {[
          { icon: "🏭", title: "Manufacturing Excellence", desc: "ISO-certified factory" },
          { icon: "🌍", title: "Pan-India Impact", desc: "28 states served" },
          { icon: "🚀", title: "Fast Growth", desc: "500+ clients & growing" },
          { icon: "🤝", title: "Great Culture", desc: "Engineering-first team" },
        ].map(item => (
          <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <div className="text-2xl mb-2">{item.icon}</div>
            <p className="text-xs font-extrabold text-slate-800">{item.title}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
          </div>
        ))}
      </section>

      {/* Jobs */}
      <section id="jobs" className="pb-16 scroll-mt-6">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 rounded-3xl border border-dashed border-slate-200 bg-slate-50">
            <div className="text-5xl mb-4">💼</div>
            <h2 className="text-xl font-bold text-slate-700 mb-2">No open positions right now</h2>
            <p className="text-slate-500 text-sm">Check back soon — we&#39;re always growing.</p>
            <Link href="/contact"
              className="inline-flex items-center gap-1.5 mt-5 text-sm font-bold text-brand hover:underline">
              Send a speculative application →
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-extrabold text-slate-900">
                Open Positions
                <span className="ml-2 inline-flex items-center justify-center h-6 px-2.5 rounded-full bg-brand text-white text-xs font-bold">
                  {jobs.length}
                </span>
              </h2>
            </div>
            <div className="space-y-3">
              {jobs.map((job: any) => (
                <Link key={job.id} href={`/careers/${job.slug}`}
                  className="group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200 bg-white hover:border-brand/40 hover:shadow-md transition-all duration-200 p-4 sm:p-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="font-extrabold text-slate-900 text-base group-hover:text-brand transition-colors">
                        {job.title}
                      </h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700">
                        {JOB_TYPE_LABELS[job.type] || job.type}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {job.location}
                      </span>
                      {job.experience && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {job.experience}
                        </span>
                      )}
                      {job.department && <span>{job.department}</span>}
                      {job.salaryMin > 0 && job.salaryMax > 0 && (
                        <span className="font-semibold text-emerald-600">
                          ₹{(job.salaryMin / 100000).toFixed(1)}L – ₹{(job.salaryMax / 100000).toFixed(1)}L/yr
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 self-end sm:self-center flex items-center gap-2">
                    <span className="text-xs font-bold text-brand group-hover:underline hidden sm:inline">Apply Now</span>
                    <div className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-100 group-hover:bg-brand group-hover:text-white transition-all duration-200 text-slate-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
