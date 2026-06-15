"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { SiteShell } from "@/components/site-shell";
import { AlertCircle, ArrowRight, Loader2, Mail, RefreshCw, CheckCircle2 } from "lucide-react";

export default function VerifyOtpPage() {
  const router = useRouter();
  const { verifyOtp, resendOtp } = useAuth();
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const pending = localStorage.getItem("rr_pending_verify_email");
    if (!pending) { router.replace("/register"); return; }
    setEmail(pending);
  }, [router]);

  // Cooldown timer for resend
  useEffect(() => {
    if (cooldown > 0) {
      const t = setTimeout(() => setCooldown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { setError("Enter the 6-digit OTP from your email"); return; }
    setLoading(true);
    setError("");
    try {
      await verifyOtp(email, otp);
      router.push("/account");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    setResent(false);
    setError("");
    try {
      await resendOtp(email);
      setResent(true);
      setCooldown(60);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  if (!email) return null;

  return (
    <SiteShell title="Verify Your Email" subtitle="Enter the 6-digit code sent to your email to activate your account.">
      <div className="mx-auto max-w-md my-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-100 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="h-16 w-16 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto">
              <Mail className="h-8 w-8 text-brand" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Check your inbox</h2>
            <p className="text-sm text-slate-500">
              We sent a 6-digit OTP to{" "}
              <strong className="text-slate-800">{email}</strong>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-sm font-semibold text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {resent && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                New OTP sent — check your email.
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block text-center">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="0  0  0  0  0  0"
                className="w-full rounded-xl border border-slate-300 py-4 text-center text-2xl font-extrabold tracking-[0.7em] placeholder-slate-200 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark disabled:opacity-60"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</>
              ) : (
                <><CheckCircle2 className="h-4 w-4" /> Verify & Continue <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          {/* Resend */}
          <div className="text-center space-y-2 border-t border-slate-100 pt-5">
            <p className="text-xs text-slate-500">Didn't receive the code?</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:underline disabled:opacity-50 disabled:no-underline transition"
            >
              {resending ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…</>
              ) : cooldown > 0 ? (
                `Resend in ${cooldown}s`
              ) : (
                <><RefreshCw className="h-3.5 w-3.5" /> Resend OTP</>
              )}
            </button>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
