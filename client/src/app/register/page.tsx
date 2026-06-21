"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, Phone, User, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

type Errs = { name?: string; email?: string; phone?: string; password?: string; confirm?: string; general?: string };

export default function RegisterPage() {
  const router = useRouter();
  const { register, customer, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && customer) {
      router.replace("/account");
    }
  }, [customer, isLoading, router]);

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errs>({});
  const [success, setSuccess] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    setErrors(p => ({ ...p, [k]: undefined, general: undefined }));
  };

  const validate = (): boolean => {
    const e: Errs = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = "Name must be at least 2 characters";
    if (!form.email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.phone) e.phone = "Phone is required";
    else if (form.phone.replace(/\D/g, "").length < 10) e.phone = "Enter a valid 10-digit number";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Minimum 6 characters";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form.name.trim(), form.email.toLowerCase().trim(), form.password, form.phone.trim());
      setSuccess(true);
      toast.success("Account created! Check your email for OTP.");
      setTimeout(() => router.push("/auth/verify-otp"), 1500);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Registration failed";
      if (msg.toLowerCase().includes("already")) {
        setErrors({ email: "This email is already registered" });
      } else {
        setErrors({ general: msg });
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(3,95,150,0.08),_transparent_60%)] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-10 text-center space-y-5">
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-950">Account Created!</h2>
          <p className="text-sm text-slate-500">We sent a 6-digit OTP to <strong className="text-slate-800">{form.email}</strong>. Redirecting to verification…</p>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-brand animate-[grow_1.5s_linear_forwards] rounded-full" style={{ width: 0 }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(3,95,150,0.08),_transparent_60%)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-1">
            <span className="text-2xl font-extrabold tracking-tight text-slate-950">Radiant Rays Pvt. Ltd.</span>
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-brand">India · Cleanroom</span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/80 p-8">
          <h1 className="text-2xl font-extrabold text-slate-950 mb-1">Create account</h1>
          <p className="text-sm text-slate-500 mb-8">Join Radiant Rays Pvt. Ltd. to shop and track orders</p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {errors.general && (
              <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700">
                <span className="mt-0.5 shrink-0">✕</span>{errors.general}
              </div>
            )}

            {/* Fields */}
            {([
              { key: "name", label: "Full Name", type: "text", ph: "Your full name", icon: User, auto: "name" },
              { key: "email", label: "Email Address", type: "email", ph: "you@company.com", icon: Mail, auto: "email" },
              { key: "phone", label: "Phone Number", type: "tel", ph: "9211781378", icon: Phone, auto: "tel" },
            ] as { key: keyof typeof form; label: string; type: string; ph: string; icon: any; auto: string }[]).map(f => (
              <div key={f.key} className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{f.label}</label>
                <div className="relative">
                  <f.icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={f.type}
                    value={form[f.key]}
                    onChange={set(f.key)}
                    placeholder={f.ph}
                    autoComplete={f.auto}
                    className={`w-full rounded-xl border pl-10 pr-4 py-3 text-sm outline-none transition ${errors[f.key] ? "border-rose-400 bg-rose-50 focus:ring-1 focus:ring-rose-400" : "border-slate-300 bg-slate-50 focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"}`}
                  />
                </div>
                {errors[f.key] && <p className="text-xs font-medium text-rose-600">{errors[f.key]}</p>}
              </div>
            ))}

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={set("password")}
                  placeholder="Min 6 characters"
                  autoComplete="new-password"
                  className={`w-full rounded-xl border pl-10 pr-11 py-3 text-sm outline-none transition ${errors.password ? "border-rose-400 bg-rose-50" : "border-slate-300 bg-slate-50 focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"}`}
                />
                <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs font-medium text-rose-600">{errors.password}</p>}
            </div>

            {/* Confirm */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={form.confirm}
                  onChange={set("confirm")}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  className={`w-full rounded-xl border pl-10 pr-4 py-3 text-sm outline-none transition ${errors.confirm ? "border-rose-400 bg-rose-50" : "border-slate-300 bg-slate-50 focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"}`}
                />
              </div>
              {errors.confirm && <p className="text-xs font-medium text-rose-600">{errors.confirm}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark disabled:opacity-60 mt-2"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</> : <>Create Account <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <div className="mt-7 border-t border-slate-100 pt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-brand hover:underline">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
