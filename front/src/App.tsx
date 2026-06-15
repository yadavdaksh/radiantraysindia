import React, { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useLocation, Routes, Route } from "react-router-dom";
import { Toaster, toast as sonner } from "sonner";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  IconLayoutDashboard, IconBox, IconCategory,
  IconShoppingCart, IconArrowBack,
  IconCreditCard, IconTicket, IconUsers, IconMapPin, IconHeart,
  IconTarget, IconMail, IconNews, IconMessageCircle,
  IconBuildingFactory, IconPhoto, IconFlag, IconSeo,
  IconSitemap, IconRobot, IconUser, IconShieldHalf, IconKey,
  IconActivity, IconMailbox, IconSettings,
} from "@tabler/icons-react";
import { ModuleView } from "./components/Views";
import ProductsPage from "./pages/Products";
import ProductForm from "./pages/ProductForm";
import CategoriesPage from "./pages/Categories";
import {
  CustomersPage, AddressesPage, WishlistPage,
  LeadsPage, ContactFormsPage, NewsletterPage, TestimonialsPage,
} from "./pages/AdminPages";
import {
  IndustriesPage, GalleryPage, BannersPage, RolesPage, UsersPage,
} from "./pages/MorePages";
import SettingsPage from "./pages/SettingsPage";

// ─── Types ────────────────────────────────────────────────────────────────────

type ModuleKey =
  | "dashboard"
  | "products"
  | "categories"
  | "variants"
  | "attributes"
  | "orders"
  | "returns"
  | "refunds"
  | "coupons"
  | "customers"
  | "addresses"
  | "wishlist"
  | "leads"
  | "contactForms"
  | "newsletter"
  | "testimonials"
  | "industries"
  | "gallery"
  | "banners"
  | "seoPages"
  | "sitemap"
  | "robots"
  | "users"
  | "roles"
  | "permissions"
  | "activityLogs"
  | "emailLogs"
  | "settings";

type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
};

type ApiResponse<T> = {
  data: T;
  message?: string;
};

type SidebarItem = {
  key: ModuleKey;
  label: string;
  resource: string;
  emoji: string;
  icon: React.ElementType;
};

type SidebarSection = {
  title: string;
  items: SidebarItem[];
};

// ─── API ──────────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4002/api/v1";

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  if (response.status === 401 && retry && !path.includes("/auth/refresh")) {
    const refreshed = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (refreshed.ok) {
      return apiFetch<T>(path, options, false);
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error((error as any).message || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<ApiResponse<T>>;
}

// ─── Sidebar sections ─────────────────────────────────────────────────────────

const sidebarSections: SidebarSection[] = [
  {
    title: "",
    items: [
      { key: "dashboard", label: "Dashboard", resource: "dashboard", emoji: "dashboard", icon: IconLayoutDashboard },
    ],
  },
  {
    title: "Catalog",
    items: [
      { key: "products", label: "Products", resource: "product", emoji: "products", icon: IconBox },
      { key: "categories", label: "Categories", resource: "category", emoji: "categories", icon: IconCategory },
    ],
  },
  {
    title: "Sales",
    items: [
      { key: "orders", label: "Orders", resource: "order", emoji: "orders", icon: IconShoppingCart },
      { key: "returns", label: "Returns", resource: "return", emoji: "returns", icon: IconArrowBack },
      { key: "refunds", label: "Refunds", resource: "refund", emoji: "refunds", icon: IconCreditCard },
      { key: "coupons", label: "Coupons", resource: "coupon", emoji: "coupons", icon: IconTicket },
    ],
  },
  {
    title: "Customers",
    items: [
      { key: "customers", label: "Customers", resource: "customer", emoji: "customers", icon: IconUsers },
      { key: "addresses", label: "Addresses", resource: "address", emoji: "addresses", icon: IconMapPin },
      { key: "wishlist", label: "Wishlist", resource: "wishlist", emoji: "wishlist", icon: IconHeart },
    ],
  },
  {
    title: "Marketing",
    items: [
      { key: "leads", label: "Leads", resource: "lead", emoji: "leads", icon: IconTarget },
      { key: "contactForms", label: "Contact Forms", resource: "contact", emoji: "contactForms", icon: IconMail },
      { key: "newsletter", label: "Newsletter", resource: "newsletter", emoji: "newsletter", icon: IconNews },
      { key: "testimonials", label: "Testimonials", resource: "testimonial", emoji: "testimonials", icon: IconMessageCircle },
    ],
  },
  {
    title: "Content",
    items: [
      { key: "industries", label: "Industries", resource: "industry", emoji: "industries", icon: IconBuildingFactory },
      { key: "gallery", label: "Gallery", resource: "gallery", emoji: "gallery", icon: IconPhoto },
      { key: "banners", label: "Banners", resource: "banner", emoji: "banners", icon: IconFlag },
    ],
  },
  {
    title: "SEO",
    items: [
      { key: "seoPages", label: "SEO Pages", resource: "seo", emoji: "seoPages", icon: IconSeo },
      { key: "sitemap", label: "Sitemap", resource: "sitemap", emoji: "sitemap", icon: IconSitemap },
      { key: "robots", label: "Robots", resource: "robots", emoji: "robots", icon: IconRobot },
    ],
  },
  {
    title: "System",
    items: [
      { key: "users", label: "Users", resource: "user", emoji: "users", icon: IconUser },
      { key: "roles", label: "Roles", resource: "role", emoji: "roles", icon: IconShieldHalf },
      { key: "permissions", label: "Permissions", resource: "permission", emoji: "permissions", icon: IconKey },
      { key: "activityLogs", label: "Activity Logs", resource: "activity", emoji: "activityLogs", icon: IconActivity },
      { key: "emailLogs", label: "Email Logs", resource: "email", emoji: "emailLogs", icon: IconMailbox },
      { key: "settings", label: "Settings", resource: "setting", emoji: "settings", icon: IconSettings },
    ],
  },
];

// ─── emptyProductForm ─────────────────────────────────────────────────────────

// ─── Helper UI components ─────────────────────────────────────────────────────

// ─── Auth helpers ─────────────────────────────────────────────────────────────

const inputCls = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 transition";

function AuthField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      {children}
    </div>
  );
}

