"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { Mail, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) { setError("Enter a valid email address"); return; }
    setLoading(true);
    setError("");
    try {
      await forgotPassword(email);
      localStorage.setItem("rr_pending_reset_email", email);
      setSent(true);
      toast.success("Reset OTP sent — check your inbox.");
      setTimeout(() => router.push("/auth/reset-password"), 1500);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to send OTP";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(3,95,150,0.08),_transparent_60%)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-1">
            <span className="text-2xl font-extrabold tracking-tight text-slate-950">Radiant Rays</span>
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-brand">India · Cleanroom</span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/80 p-8 space-y-6">
          {sent ? (
            <div className="text-center space-y-4 py-4">
              <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </div>
              <h1 className="text-xl font-extrabold text-slate-950">OTP Sent!</h1>
              <p className="text-sm text-slate-500">Check <strong className="text-slate-800">{email}</strong> for your reset code. Redirecting…</p>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-xl font-extrabold text-slate-950 mb-1">Forgot password?</h1>
                <p className="text-sm text-slate-500">Enter your email and we'll send a reset OTP.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {error && <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
                      placeholder="you@company.com" autoFocus
                      className={`w-full rounded-xl border pl-10 pr-4 py-3 text-sm outline-none transition ${error ? "border-rose-400 bg-rose-50" : "border-slate-300 bg-slate-50 focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"}`} />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark disabled:opacity-60">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <>Send Reset OTP <ArrowRight className="h-4 w-4" /></>}
                </button>
              </form>
              <div className="text-center text-sm">
                <Link href="/login" className="font-bold text-brand hover:underline">← Back to login</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
