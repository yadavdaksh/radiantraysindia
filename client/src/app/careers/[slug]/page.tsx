"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { GlobalShell } from "@/components/global-shell";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

const JOB_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full Time",
  PART_TIME: "Part Time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
  REMOTE: "Remote",
};

const emptyForm = { name: "", email: "", phone: "", coverLetter: "" };

export default function CareerDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!slug) return;
    apiClient.get(`/careers/${slug}`)
      .then(r => setJob(r.data.data))
      .catch(() => router.replace("/careers"))
      .finally(() => setLoading(false));
  }, [slug, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type)) {
      toast.error("Only PDF or Word (.doc/.docx) files accepted");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5 MB");
      return;
    }
    setResumeFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error("Please fill all required fields");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Enter a valid email address");
      return;
    }
    if (!resumeFile) {
      toast.error("Please attach your resume");
      return;
    }

    setSubmitting(true);
    try {
      // Step 1: Upload resume to R2
      setUploading(true);
      const fd = new FormData();
      fd.append("resume", resumeFile);
      const uploadRes = await fetch(`${API_URL}/careers/upload-resume`, {
        method: "POST",
        body: fd,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.message || "Resume upload failed");
      const resumeUrl: string = uploadData.data.url;
      setUploading(false);

      // Step 2: Submit application
      await apiClient.post(`/careers/${slug}/apply`, { ...form, resumeUrl });
      setSubmitted(true);
      toast.success("Application submitted! We'll be in touch.");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
      setUploading(false);
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
          <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
            {job.description}
          </div>
        </div>

        {/* Requirements */}
        {job.requirements && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
            <h2 className="text-base font-extrabold text-slate-900 mb-3">Requirements</h2>
            <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
              {job.requirements}
            </div>
          </div>
        )}

        {/* Apply Form */}
        <div ref={formRef} className="rounded-2xl border border-brand/30 bg-white p-6 shadow-sm" id="apply-form">
          <h2 className="text-lg font-extrabold text-slate-900 mb-1">Apply for this Position</h2>
          <p className="text-sm text-slate-500 mb-5">Fill in your details and attach your resume. We'll review and get back to you.</p>

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

              {/* Resume Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Resume / CV *</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex items-center gap-3 rounded-xl border-2 border-dashed px-4 py-3.5 cursor-pointer transition ${
                    resumeFile ? "border-brand/40 bg-brand/5" : "border-slate-200 bg-slate-50 hover:border-brand/30 hover:bg-brand/5"
                  }`}
                >
                  <div className={`h-9 w-9 shrink-0 rounded-lg flex items-center justify-center ${resumeFile ? "bg-brand/10 text-brand" : "bg-slate-200 text-slate-500"}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    {resumeFile ? (
                      <>
                        <p className="text-sm font-semibold text-slate-800 truncate">{resumeFile.name}</p>
                        <p className="text-xs text-slate-400">{(resumeFile.size / 1024).toFixed(0)} KB — click to change</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-slate-600">Click to upload resume</p>
                        <p className="text-xs text-slate-400">PDF or Word, max 5 MB</p>
                      </>
                    )}
                  </div>
                  {resumeFile && (
                    <button type="button"
                      onClick={e => { e.stopPropagation(); setResumeFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-slate-200 hover:bg-red-100 hover:text-red-600 text-slate-500 transition text-xs">
                      ✕
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                  className="hidden"
                />
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
                className="w-full h-11 rounded-xl bg-brand text-white text-sm font-bold hover:bg-brand-dark disabled:opacity-50 transition shadow-sm flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    {uploading ? "Uploading resume…" : "Submitting…"}
                  </>
                ) : "Submit Application"}
              </button>
            </form>
          )}
        </div>
      </div>
    </GlobalShell>
  );
}
