"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { SiteShell } from "@/components/site-shell";
import { AlertCircle, ArrowRight, Loader2, Lock, Mail } from "lucide-react";

const loginSchema = zod.object({
  email: zod.string().email("Please enter a valid email address"),
  password: zod.string().min(4, "Password must be at least 4 characters long"),
});

type LoginFormValues = zod.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectTo = searchParams.get("redirect") || "/account";

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setError(null);
    try {
      await login(data.email, data.password);
      router.push(redirectTo);
      router.refresh();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Invalid credentials";
      // Server returns 403 for unverified accounts — redirect to OTP page
      if (err.response?.status === 403 || msg.toLowerCase().includes("not verified") || msg.toLowerCase().includes("otp has been sent")) {
        localStorage.setItem("rr_pending_verify_email", data.email);
        router.push("/auth/verify-otp");
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteShell
      title="Customer Portal Login"
      subtitle="Sign in to manage your cleanroom furniture orders, check delivery updates, and view your wishlist."
    >
      <div className="mx-auto max-w-md my-12">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-100">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome Back</h2>
            <p className="text-sm text-slate-500">
              Sign in with your registered email
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-600">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  {...registerField("email")}
                  placeholder="name@company.com"
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm placeholder-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              {errors.email && (
                <p className="text-xs font-medium text-rose-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-bold text-brand hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
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

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark disabled:opacity-75"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying Account...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 border-t border-slate-100 pt-6 text-center text-xs text-slate-500">
            Don't have an account?{" "}
            <Link href="/register" className="font-bold text-brand hover:underline">
              Create free account
            </Link>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
