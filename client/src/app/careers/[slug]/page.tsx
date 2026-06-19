"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { GlobalShell } from "@/components/global-shell";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

const JOB_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full Time",
  PART_TIME: "Part Time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
  REMOTE: "Remote",
};

const emptyForm = { name: "", email: "", phone: "", resumeUrl: "", coverLetter: "" };

export default function CareerDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slug) return;
    apiClient.get(`/careers/${slug}`)
      .then(r => setJob(r.data.data))
      .catch(() => router.replace("/careers"))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.resumeUrl.trim()) {
      toast.error("Please fill all required fields");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Enter a valid email address");
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post(`/careers/${slug}/apply`, form);
      setSubmitted(true);
      toast.success("Application submitted! We'll be in touch.");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return (
      <GlobalShell>
        <div className="max-w-3xl mx-auto py-12 space-y-4 animate-pulse">
          <div className="h-8 bg-slate-200 rounded-xl w-2/3" />
          <div className="h-4 bg-slate-100 rounded-xl w-1/2" />
          <div className="h-48 bg-slate-100 rounded-2xl mt-6" />
        </div>
      </GlobalShell>
    );
  }

  if (!job) return null;

  return (
    <GlobalShell>
      <div className="max-w-3xl mx-auto py-6 pb-16">
        {/* Back */}
        <Link href="/careers" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand transition mb-6">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to all jobs
        </Link>

        {/* Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 mb-2">{job.title}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {job.location}
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-700">
                  {JOB_TYPE_LABELS[job.type] || job.type}
                </span>
                {job.department && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                    {job.department}
                  </span>
                )}
              </div>
            </div>
            <button onClick={scrollToForm}
              className="shrink-0 h-10 px-6 rounded-xl bg-brand text-white text-sm font-bold hover:bg-brand-dark transition shadow-sm">
              Apply Now
            </button>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-100">
            {job.experience && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Experience</p>
                <p className="text-sm font-semibold text-slate-700">{job.experience}</p>
              </div>
            )}
            {job.qualification && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Qualification</p>
                <p className="text-sm font-semibold text-slate-700">{job.qualification}</p>
              </div>
            )}
            {(job.salaryMin || job.salaryMax) && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Salary</p>
                <p className="text-sm font-semibold text-slate-700">
                  {job.salaryMin && job.salaryMax
                    ? `₹${(job.salaryMin / 100000).toFixed(1)}L – ₹${(job.salaryMax / 100000).toFixed(1)}L / yr`
                    : job.salaryMin
                    ? `From ₹${(job.salaryMin / 100000).toFixed(1)}L`
                    : `Up to ₹${(job.salaryMax! / 100000).toFixed(1)}L`}
                </p>
              </div>
            )}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Posted</p>
              <p className="text-sm font-semibold text-slate-700">
                {new Date(job.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
          <h2 className="text-base font-extrabold text-slate-900 mb-3">About the Role</h2>
          <div className="prose prose-sm prose-slate max-w-none whitespace-pre-wrap text-slate-600 leading-relaxed">
            {job.description}
          </div>
        </div>

        {/* Requirements */}
        {job.requirements && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
            <h2 className="text-base font-extrabold text-slate-900 mb-3">Requirements</h2>
            <div className="prose prose-sm prose-slate max-w-none whitespace-pre-wrap text-slate-600 leading-relaxed">
              {job.requirements}
            </div>
          </div>
        )}

        {/* Apply Form */}
        <div ref={formRef} className="rounded-2xl border border-brand/30 bg-white p-6 shadow-sm" id="apply-form">
          <h2 className="text-lg font-extrabold text-slate-900 mb-1">Apply for this Position</h2>
          <p className="text-sm text-slate-500 mb-5">Fill in your details below. We'll review and get back to you.</p>

          {submitted ? (
            <div className="py-10 text-center">
              <div className="text-5xl mb-3">🎉</div>
              <h3 className="text-lg font-extrabold text-slate-800 mb-1">Application Submitted!</h3>
              <p className="text-slate-500 text-sm">Thank you for applying. Our team will review your profile and be in touch shortly.</p>
              <Link href="/careers"
                className="inline-flex items-center gap-1.5 mt-6 text-sm text-brand font-semibold hover:underline">
                ← Browse more jobs
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Your full name"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Phone Number *</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Email Address *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Resume Link *</label>
                <input
                  type="url"
                  value={form.resumeUrl}
                  onChange={e => setForm(p => ({ ...p, resumeUrl: e.target.value }))}
                  placeholder="Google Drive / Dropbox / LinkedIn link to your resume"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10 transition"
                />
                <p className="text-[11px] text-slate-400 mt-1">Share a public link (Google Drive, Dropbox, or PDF URL)</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Cover Letter <span className="font-normal text-slate-400">(optional)</span></label>
                <textarea
                  value={form.coverLetter}
                  onChange={e => setForm(p => ({ ...p, coverLetter: e.target.value }))}
                  rows={4}
                  placeholder="Tell us why you're a great fit for this role…"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10 transition resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-xl bg-brand text-white text-sm font-bold hover:bg-brand-dark disabled:opacity-50 transition shadow-sm"
              >
                {submitting ? "Submitting…" : "Submit Application"}
              </button>
            </form>
          )}
        </div>
      </div>
    </GlobalShell>
  );
}
