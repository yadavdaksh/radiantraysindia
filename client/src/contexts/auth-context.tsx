"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isVerified: boolean;
}

interface AuthContextType {
  customer: Customer | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, otp: string, pass: string) => Promise<void>;
  updateProfile: (data: { name: string; phone?: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function setSession(customer: Customer, token: string) {
  localStorage.setItem("rr_curr_customer", JSON.stringify(customer));
  localStorage.setItem("rr_curr_token", token);
}

function clearSession() {
  localStorage.removeItem("rr_curr_customer");
  localStorage.removeItem("rr_curr_token");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount — try /customer/profile to validate, fallback to localStorage
  useEffect(() => {
    const restore = async () => {
      const localCust = localStorage.getItem("rr_curr_customer");
      const localTok = localStorage.getItem("rr_curr_token");
      try {
        // Validate token is still alive / fetch profile using cookies
        const res = await apiClient.get("/customer/profile");
        const fresh = res.data.data;
        setCustomer(fresh);
        const activeToken = localTok || "cookie-auth";
        setToken(activeToken);
        setSession(fresh, activeToken);
      } catch {
        // Fallback to local storage if API call fails
        if (localCust && localTok) {
          try {
            setCustomer(JSON.parse(localCust));
            setToken(localTok);
          } catch (_) {}
        }
      }
      setIsLoading(false);
    };
    restore();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiClient.post("/auth/customer/login", { email, password });
    const { customer: cust, accessToken } = res.data.data;
    setCustomer(cust);
    setToken(accessToken);
    setSession(cust, accessToken);
  };

  const register = async (name: string, email: string, password: string, phone: string) => {
    await apiClient.post("/auth/customer/register", { name, email, password, phone });
    // Save for OTP page
    localStorage.setItem("rr_pending_verify_email", email);
  };

  const verifyOtp = async (email: string, otp: string) => {
    const res = await apiClient.post("/auth/customer/verify-otp", { email, otp });
    const { customer: cust, accessToken } = res.data.data;
    setCustomer(cust);
    setToken(accessToken);
    setSession(cust, accessToken);
    localStorage.removeItem("rr_pending_verify_email");
  };

  const resendOtp = async (email: string) => {
    await apiClient.post("/auth/customer/resend-otp", { email });
  };

  const forgotPassword = async (email: string) => {
    await apiClient.post("/auth/customer/forgot-password", { email });
  };

  const resetPassword = async (email: string, otp: string, pass: string) => {
    await apiClient.post("/auth/customer/reset-password", { email, otp, newPassword: pass });
  };

  const updateProfile = async (data: { name: string; phone?: string }) => {
    if (!customer) throw new Error("Not logged in");
    const res = await apiClient.put("/customer/profile", data);
    const updated = res.data.data;
    setCustomer(updated);
    if (token) setSession(updated, token);
  };

  const logout = () => {
    setCustomer(null);
    setToken(null);
    clearSession();
    apiClient.post("/auth/logout").catch(() => {});
  };

  return (
    <AuthContext.Provider value={{
      customer, token, isLoading,
      login, register, verifyOtp, resendOtp,
      forgotPassword, resetPassword, updateProfile, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
