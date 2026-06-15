"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { SiteShell } from "@/components/site-shell";
import { AlertCircle, ArrowRight, Loader2, Mail } from "lucide-react";

const forgotSchema = zod.object({
  email: zod.string().email("Please enter a valid email address"),
});

type ForgotFormValues = zod.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { forgotPassword } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotFormValues) => {
    setLoading(true);
    setError(null);
    try {
      await forgotPassword(data.email);
      localStorage.setItem("rr_pending_reset_email", data.email);
      router.push("/auth/reset-password");
    } catch (err: any) {
      setError(err.message || "Failed to trigger password reset OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteShell
      title="Forgot Password"
      subtitle="Enter your email to receive a password reset OTP code."
    >
      <div className="mx-auto max-w-md my-12">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-100">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Reset Password</h2>
            <p className="text-sm text-slate-500">
              We'll send an OTP verification code to your email
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

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark disabled:opacity-75"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                <>
                  Send OTP Code
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </SiteShell>
  );
}
