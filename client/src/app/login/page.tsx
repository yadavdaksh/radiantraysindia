"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/account";
  const { login, customer, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && customer) {
      router.replace(redirectTo);
    }
  }, [customer, isLoading, router, redirectTo]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email address";
    if (!password) e.password = "Password is required";
    else if (password.length < 4) e.password = "Password too short";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      await login(email, password);
      toast.success("Welcome back!");
      router.push(redirectTo);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Login failed";
      const status = err.response?.status;
      if (status === 403 || msg.toLowerCase().includes("not verified") || msg.toLowerCase().includes("otp has been sent")) {
        toast.info("Please verify your email — OTP resent.");
        localStorage.setItem("rr_pending_verify_email", email);
        router.push("/auth/verify-otp");
        return;
      }
      setErrors({ general: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(3,95,150,0.08),_transparent_60%)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-1">
            <span className="text-2xl font-extrabold tracking-tight text-slate-950">Radiant Rays Pvt. Ltd.</span>
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-brand">India · Cleanroom</span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/80 p-8">
          <h1 className="text-2xl font-extrabold text-slate-950 mb-1">Sign in</h1>
          <p className="text-sm text-slate-500 mb-8">Access your account and orders</p>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {errors.general && (
              <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700">
                <span className="mt-0.5 shrink-0">✕</span>
                {errors.general}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined, general: undefined })); }}
                  placeholder="you@company.com"
                  autoComplete="email"
                  className={`w-full rounded-xl border pl-10 pr-4 py-3 text-sm outline-none transition ${errors.email ? "border-rose-400 bg-rose-50 focus:ring-1 focus:ring-rose-400" : "border-slate-300 bg-slate-50 focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"}`}
                />
              </div>
              {errors.email && <p className="text-xs font-medium text-rose-600">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Password</label>
                <Link href="/auth/forgot-password" className="text-xs font-bold text-brand hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined, general: undefined })); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`w-full rounded-xl border pl-10 pr-11 py-3 text-sm outline-none transition ${errors.password ? "border-rose-400 bg-rose-50 focus:ring-1 focus:ring-rose-400" : "border-slate-300 bg-slate-50 focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"}`}
                />
                <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs font-medium text-rose-600">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark disabled:opacity-60"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : <>Sign In <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <div className="mt-7 border-t border-slate-100 pt-6 text-center text-sm text-slate-500">
            New customer?{" "}
            <Link href="/register" className="font-bold text-brand hover:underline">Create account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
