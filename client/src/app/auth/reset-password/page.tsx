"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { SiteShell } from "@/components/site-shell";
import { AlertCircle, ArrowRight, Loader2, Lock, ShieldCheck } from "lucide-react";

const resetSchema = zod
  .object({
    email: zod.string().email("Invalid email"),
    otp: zod.string().length(6, "OTP code must be exactly 6 characters long"),
    password: zod.string().min(6, "Password must be at least 6 characters long"),
    confirmPassword: zod.string().min(6, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetFormValues = zod.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const pendingEmail = localStorage.getItem("rr_pending_reset_email");
    if (pendingEmail) {
      setEmail(pendingEmail);
    } else {
      router.push("/auth/forgot-password");
    }
  }, [router]);

  const {
    register: registerField,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
  });

  useEffect(() => {
    if (email) {
      setValue("email", email);
    }
  }, [email, setValue]);

  const onSubmit = async (data: ResetFormValues) => {
    setLoading(true);
    setError(null);
    try {
      await resetPassword(data.email, data.otp, data.password);
      localStorage.removeItem("rr_pending_reset_email");
      alert("Password updated successfully! Please log in with your new password.");
      router.push("/login");
    } catch (err: any) {
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!email) return null;

  return (
    <SiteShell
      title="Enter New Password"
      subtitle="Complete your password reset by entering the verification OTP code and setting your new password."
    >
      <div className="mx-auto max-w-md my-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-100">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Reset Password</h2>
            <p className="text-sm text-slate-500">
              Recovering credentials for <strong className="text-slate-800">{email}</strong>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-600">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Sandbox Notice */}
            <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-4 text-xs text-sky-800">
              <p className="font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1 text-sky-900">
                <ShieldCheck className="h-4 w-4" /> Sandbox Mode
              </p>
              Please use the verification OTP code <strong className="text-sky-950 font-bold">123456</strong> for testing your password reset flow.
            </div>

            <input type="hidden" {...registerField("email")} />

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                OTP Code
              </label>
              <input
                type="text"
                maxLength={6}
                {...registerField("otp")}
                placeholder="123456"
                className="w-full rounded-xl border border-slate-300 py-2.5 text-center font-bold tracking-widest text-sm focus:border-brand focus:outline-none"
              />
              {errors.otp && (
                <p className="text-xs font-medium text-rose-600">{errors.otp.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  {...registerField("password")}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm placeholder-slate-400 focus:border-brand focus:outline-none"
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
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm placeholder-slate-400 focus:border-brand focus:outline-none"
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
                  Updating Password...
                </>
              ) : (
                <>
                  Reset Password
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
