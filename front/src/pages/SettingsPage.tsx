/**
 * SettingsPage.tsx — full admin settings:
 * Company Info, SMTP, Cloudflare R2, Razorpay (with test), Shiprocket (with test)
 * All saved to DB via /content/settings API (key-value JSON)
 */
import React, { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";
import {
  IconBuilding, IconMail, IconCloud, IconCreditCard, IconTruck,
  IconChartBar, IconEye, IconEyeOff,
  IconAlertCircle, IconCircleCheck,
} from "@tabler/icons-react";

const inp = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-500 focus:bg-white transition";
const inpPwd = `${inp} font-mono tracking-wider`;

type Tab = "company" | "smtp" | "r2" | "razorpay" | "shiprocket" | "analytics";

function F({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
    </div>
  );
}

function PwdInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || "••••••••"}
        className={inpPwd}
      />
      <button type="button" onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition">
        {show ? <IconEyeOff size={16} /> : <IconEye size={16} />}
      </button>
    </div>
  );
}

function TestResult({ status }: { status: "idle" | "testing" | "ok" | "fail"; msg?: string }) {
  if (status === "idle") return null;
  if (status === "testing") return (
    <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
      <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-300 border-t-sky-600 animate-spin" />
      Testing connection…
    </div>
  );
  if (status === "ok") return (
    <div className="flex items-center gap-2 text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
      <IconCircleCheck size={14} /> Connected successfully!
    </div>
  );
  return (
    <div className="flex items-center gap-2 text-xs text-rose-700 font-semibold bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
      <IconAlertCircle size={14} /> {"Connection failed"}
    </div>
  );
}

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "company", label: "Company", icon: IconBuilding },
  { key: "smtp", label: "SMTP Email", icon: IconMail },
  { key: "r2", label: "R2 Storage", icon: IconCloud },
  { key: "razorpay", label: "Razorpay", icon: IconCreditCard },
  { key: "shiprocket", label: "Shiprocket", icon: IconTruck },
  { key: "analytics", label: "Analytics", icon: IconChartBar },
];