function AuthMsg({ type, text }: { type: "ok" | "err"; text: string }) {
  return (
    <div className={`rounded-xl px-4 py-3 text-sm font-medium flex items-start gap-2.5 ${type === "ok" ? "bg-emerald-50 border border-emerald-200 text-emerald-800" : "bg-rose-50 border border-rose-200 text-rose-700"}`}>
      <span className="text-base leading-none mt-0.5">{type === "ok" ? "✓" : "✕"}</span>
      <span>{text}</span>
    </div>
  );
}

function AuthBtn({ loading, label, loadLabel }: { loading: boolean; label: string; loadLabel?: string }) {
  return (
    <button
      disabled={loading}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-700 hover:bg-sky-800 px-5 py-3.5 text-sm font-bold text-white transition shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          {loadLabel || "Please wait..."}
        </>
      ) : label}
    </button>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (user: SessionUser) => void }) {
  const [mode, setMode] = useState<"login" | "forgot" | "otp" | "reset" | "verifyEmail">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const go = (m: typeof mode) => { setMode(m); setError(""); setMessage(""); };

  const postJson = async (path: string, body: object) => {
    const r = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((j as any).message || `Error ${r.status}`);
    return j;
  };

  const submitLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const j = await postJson("/auth/login", { email, password });
      onLogin((j as any).data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const j = await postJson("/auth/admin/forgot-password", { email });
      setMessage((j as any).message || "OTP sent — check your email inbox.");
      setMode("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit numeric OTP from your email.");
      return;
    }
    go("reset");
  };

  const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }
    try {
      const j = await postJson("/auth/admin/reset-password", { email, otp, newPassword });
      setMessage((j as any).message || "Password updated successfully.");
      go("login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailVerify = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const j = await postJson("/auth/admin/forgot-password", { email });
      setMessage(((j as any).message || "OTP sent to " + email) + " — enter it to verify your account.");
      setMode("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const modeSubtitle: Record<typeof mode, string> = {
    login: "Sign in to your administrator account",
    forgot: "Reset your password via email OTP",
    otp: "Enter the 6-digit code from your email",
    reset: "Create a new secure password",
    verifyEmail: "Verify your administrator email address",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#041f35] to-[#062f50] flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)", backgroundSize: "32px 32px" }}
      />
      <div className="relative w-full max-w-md space-y-6">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/70">
            Radiant Rays India
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-2">Admin Console</h1>
          <p className="text-sm text-white/50">{modeSubtitle[mode]}</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-2xl space-y-5">
          {mode === "login" && (
            <form onSubmit={submitLogin} className="space-y-4">
              <AuthField label="Email">
                <input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  type="email"
                  required
                  placeholder="admin@radiantraysindia.com"
                  className={inputCls}
                  autoComplete="email"
                  autoFocus
                />
              </AuthField>
              <AuthField label="Password">
                <input
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  type="password"
                  required
                  placeholder="••••••••"
                  className={inputCls}
                  autoComplete="current-password"
                />
              </AuthField>
              {error && <AuthMsg type="err" text={error} />}
              {message && <AuthMsg type="ok" text={message} />}
              <AuthBtn loading={loading} label="Sign In" loadLabel="Signing in..." />
              <div className="flex items-center justify-end pt-1 text-xs font-semibold text-slate-400">
                <button type="button" onClick={() => go("forgot")} className="hover:text-sky-600 transition">
                  Forgot Password?
                </button>
                {/* <button type="button" onClick={() => go("verifyEmail")} className="hover:text-sky-600 transition">
                  Email Verification
                </button> */}
              </div>
            </form>
          )}

          {mode === "forgot" && (
            <form onSubmit={handleForgot} className="space-y-4">
              <p className="text-sm text-slate-500 leading-relaxed">
                Enter your admin email. If it exists in the system, a 6-digit OTP will be sent.
              </p>
              <AuthField label="Admin Email">
                <input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  type="email"
                  required
                  placeholder="admin@radiantraysindia.com"
                  className={inputCls}
                  autoFocus
                />
              </AuthField>
              {error && <AuthMsg type="err" text={error} />}
              <AuthBtn loading={loading} label="Send Reset OTP" loadLabel="Sending OTP..." />
              <button
                type="button"
                onClick={() => go("login")}
                className="block w-full text-center text-xs font-semibold text-slate-400 hover:text-sky-600 transition"
              >
                ← Back to Sign In
              </button>
            </form>
          )}

          {mode === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {message && <AuthMsg type="ok" text={message} />}
              <AuthField label="6-Digit OTP">
                <input
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="000000"
                  className={`${inputCls} text-center font-mono text-2xl font-extrabold tracking-[0.6em]`}
                />
              </AuthField>
              <p className="text-xs text-slate-400 text-center">
                OTP sent to <strong className="text-slate-600">{email}</strong>
              </p>
              {error && <AuthMsg type="err" text={error} />}
              <AuthBtn loading={false} label="Verify & Continue →" />
              <button
                type="button"
                onClick={() => go("forgot")}
                className="block w-full text-center text-xs font-semibold text-slate-400 hover:text-sky-600 transition"
              >
                ← Resend OTP
              </button>
            </form>
          )}

          {mode === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <AuthField label="New Password">
                <input
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  type="password"
                  required
                  placeholder="Min 8 characters"
                  className={inputCls}
                  autoFocus
                  autoComplete="new-password"
                />
              </AuthField>
              <AuthField label="Confirm Password">
                <input
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  type="password"
                  required
                  placeholder="Repeat new password"
                  className={inputCls}
                  autoComplete="new-password"
                />
              </AuthField>
              {error && <AuthMsg type="err" text={error} />}
              <AuthBtn loading={loading} label="Save New Password" loadLabel="Saving..." />
            </form>
          )}

          {mode === "verifyEmail" && (
            <form onSubmit={handleEmailVerify} className="space-y-4">
              <p className="text-sm text-slate-500 leading-relaxed">
                Send a verification OTP to confirm your admin email address is active and accessible.
              </p>
              <AuthField label="Admin Email">
                <input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  type="email"
                  required
                  placeholder="admin@radiantraysindia.com"
                  className={inputCls}
                  autoFocus
                />
              </AuthField>
              {error && <AuthMsg type="err" text={error} />}
              {message && <AuthMsg type="ok" text={message} />}
              <AuthBtn loading={loading} label="Send Verification OTP" loadLabel="Sending..." />
              <button
                type="button"
                onClick={() => go("login")}
                className="block w-full text-center text-xs font-semibold text-slate-400 hover:text-sky-600 transition"
              >
                ← Back to Sign In
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-white/20">
          © {new Date().getFullYear()} Radiant Rays India · Admin Console
        </p>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // First path segment determines active sidebar item
  const pathKey = (location.pathname.replace(/^\//, "").split("/")[0]) || "dashboard";
  const allKeys: ModuleKey[] = [
    "dashboard", "products", "categories", "variants", "attributes",
    "orders", "returns", "refunds", "coupons", "customers", "addresses", "wishlist",
    "leads", "contactForms", "newsletter", "testimonials", "industries", "gallery",
    "banners", "seoPages", "sitemap", "robots", "users", "roles", "permissions",
    "activityLogs", "emailLogs", "settings",
  ];
  const activeFromUrl = allKeys.includes(pathKey as ModuleKey) ? (pathKey as ModuleKey) : "dashboard";

  const [session, setSession] = useState<SessionUser | null>(null);
  const [active, setActive] = useState<ModuleKey>(activeFromUrl);
  const [loading, setLoading] = useState(true);
  const [resourceState, setResourceState] = useState<Record<string, any>>({});
  const [dashboard, setDashboard] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  // UI state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSearchPaletteOpen, setIsSearchPaletteOpen] = useState(false);
  const [searchPaletteQuery, setSearchPaletteQuery] = useState("");

  const permissions = useMemo(() => new Set(session?.permissions || []), [session]);
  const can = (resource: string, action: string) =>
    session?.role === "SUPER_ADMIN" || permissions.has(`${resource}:${action}`);

  // Kept for sidebar nav callbacks (no-op — sidebar now uses navigate)
  const setFormError = (_: string) => { };
  const setFormSuccess = (_: string) => { };

  // Sync active from URL — derived state from location, intentional pattern
  if (active !== activeFromUrl) setActive(activeFromUrl);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    if (type === "error") sonner.error(message);
    else if (type === "info") sonner.info(message);
    else sonner.success(message);
  };

  const logout = async () => {
    try { await apiFetch("/auth/logout-all", { method: "POST" }); } catch (_) { /* ignore */ }
    setSession(null);
    navigate("/");
  };

  const loadResource = async (resource: string, endpoint: string) => {
    setBusy(true);
    try {
      const result = await apiFetch<any>(endpoint);
      setResourceState(current => ({ ...current, [resource]: result.data }));
    } catch (error) {
      console.warn("API load failed:", error);
    } finally {
      setBusy(false);
    }
  };

  const loadSession = async () => {
    try {
      const result = await apiFetch<{ user: SessionUser }>("/auth/me");
      setSession(result.data.user);
    } catch (_) {
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSession(); }, []);

  // Auto-logout after 15 min inactivity
  useEffect(() => {
    if (!session) return;
    let timer: number;
    const reset = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        showToast("Logged out due to inactivity.");
        logout();
      }, 15 * 60 * 1000);
    };
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    events.forEach(name => window.addEventListener(name, reset));
    reset();
    return () => {
      window.clearTimeout(timer);
      events.forEach(name => window.removeEventListener(name, reset));
    };
  }, [session]);

  // Note: categories/products data loaded by their own page components

  // Load dashboard data
  useEffect(() => {
    if (!session) return;
    const load = async () => {
      try {
        const [home, products, leads, orders, users, roles, perms] = await Promise.allSettled([
          apiFetch<any>("/public/home"),
          apiFetch<any>("/products?limit=100"),
          apiFetch<any>("/leads?limit=100"),
          apiFetch<any>("/orders?limit=100"),
          apiFetch<any>("/system/users"),
          apiFetch<any>("/system/roles"),
          apiFetch<any>("/system/permissions"),
        ]);
        setDashboard({
          home: home.status === "fulfilled" ? home.value.data : { featuredProducts: [], categories: [], industries: [] },
          products: products.status === "fulfilled" ? products.value.data : { items: [] },
          leads: leads.status === "fulfilled" ? leads.value.data : { items: [] },
          orders: orders.status === "fulfilled" ? orders.value.data : { items: [] },
          users: users.status === "fulfilled" ? users.value.data : [],
          roles: roles.status === "fulfilled" ? roles.value.data : [],
          permissions: perms.status === "fulfilled" ? perms.value.data : [],
        });
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Failed to load dashboard", "error");
      }
    };
    load();
  }, [session]);

  // Load module data
  useEffect(() => {
    if (!session) return;
    const map: Record<ModuleKey, [string, string]> = {
      dashboard: ["dashboard", "/public/home"],
      products: ["products", "/products?limit=25"],
      categories: ["categories", "/categories?limit=50"],
      variants: ["variants", "/products?limit=5"],
      attributes: ["attributes", "/products?limit=5"],
      orders: ["orders", "/orders?limit=50"],
      returns: ["returns", "/orders?limit=5"],
      refunds: ["refunds", "/orders?limit=5"],
      coupons: ["coupons", "/coupons?limit=50"],
      customers: ["customers", "/customers?limit=50"],
      addresses: ["addresses", "/customers?limit=50"],
      wishlist: ["wishlist", "/customers?limit=50"],
      leads: ["leads", "/leads?limit=50"],
      contactForms: ["contactForms", "/leads?limit=50"],
      newsletter: ["newsletter", "/public/home"],
      testimonials: ["testimonials", "/content/testimonials"],
      industries: ["industries", "/industries?limit=50"],
      gallery: ["gallery", "/content/gallery"],
      banners: ["banners", "/content/banners"],
      seoPages: ["seoPages", "/products?limit=50"],
      sitemap: ["sitemap", "/public/home"],
      robots: ["robots", "/public/home"],
      users: ["users", "/system/users"],
      roles: ["roles", "/system/roles"],
      permissions: ["permissions", "/system/permissions"],
      activityLogs: ["activityLogs", "/system/activity-logs"],
      emailLogs: ["emailLogs", "/public/home"],
      settings: ["settings", "/content/settings"],
    };
    const entry = map[active];
    if (entry) loadResource(entry[0], entry[1]);
  }, [active, session]);

  const activeData = resourceState[active];

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)]">
        <div className="flex gap-4 w-full max-w-[1600px] px-3 py-3 h-screen">
          <div className="w-56 shrink-0 rounded-2xl border border-slate-200 bg-white p-4 animate-pulse space-y-3">
            <div className="h-4 bg-slate-100 rounded w-24" />
            <div className="h-8 bg-slate-100 rounded-xl" />
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="h-7 bg-slate-100 rounded-xl" />)}
          </div>
          <div className="flex-1 space-y-4 animate-pulse">
            <div className="h-12 bg-white border border-slate-200 rounded-xl" />
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-white border border-slate-200 rounded-xl" />)}
            </div>
            <div className="h-64 bg-white border border-slate-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoginScreen onLogin={user => setSession(user)} />;
  }

  // ── Breadcrumbs ──
  const getBreadcrumbs = () => {
    let sectionTitle = "";
    let itemLabel = "";
    for (const sec of sidebarSections) {
      const match = sec.items.find(x => x.key === active);
      if (match) {
        sectionTitle = sec.title;
        itemLabel = match.label;
        break;
      }
    }
    return (
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        <span>Home</span>
        {sectionTitle && (
          <>
            <span className="text-[10px]">/</span>
            <span>{sectionTitle}</span>
          </>
        )}
        <span className="text-[10px]">/</span>
        <span className="text-sky-700 font-bold">{itemLabel}</span>
      </div>
    );
  };

  const searchPaletteItems = sidebarSections.flatMap(sec => sec.items.map(x => ({ ...x, section: sec.title })));
  const filteredSearchItems = searchPaletteItems.filter(item =>
    item.label.toLowerCase().includes(searchPaletteQuery.toLowerCase())
  );

  // ── Sidebar nav item renderer ──
  const renderNavItem = (item: SidebarItem, onClick: () => void) => {
    const isActive = active === item.key;
    return (
      <button
        key={item.key}
        onClick={onClick}
        title={item.label}
        className={`flex w-full items-center rounded-xl py-2 text-left text-xs font-semibold transition-all duration-150 ${isActive ? "bg-sky-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          } ${isSidebarCollapsed ? "justify-center px-0" : "gap-2.5 px-3"}`}
      >
        {React.createElement(item.icon, { size: 15, className: "shrink-0", strokeWidth: 1.75 })}
        {!isSidebarCollapsed && <span className="flex-1 truncate">{item.label}</span>}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_45%,#edf7fd_100%)] text-slate-800">
      <Toaster position="top-right" richColors closeButton duration={3500} />

      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-4 px-3 py-3 lg:px-4 relative">

        {/* ── Desktop Sidebar ── */}
        <aside
          className={`hidden md:flex md:flex-col shrink-0 transition-all duration-300 sticky top-3 self-start ${isSidebarCollapsed ? "w-16" : "w-56"
            }`}
          style={{ height: "calc(100vh - 1.5rem)" }}
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm h-full flex flex-col overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Logo */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                {!isSidebarCollapsed && (
                  <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-sky-700">Radiant Rays</p>
                )}
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="rounded-full bg-slate-50 border border-slate-200 p-2 text-slate-400 hover:bg-slate-100 transition mx-auto"
                >
                  {isSidebarCollapsed ? "→" : "←"}
                </button>
              </div>

              {/* Profile */}
              <div className={`mt-3 rounded-2xl bg-sky-50 transition ${isSidebarCollapsed ? "p-2 flex justify-center" : "p-3"}`}>
                {isSidebarCollapsed ? (
                  <div className="h-8 w-8 rounded-full bg-sky-600 flex items-center justify-center text-white text-xs font-bold">
                    {session.name[0]}
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-bold text-slate-950 truncate">{session.name}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{session.email}</p>
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.25em] text-sky-700 bg-sky-100/60 px-2 py-0.5 rounded w-fit">
                      {session.role}
                    </p>
                  </>
                )}
              </div>

              {/* Nav */}
              <nav className="sidebar-nav mt-4 flex-1 overflow-y-auto space-y-0.5">
                {sidebarSections.map((sec, idx) => {
                  const allowed = sec.items.filter(item => item.key === "dashboard" || can(item.resource, "read"));
                  if (allowed.length === 0) return null;
                  return (
                    <div key={idx} className="space-y-0.5">
                      {!isSidebarCollapsed && sec.title && (
                        <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400 pl-3 pt-3 pb-0.5">
                          {sec.title}
                        </p>
                      )}
                      {allowed.map(item =>
                        renderNavItem(item, () => {
                          navigate("/" + item.key);
                          setFormError("");
                          setFormSuccess("");
                        })
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>

            {/* Sign out */}
            <div className="pt-3 border-t border-slate-100 mt-3 shrink-0">
              <button
                onClick={logout}
                className={`w-full rounded-xl border border-slate-200 py-2 text-xs font-bold text-slate-600 transition hover:border-rose-400 hover:text-rose-600 hover:bg-rose-50 ${isSidebarCollapsed ? "px-1 text-[10px]" : "px-3"
                  }`}
              >
                {isSidebarCollapsed ? "Out" : "Sign Out"}
              </button>
            </div>
          </div>
        </aside>

        {/* ── Mobile Drawer ── */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden bg-slate-950/40 backdrop-blur-sm">
            <div className="w-72 bg-white h-screen p-5 flex flex-col justify-between shadow-2xl relative">
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400"
              >
                ✕
              </button>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-sky-700 border-b border-slate-100 pb-3">
                  Radiant Rays
                </p>
                <div className="mt-4 rounded-2xl bg-sky-50 p-4">
                  <p className="text-sm font-bold text-slate-950">{session.name}</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{session.email}</p>
                </div>
                <nav className="mt-6 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                  {sidebarSections.map((sec, idx) => {
                    const allowed = sec.items.filter(item => item.key === "dashboard" || can(item.resource, "read"));
                    if (allowed.length === 0) return null;
                    return (
                      <div key={idx} className="space-y-1">
                        {sec.title && (
                          <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 pl-3">
                            {sec.title}
                          </p>
                        )}
                        {allowed.map(item => {
                          const isAct = active === item.key;
                          return (
                            <button
                              key={item.key}
                              onClick={() => {
                                navigate("/" + item.key);
                                setIsMobileSidebarOpen(false);
                                setFormError("");
                                setFormSuccess("");
                              }}
                              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold transition ${isAct ? "bg-sky-600 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                }`}
                            >
                              {React.createElement(item.icon, { size: 15, strokeWidth: 1.75 })}
                              <span>{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </nav>
              </div>
              <button onClick={logout} className="w-full rounded-2xl border border-slate-200 py-3 text-xs font-bold text-slate-700 hover:border-rose-400 hover:text-rose-600">
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* ── Main Content ── */}
        <main className="flex-1 space-y-4 min-w-0" onClick={() => { }}>

          {/* Header */}
          <header className="rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="block md:hidden p-2 rounded-full border border-slate-200 text-slate-600 bg-slate-50"
                >
                  ☰
                </button>
                <div>
                  {getBreadcrumbs()}
                  <h1 className="mt-1 text-xl font-bold text-slate-950 capitalize">
                    {active.replace(/([A-Z])/g, " $1")}
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsSearchPaletteOpen(true)}
                  className="hidden md:inline-flex items-center gap-2 rounded-full bg-slate-50 border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 transition"
                >
                  <span>🔍</span> Search console...
                  <kbd className="font-mono text-[9px] bg-slate-200/80 px-1 rounded font-bold">Ctrl+K</kbd>
                </button>
                <span className="hidden lg:inline-block rounded-full bg-sky-50 px-4 py-2 text-xs font-bold text-sky-800">
                  Secure API session
                </span>
                <button
                  onClick={() => loadSession()}
                  className="rounded-full border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Reload
                </button>
              </div>
            </div>
          </header>

          {/* ── Routed pages ── */}
          <Routes>
            <Route path="/products" element={<ProductsPage showToast={showToast} />} />
            <Route path="/products/add" element={<ProductForm showToast={showToast} can={can} />} />
            <Route path="/products/edit/:id" element={<ProductForm showToast={showToast} can={can} />} />
            <Route path="/categories" element={<CategoriesPage showToast={showToast} />} />
            <Route path="/subcategories" element={<CategoriesPage showToast={showToast} />} />
            <Route path="/customers" element={<CustomersPage showToast={showToast} />} />
            <Route path="/addresses" element={<AddressesPage showToast={showToast} />} />
            <Route path="/wishlist" element={<WishlistPage showToast={showToast} />} />
            <Route path="/leads" element={<LeadsPage showToast={showToast} />} />
            <Route path="/contactForms" element={<ContactFormsPage showToast={showToast} />} />
            <Route path="/newsletter" element={<NewsletterPage showToast={showToast} />} />
            <Route path="/testimonials" element={<TestimonialsPage showToast={showToast} />} />
            <Route path="/industries" element={<IndustriesPage showToast={showToast} />} />
            <Route path="/gallery" element={<GalleryPage showToast={showToast} />} />
            <Route path="/banners" element={<BannersPage showToast={showToast} />} />
            <Route path="/roles" element={<RolesPage showToast={showToast} can={can} />} />
            <Route path="/users" element={<UsersPage showToast={showToast} can={can} session={session} />} />
            <Route path="/settings" element={<SettingsPage showToast={showToast} />} />
          </Routes>

          {/* ── Dashboard ── */}
          {active === "dashboard" && (() => {
            const allProducts: any[] = dashboard?.products?.items || [];
            const allOrders: any[] = dashboard?.orders?.items || [];
            const allLeads: any[] = dashboard?.leads?.items || [];
            const categories: any[] = dashboard?.home?.categories || [];
            const industries: any[] = dashboard?.home?.industries || [];

            const b2bCount = allProducts.filter((p: any) => p.productType === "B2B").length;
            const b2cCount = allProducts.filter((p: any) => p.productType === "B2C").length;
            const productTypePie = [
              { name: "B2B", value: b2bCount, color: "#f59e0b" },
              { name: "B2C", value: b2cCount, color: "#10b981" },
            ];

            const orderStatuses = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];
            const orderStatusData = orderStatuses
              .map(s => ({ status: s.charAt(0) + s.slice(1).toLowerCase(), count: allOrders.filter((o: any) => o.status === s).length }))
              .filter(d => d.count > 0);

            const leadStatuses = ["NEW", "CONTACTED", "QUALIFIED", "QUOTED", "WON", "LOST"];
            const leadStatusData = leadStatuses
              .map(s => ({ status: s.charAt(0) + s.slice(1).toLowerCase(), count: allLeads.filter((l: any) => l.status === s).length }))
              .filter(d => d.count > 0);

            const now = new Date();
            const months = Array.from({ length: 6 }, (_, i) => {
              const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
              return { label: d.toLocaleString("default", { month: "short" }), year: d.getFullYear(), month: d.getMonth() };
            });
            const revenueData = months.map(m => ({
              month: m.label,
              revenue: allOrders.filter((o: any) => {
                const d = new Date(o.createdAt);
                return d.getFullYear() === m.year && d.getMonth() === m.month && o.paymentStatus === "PAID";
              }).reduce((s: number, o: any) => s + Number(o.total || 0), 0),
              orders: allOrders.filter((o: any) => {
                const d = new Date(o.createdAt);
                return d.getFullYear() === m.year && d.getMonth() === m.month;
              }).length,
            }));

            const totalRevenue = allOrders
              .filter((o: any) => o.paymentStatus === "PAID")
              .reduce((s: number, o: any) => s + Number(o.total || 0), 0);
            const activeProducts = allProducts.filter((p: any) => p.isActive).length;

            if (!dashboard) {
              return (
                <div className="space-y-5 animate-pulse">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-xl bg-slate-100" />)}
                  </div>
                  <div className="h-52 rounded-xl bg-slate-100" />
                  <div className="grid gap-4 lg:grid-cols-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-44 rounded-xl bg-slate-100" />)}
                  </div>
                </div>
              );
            }

            return (
              <div className="space-y-5">
                {/* Stat cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: "Total Products", value: allProducts.length, sub: `${activeProducts} active`, color: "bg-sky-50 text-sky-700" },
                    { label: "Categories", value: categories.length, sub: `${industries.length} industries`, color: "bg-violet-50 text-violet-700" },
                    { label: "Total Orders", value: allOrders.length, sub: `₹${totalRevenue.toLocaleString("en-IN")} revenue`, color: "bg-emerald-50 text-emerald-700" },
                    { label: "Total Leads", value: allLeads.length, sub: `${allLeads.filter((l: any) => l.status === "NEW").length} new`, color: "bg-amber-50 text-amber-700" },
                  ].map(({ label, value, sub, color }) => (
                    <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                      <p className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full w-fit ${color}`}>{label}</p>
                      <p className="text-2xl font-extrabold text-slate-950 mt-2">{value}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
                    </div>
                  ))}
                </div>

                {/* Revenue chart */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-extrabold text-slate-900 mb-4">Monthly Revenue & Orders</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={revenueData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                      <defs>
                        <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                        formatter={(val: any, name?: string | number) => [
                          name === "revenue" ? `₹${Number(val).toLocaleString("en-IN")}` : val,
                          name ?? "",
                        ]}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2} fill="url(#gRev)" dot={{ r: 3, fill: "#0ea5e9" }} />
                      <Area type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} fill="none" dot={{ r: 3, fill: "#10b981" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Bottom row */}
                <div className="grid gap-4 lg:grid-cols-3">
                  {/* Orders by status */}
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-extrabold text-slate-900 mb-4">Orders by Status</p>
                    {orderStatusData.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 text-slate-300">
                        <IconShoppingCart size={28} strokeWidth={1.5} />
                        <p className="text-xs mt-2">No orders yet</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={140}>
                        <BarChart data={orderStatusData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="status" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 11 }} />
                          <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Leads by status */}
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-extrabold text-slate-900 mb-4">Leads by Status</p>
                    {leadStatusData.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 text-slate-300">
                        <IconTarget size={28} strokeWidth={1.5} />
                        <p className="text-xs mt-2">No leads yet</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={140}>
                        <BarChart data={leadStatusData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="status" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 11 }} />
                          <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* B2B vs B2C */}
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-extrabold text-slate-900 mb-2">Products B2B vs B2C</p>
                    {allProducts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 text-slate-300">
                        <IconBox size={28} strokeWidth={1.5} />
                        <p className="text-xs mt-2">No products yet</p>
                      </div>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height={120}>
                          <PieChart>
                            <Pie data={productTypePie} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                              {productTypePie.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 11 }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex items-center justify-center gap-5 text-xs font-bold">
                          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" />B2B: {b2bCount}</span>
                          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />B2C: {b2cCount}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Recent products table */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                    <IconBox size={16} strokeWidth={1.75} className="text-slate-400" />
                    <p className="text-sm font-extrabold text-slate-900">Recent Products</p>
                    <span className="ml-auto text-[10px] font-bold text-slate-400">{allProducts.length} total</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <tr>
                          <th className="px-5 py-3 text-left">Product</th>
                          <th className="px-5 py-3 text-left">Type</th>
                          <th className="px-5 py-3 text-left">SKU</th>
                          <th className="px-5 py-3 text-left">Status</th>
                          <th className="px-5 py-3 text-right">Variants</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {allProducts.slice(0, 8).map((p: any) => (
                          <tr key={p.id} className="hover:bg-slate-50 transition">
                            <td className="px-5 py-3 font-semibold text-slate-900 max-w-48 truncate">{p.name}</td>
                            <td className="px-5 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${p.productType === "B2B" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                                {p.productType}
                              </span>
                            </td>
                            <td className="px-5 py-3 font-mono text-slate-500">{p.sku}</td>
                            <td className="px-5 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${p.isActive ? "bg-sky-50 text-sky-700" : "bg-slate-100 text-slate-400"}`}>
                                {p.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-right text-slate-500">{p.variants?.length ?? 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── All other views via ModuleView + simple inline sections ── */}
          <ModuleView
            active={active}
            data={activeData}
            busy={busy}
            can={can}
            apiFetch={apiFetch}
            showToast={showToast}
            loadResource={loadResource}
          />

        </main>
      </div>

      {/* ── Search Palette ── */}
      {isSearchPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/45 backdrop-blur-sm pt-20 px-4">
          <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-150 flex items-center justify-between">
              <span className="text-slate-400">🔍</span>
              <input
                type="text"
                autoFocus
                value={searchPaletteQuery}
                onChange={e => setSearchPaletteQuery(e.target.value)}
                placeholder="Search admin modules..."
                className="w-full pl-3 pr-4 py-2 text-sm outline-none bg-white text-slate-800"
              />
              <button
                onClick={() => setIsSearchPaletteOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold bg-slate-100 px-2 py-1 rounded-xl"
              >
                ESC
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {filteredSearchItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => {
                    navigate("/" + item.key);
                    setIsSearchPaletteOpen(false);
                    setSearchPaletteQuery("");
                  }}
                  className="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-sky-50 transition"
                >
                  {React.createElement(item.icon, { size: 16, className: "text-sky-600 shrink-0", strokeWidth: 1.75 })}
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                    {item.section && <p className="text-[10px] text-slate-400">{item.section}</p>}
                  </div>
                </button>
              ))}
              {filteredSearchItems.length === 0 && (
                <p className="px-5 py-4 text-sm text-slate-400 italic">No modules match "{searchPaletteQuery}"</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
