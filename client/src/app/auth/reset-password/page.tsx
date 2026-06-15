"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const e = localStorage.getItem("rr_pending_reset_email");
    if (!e) { router.replace("/auth/forgot-password"); return; }
    setEmail(e);
  }, [router]);

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp]; next[i] = val.slice(-1); setOtp(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const d = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!d) return;
    setOtp(d.split("").concat(Array(6).fill("")).slice(0, 6));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) { setError("Enter the complete 6-digit OTP"); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (newPassword !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true); setError("");
    try {
      await resetPassword(email, code, newPassword);
      localStorage.removeItem("rr_pending_reset_email");
      setDone(true);
      toast.success("Password reset! You can now log in.");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Reset failed";
      setError(msg); toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(3,95,150,0.08),_transparent_60%)] flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 shadow-xl p-10 text-center space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-950">Password Reset!</h2>
          <p className="text-sm text-slate-500">Redirecting to login…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(3,95,150,0.08),_transparent_60%)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-1">
            <span className="text-2xl font-extrabold tracking-tight text-slate-950">Radiant Rays</span>
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-brand">India · Cleanroom</span>
          </Link>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
          <div>
            <h1 className="text-xl font-extrabold text-slate-950 mb-1">Reset password</h1>
            <p className="text-sm text-slate-500">Enter the OTP sent to <strong className="text-slate-800">{email}</strong></p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>}

            {/* OTP */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">6-Digit OTP</label>
              <div className="flex gap-2 justify-between" onPaste={handlePaste}>
                {otp.map((d, i) => (
                  <input key={i} ref={el => { refs.current[i] = el; }}
                    type="text" inputMode="numeric" maxLength={1} value={d}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className={`w-11 h-12 rounded-xl border-2 text-center text-lg font-extrabold outline-none transition ${d ? "border-brand bg-brand/5 text-brand" : "border-slate-200 bg-slate-50 focus:border-brand focus:bg-white"}`}
                  />
                ))}
              </div>
            </div>

            {/* New password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input type={showPw ? "text" : "password"} value={newPassword}
                  onChange={e => { setNewPassword(e.target.value); setError(""); }}
                  placeholder="Min 6 characters" autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-11 py-3 text-sm outline-none focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand transition" />
                <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input type="password" value={confirm} onChange={e => { setConfirm(e.target.value); setError(""); }}
                  placeholder="Repeat new password" autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-4 py-3 text-sm outline-none focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand transition" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-sm font-bold text-white shadow-lg shadow-brand/20 hover:bg-brand-dark transition disabled:opacity-60">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Resetting…</> : <>Reset Password <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