export default function SettingsPage({ showToast }: { showToast: (m: string, t?: "success" | "error" | "info") => void }) {
  const [tab, setTab] = useState<Tab>("company");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // All settings keyed
  const [company, setCompany] = useState({
    brandName: "Radiant Rays India", phone: "+91 731 815 8417 / +91 92117 81378",
    email: "info@radiantraysindia.com", gstin: "36AAAAA1111A1Z1",
    address: "Plot 42, Sector II, Tech Park, Hyderabad",
    website: "https://radiantraysindia.com",
  });
  const [smtp, setSmtp] = useState({
    host: "smtp-relay.brevo.com", port: "587",
    user: "", pass: "", from: "no-reply@radiantraysindia.com",
    fromName: "Radiant Rays India",
  });
  const [r2, setR2] = useState({
    accountId: "", accessKeyId: "", secretAccessKey: "",
    bucketName: "radiant-rays-assets", publicUrl: "",
  });
  const [razorpay, setRazorpay] = useState({ keyId: "", keySecret: "", webhookSecret: "" });
  const [shiprocket, setShiprocket] = useState({ email: "", password: "" });
  const [analytics, setAnalytics] = useState({ gaId: "", metaPixelId: "", gtagId: "" });

  // Test states
  const [smtpTest, setSmtpTest] = useState<"idle" | "testing" | "ok" | "fail">("idle");
  const [smtpTestMsg, setSmtpTestMsg] = useState("");
  const [rzpTest, setRzpTest] = useState<"idle" | "testing" | "ok" | "fail">("idle");
  const [rzpTestMsg, setRzpTestMsg] = useState("");
  const [srTest, setSrTest] = useState<"idle" | "testing" | "ok" | "fail">("idle");
  const [srTestMsg, setSrTestMsg] = useState("");

  // Load all settings from DB on mount
  useEffect(() => {
    apiFetch("/content/settings")
      .then((j: any) => {
        const list: any[] = j.data || [];
        const get = (key: string, fallback: any = {}) => {
          const found = list.find((s: any) => s.key === key);
          return found ? { ...fallback, ...found.value } : fallback;
        };
        setCompany(get("company_info", company));
        setSmtp(get("smtp_config", smtp));
        setR2(get("r2_config", r2));
        setRazorpay(get("razorpay_config", razorpay));
        setShiprocket(get("shiprocket_config", shiprocket));
        setAnalytics(get("analytics_config", analytics));
      })
      .catch(() => { }) // use defaults if no settings yet
      .finally(() => setLoading(false));
  }, []);

  const save = async (key: string, value: object) => {
    setSaving(true);
    try {
      await apiFetch("/content/settings", { method: "POST", body: JSON.stringify({ key, value }) });
      showToast("Settings saved successfully");
    } catch (e: any) { showToast(e.message || "Save failed", "error"); }
    finally { setSaving(false); }
  };

  const testSmtp = async () => {
    setSmtpTest("testing"); setSmtpTestMsg("");
    try {
      // Save first, then trigger test
      await apiFetch("/content/settings", { method: "POST", body: JSON.stringify({ key: "smtp_config", value: smtp }) });
      await apiFetch("/content/settings/test-smtp", { method: "POST" });
      setSmtpTest("ok");
    } catch (e: any) { setSmtpTest("fail"); setSmtpTestMsg(e.message || "SMTP connection failed"); }
  };

  const testRazorpay = async () => {
    setRzpTest("testing"); setRzpTestMsg("");
    try {
      await apiFetch("/content/settings", { method: "POST", body: JSON.stringify({ key: "razorpay_config", value: razorpay }) });
      await apiFetch("/content/settings/test-razorpay", { method: "POST" });
      setRzpTest("ok");
    } catch (e: any) { setRzpTest("fail"); setRzpTestMsg(e.message || "Razorpay keys invalid"); }
  };

  const testShiprocket = async () => {
    setSrTest("testing"); setSrTestMsg("");
    try {
      await apiFetch("/content/settings", { method: "POST", body: JSON.stringify({ key: "shiprocket_config", value: shiprocket }) });
      await apiFetch("/content/settings/test-shiprocket", { method: "POST" });
      setSrTest("ok");
    } catch (e: any) { setSrTest("fail"); setSrTestMsg(e.message || "Shiprocket login failed"); }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-12 bg-slate-100 rounded-xl" />
        <div className="h-96 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-extrabold text-slate-950">System Settings</h1>

      {/* Tab nav */}
      <div className="flex border-b border-slate-200 gap-0.5 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold whitespace-nowrap -mb-px border-b-2 transition ${tab === t.key ? "border-sky-700 text-sky-700" : "border-transparent text-slate-400 hover:text-slate-700"
              }`}>
            {React.createElement(t.icon, { size: 13 })} {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

        {/* ── COMPANY ── */}
        {tab === "company" && (
          <form onSubmit={e => { e.preventDefault(); save("company_info", company); }} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <F label="Brand Name *"><input value={company.brandName} onChange={e => setCompany(p => ({ ...p, brandName: e.target.value }))} className={inp} /></F>
              <F label="Support Phone"><input value={company.phone} onChange={e => setCompany(p => ({ ...p, phone: e.target.value }))} className={inp} placeholder="+91 40 12345678" /></F>
              <F label="Contact Email"><input type="email" value={company.email} onChange={e => setCompany(p => ({ ...p, email: e.target.value }))} className={inp} /></F>
              <F label="Website URL"><input value={company.website} onChange={e => setCompany(p => ({ ...p, website: e.target.value }))} className={inp} placeholder="https://radiantraysindia.com" /></F>
              <F label="GSTIN"><input value={company.gstin} onChange={e => setCompany(p => ({ ...p, gstin: e.target.value }))} className={inp} placeholder="36AAAAA1111A1Z1" /></F>
            </div>
            <F label="Corporate Address">
              <textarea value={company.address} onChange={e => setCompany(p => ({ ...p, address: e.target.value }))} rows={2} className={`${inp} resize-none`} />
            </F>
            <button type="submit" disabled={saving} className="rounded-xl bg-sky-700 hover:bg-sky-800 px-6 py-3 text-sm font-bold text-white transition disabled:opacity-60">
              {saving ? "Saving…" : "Save Company Info"}
            </button>
          </form>
        )}

        {/* ── SMTP ── */}
        {tab === "smtp" && (
          <form onSubmit={e => { e.preventDefault(); save("smtp_config", smtp); }} className="space-y-5">
            <div className="rounded-xl bg-sky-50 border border-sky-100 px-4 py-3 text-xs text-sky-700 font-semibold">
              Emails are sent via SMTP. Recommended: <strong>Brevo (smtp-relay.brevo.com:587)</strong>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <F label="SMTP Host"><input value={smtp.host} onChange={e => setSmtp(p => ({ ...p, host: e.target.value }))} className={inp} placeholder="smtp-relay.brevo.com" /></F>
              <F label="Port"><input value={smtp.port} onChange={e => setSmtp(p => ({ ...p, port: e.target.value }))} className={inp} placeholder="587" /></F>
              <F label="Username / Login Email"><input value={smtp.user} onChange={e => setSmtp(p => ({ ...p, user: e.target.value }))} className={inp} placeholder="your@brevo-login.com" /></F>
              <F label="SMTP API Key / Password"><PwdInput value={smtp.pass} onChange={v => setSmtp(p => ({ ...p, pass: v }))} placeholder="xkeysib-xxxxx" /></F>
              <F label="From Email"><input value={smtp.from} onChange={e => setSmtp(p => ({ ...p, from: e.target.value }))} className={inp} placeholder="no-reply@radiantraysindia.com" /></F>
              <F label="From Name"><input value={smtp.fromName} onChange={e => setSmtp(p => ({ ...p, fromName: e.target.value }))} className={inp} placeholder="Radiant Rays India" /></F>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" disabled={saving} className="rounded-xl bg-sky-700 hover:bg-sky-800 px-6 py-3 text-sm font-bold text-white transition disabled:opacity-60">
                {saving ? "Saving…" : "Save SMTP Settings"}
              </button>
              <button type="button" onClick={testSmtp} disabled={smtpTest === "testing"}
                className="rounded-xl border border-slate-200 hover:bg-slate-50 px-5 py-3 text-sm font-bold text-slate-700 transition disabled:opacity-60">
                Test Connection
              </button>
              <TestResult status={smtpTest} msg={smtpTestMsg} />
            </div>
          </form>
        )}

        {/* ── R2 ── */}
        {tab === "r2" && (
          <form onSubmit={e => { e.preventDefault(); save("r2_config", r2); }} className="space-y-5">
            <div className="rounded-xl bg-violet-50 border border-violet-100 px-4 py-3 text-xs text-violet-700 font-semibold">
              Cloudflare R2 is used for all image/file uploads. Create a bucket in Cloudflare Dashboard → R2.
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <F label="Account ID"><input value={r2.accountId} onChange={e => setR2(p => ({ ...p, accountId: e.target.value }))} className={inp} placeholder="abc123..." /></F>
              <F label="Bucket Name"><input value={r2.bucketName} onChange={e => setR2(p => ({ ...p, bucketName: e.target.value }))} className={inp} placeholder="radiant-rays-assets" /></F>
              <F label="Access Key ID"><input value={r2.accessKeyId} onChange={e => setR2(p => ({ ...p, accessKeyId: e.target.value }))} className={inp} /></F>
              <F label="Secret Access Key"><PwdInput value={r2.secretAccessKey} onChange={v => setR2(p => ({ ...p, secretAccessKey: v }))} /></F>
              <F label="Public Domain URL" hint="Your R2 custom domain or workers URL">
                <input value={r2.publicUrl} onChange={e => setR2(p => ({ ...p, publicUrl: e.target.value }))} className={inp} placeholder="https://assets.radiantraysindia.com" />
              </F>
            </div>
            <button type="submit" disabled={saving} className="rounded-xl bg-sky-700 hover:bg-sky-800 px-6 py-3 text-sm font-bold text-white transition disabled:opacity-60">
              {saving ? "Saving…" : "Save R2 Configuration"}
            </button>
          </form>
        )}

        {/* ── RAZORPAY ── */}
        {tab === "razorpay" && (
          <form onSubmit={e => { e.preventDefault(); save("razorpay_config", razorpay); }} className="space-y-5">
            <div className="rounded-xl bg-sky-50 border border-sky-100 px-4 py-3 text-xs text-sky-700 space-y-1">
              <p className="font-bold">Get keys from <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noopener noreferrer" className="underline">dashboard.razorpay.com → Settings → API Keys</a></p>
              <p>Use <code className="bg-sky-100 px-1 rounded">rzp_test_</code> keys for testing, <code className="bg-sky-100 px-1 rounded">rzp_live_</code> for production.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <F label="Key ID" hint="Starts with rzp_test_ or rzp_live_">
                <input value={razorpay.keyId} onChange={e => setRazorpay(p => ({ ...p, keyId: e.target.value }))} className={inp} placeholder="rzp_live_xxxxxxxxxx" />
              </F>
              <F label="Key Secret">
                <PwdInput value={razorpay.keySecret} onChange={v => setRazorpay(p => ({ ...p, keySecret: v }))} />
              </F>
              <F label="Webhook Secret" hint="Set in Razorpay Dashboard → Webhooks">
                <PwdInput value={razorpay.webhookSecret} onChange={v => setRazorpay(p => ({ ...p, webhookSecret: v }))} />
              </F>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" disabled={saving} className="rounded-xl bg-sky-700 hover:bg-sky-800 px-6 py-3 text-sm font-bold text-white transition disabled:opacity-60">
                {saving ? "Saving…" : "Save Razorpay Keys"}
              </button>
              <button type="button" onClick={testRazorpay} disabled={rzpTest === "testing" || !razorpay.keyId}
                className="rounded-xl border border-slate-200 hover:bg-slate-50 px-5 py-3 text-sm font-bold text-slate-700 transition disabled:opacity-60">
                Test Keys
              </button>
              <TestResult status={rzpTest} msg={rzpTestMsg} />
            </div>
          </form>
        )}

        {/* ── SHIPROCKET ── */}
        {tab === "shiprocket" && (
          <form onSubmit={e => { e.preventDefault(); save("shiprocket_config", shiprocket); }} className="space-y-5">
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-xs text-emerald-700 space-y-1">
              <p className="font-bold">Shiprocket credentials — same as your login at <a href="https://app.shiprocket.in" target="_blank" rel="noopener noreferrer" className="underline">app.shiprocket.in</a></p>
              <p>These are used to auto-create AWB bookings and sync tracking for B2C orders.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <F label="Login Email">
                <input type="email" value={shiprocket.email} onChange={e => setShiprocket(p => ({ ...p, email: e.target.value }))} className={inp} placeholder="logistics@radiantraysindia.com" />
              </F>
              <F label="Login Password">
                <PwdInput value={shiprocket.password} onChange={v => setShiprocket(p => ({ ...p, password: v }))} />
              </F>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" disabled={saving} className="rounded-xl bg-sky-700 hover:bg-sky-800 px-6 py-3 text-sm font-bold text-white transition disabled:opacity-60">
                {saving ? "Saving…" : "Save Shiprocket Credentials"}
              </button>
              <button type="button" onClick={testShiprocket} disabled={srTest === "testing" || !shiprocket.email}
                className="rounded-xl border border-slate-200 hover:bg-slate-50 px-5 py-3 text-sm font-bold text-slate-700 transition disabled:opacity-60">
                Test Login
              </button>
              <TestResult status={srTest} msg={srTestMsg} />
            </div>
          </form>
        )}

        {/* ── ANALYTICS ── */}
        {tab === "analytics" && (
          <form onSubmit={e => { e.preventDefault(); save("analytics_config", analytics); }} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <F label="Google Analytics G4 ID" hint="e.g. G-XXXXXXXXXX">
                <input value={analytics.gaId} onChange={e => setAnalytics(p => ({ ...p, gaId: e.target.value }))} className={inp} placeholder="G-XXXXXXXXXX" />
              </F>
              <F label="Google Tag Manager ID" hint="e.g. GTM-XXXXXXX">
                <input value={analytics.gtagId} onChange={e => setAnalytics(p => ({ ...p, gtagId: e.target.value }))} className={inp} placeholder="GTM-XXXXXXX" />
              </F>
              <F label="Meta Pixel ID">
                <input value={analytics.metaPixelId} onChange={e => setAnalytics(p => ({ ...p, metaPixelId: e.target.value }))} className={inp} placeholder="1234567890" />
              </F>
            </div>
            <button type="submit" disabled={saving} className="rounded-xl bg-sky-700 hover:bg-sky-800 px-6 py-3 text-sm font-bold text-white transition disabled:opacity-60">
              {saving ? "Saving…" : "Save Analytics IDs"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
