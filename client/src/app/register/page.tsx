"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { SiteShell } from "@/components/site-shell";
import { AlertCircle, ArrowRight, Loader2, Lock, Mail, Phone, User } from "lucide-react";

const registerSchema = zod
  .object({
    name: zod.string().min(2, "Name must be at least 2 characters long"),
    email: zod.string().email("Please enter a valid email address"),
    phone: zod.string().min(10, "Phone number must be at least 10 digits"),
    password: zod.string().min(6, "Password must be at least 6 characters long"),
    confirmPassword: zod.string().min(6, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = zod.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    setError(null);
    try {
      await register(data.name, data.email, data.password, data.phone);
      // Save email for OTP and redirect
      localStorage.setItem("rr_pending_verify_email", data.email);
      router.push("/auth/verify-otp");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteShell
      title="Create Customer Account"
      subtitle="Join Radiant Rays as a customer. Buy cleanroom components directly and track shipping in real time."
    >
      <div className="mx-auto max-w-md my-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-100">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Get Started</h2>
            <p className="text-sm text-slate-500">
              Create your account to unlock shopping features
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-600">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  {...registerField("name")}
                  placeholder="John Doe"
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm placeholder-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              {errors.name && (
                <p className="text-xs font-medium text-rose-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  {...registerField("email")}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm placeholder-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              {errors.email && (
                <p className="text-xs font-medium text-rose-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  {...registerField("phone")}
                  placeholder="9876543210"
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm placeholder-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              {errors.phone && (
                <p className="text-xs font-medium text-rose-600">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  {...registerField("password")}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm placeholder-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              {errors.password && (
                <p className="text-xs font-medium text-rose-600">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  {...registerField("confirmPassword")}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm placeholder-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-xs font-medium text-rose-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark disabled:opacity-75"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Register
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 border-t border-slate-100 pt-6 text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-brand hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
