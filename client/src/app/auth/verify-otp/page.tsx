"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { Mail, ArrowRight, Loader2, CheckCircle2, RotateCcw } from "lucide-react";

export default function VerifyOtpPage() {
  const router = useRouter();
  const { verifyOtp, resendOtp } = useAuth();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [success, setSuccess] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const e = localStorage.getItem("rr_pending_verify_email");
    if (!e) { router.replace("/register"); return; }
    setEmail(e);
    refs.current[0]?.focus();
  }, [router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    setError("");
    if (val && i < 5) refs.current[i + 1]?.focus();
    // Auto-submit when last digit filled
    if (val && i === 5) {
      const full = [...next].join("");
      if (full.length === 6) submitOtp(full);
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!digits) return;
    const arr = digits.split("").concat(Array(6).fill("")).slice(0, 6);
    setOtp(arr);
    refs.current[Math.min(digits.length, 5)]?.focus();
    if (digits.length === 6) submitOtp(digits);
  };

  const submitOtp = async (code: string) => {
    if (code.length !== 6) { setError("Enter the complete 6-digit code"); return; }
    setLoading(true);
    setError("");
    try {
      await verifyOtp(email, code);
      setSuccess(true);
      toast.success("Email verified! Welcome aboard.");
      setTimeout(() => router.push("/account"), 1200);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Invalid or expired OTP";
      setError(msg);
      toast.error(msg);
      setOtp(["", "", "", "", "", ""]);
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError("");
    try {
      await resendOtp(email);
      setCooldown(60);
      toast.success("New OTP sent — check your inbox.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  const full = otp.join("");

  if (success) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(3,95,150,0.08),_transparent_60%)] flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 shadow-xl p-10 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-950">Verified!</h2>
          <p className="text-sm text-slate-500">Taking you to your account…</p>
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 animate-[grow_1.2s_linear_forwards] rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(3,95,150,0.08),_transparent_60%)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-1">
            <span className="text-2xl font-extrabold tracking-tight text-slate-950">Radiant Rays Pvt. Ltd.</span>
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-brand">India · Cleanroom</span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/80 p-8 space-y-7">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="h-14 w-14 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto">
              <Mail className="h-7 w-7 text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-950">Check your inbox</h1>
              <p className="text-sm text-slate-500 mt-1">
                We sent a 6-digit code to<br />
                <strong className="text-slate-800">{email}</strong>
              </p>
            </div>
          </div>

          {/* OTP inputs */}
          <div className="flex gap-2.5 justify-center" onPaste={handlePaste}>
            {otp.map((d, i) => (
              <input
                key={i}
                ref={el => { refs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                disabled={loading}
                className={`w-11 h-14 rounded-xl border-2 text-center text-xl font-extrabold outline-none transition ${
                  error ? "border-rose-400 bg-rose-50 text-rose-800" :
                  d ? "border-brand bg-brand/5 text-brand" :
                  "border-slate-200 bg-slate-50 text-slate-900 focus:border-brand focus:bg-white"
                } disabled:opacity-50`}
              />
            ))}
          </div>

          {error && (
            <p className="text-center text-sm font-semibold text-rose-600 -mt-2">{error}</p>
          )}

          {/* Submit button — shows when all filled but not auto-submitted */}
          <button
            onClick={() => submitOtp(full)}
            disabled={loading || full.length !== 6}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark disabled:opacity-50"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</> : <>Verify & Continue <ArrowRight className="h-4 w-4" /></>}
          </button>

          {/* Resend */}
          <div className="text-center space-y-1">
            <p className="text-xs text-slate-500">Didn't receive it?</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:underline disabled:opacity-50 disabled:no-underline transition"
            >
              {resending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…</> :
               cooldown > 0 ? `Resend in ${cooldown}s` :
               <><RotateCcw className="h-3.5 w-3.5" /> Resend OTP</>}
            </button>
          </div>

          <div className="text-center text-xs text-slate-400">
            Wrong email?{" "}
            <Link href="/register" className="font-bold text-slate-600 hover:text-brand">Go back</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
