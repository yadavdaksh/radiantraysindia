"use client";

import { useState } from "react";
import { SiteShell } from "@/components/site-shell";
import { apiClient } from "@/lib/api-client";
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("General Inquiry");
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);

    if (!name || !email || !message) {
      setError("Please fill in all required fields.");
      setSubmitting(false);
      return;
    }

    try {
      await apiClient.post("/public/contact", {
        name,
        email,
        phone: phone || null,
        subject,
        message,
      });
      setSuccess(true);
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
      setSubject("General Inquiry");
    } catch (err: any) {
      console.error("Contact form submission failed:", err);
      setError(err?.response?.data?.message || "Failed to send message. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SiteShell
      title="Contact Our Team"
      subtitle="Request a quote, ask for technical specifications, or schedule a consultation with our cleanroom design engineers."
    >
      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] my-8">
        {/* Info Column */}
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-slate-950">Contact Information</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-2xl bg-brand/10 flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-brand" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Inquiry Desk</p>
                  <a href="mailto:info@radiantraysindia.com" className="text-sm font-semibold text-slate-900 hover:text-brand transition">
                    info@radiantraysindia.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-2xl bg-brand/10 flex items-center justify-center shrink-0">
                  <Phone className="h-5 w-5 text-brand" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Call Our Hotline</p>
                  <div className="flex flex-col">
                    <a href="tel:+919211781378" className="text-sm font-semibold text-slate-900 hover:text-brand transition">
                      +91 92117 81378
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-2xl bg-brand/10 flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5 text-brand" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Office</p>
                  <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                    JAGRAM 406/21, SHANTI NAGAR, GURUGRAM, HARYANA - 122022
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-brand/5 border border-brand/10 p-6 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">Design & Customization Requests</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              We design non-standard sizes, material grades (SS 304/316), and differential pressure integrations to match your GMP facility audits. Expect custom CAD drawings with quotes.
            </p>
          </section>
        </div>

        {/* Form Column */}
        <section className="rounded-3xl border border-slate-200 bg-[linear-gradient(160deg,#ffffff,_#f3f9fd)] p-8 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Send an Inquiry</h2>
            <p className="text-xs text-slate-500 mt-1">Our engineering desk will respond within 24 business hours.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Your Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. A.K. Sharma"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm placeholder-slate-400 outline-none focus:border-brand ring-brand/10 focus:ring-4 transition"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Email Address <span className="text-rose-500">*</span></label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. sharma@pharma.com"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm placeholder-slate-400 outline-none focus:border-brand ring-brand/10 focus:ring-4 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 99999 99999"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm placeholder-slate-400 outline-none focus:border-brand ring-brand/10 focus:ring-4 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Inquiry Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand ring-brand/10 focus:ring-4 transition"
                >
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Product Quotation">Request Product Quotation</option>
                  <option value="Custom Specification">Custom Size/Design Request</option>
                  <option value="Order Support">Order Tracking & Support</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Requirements details <span className="text-rose-500">*</span></label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Detail your size requirements, airflow config, cleanroom class level or specific product questions..."
                  className="w-full min-h-32 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm placeholder-slate-400 outline-none focus:border-brand ring-brand/10 focus:ring-4 transition resize-none"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Message sent successfully! One of our design engineers will contact you shortly.</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand hover:bg-brand-dark px-5 py-3.5 text-sm font-bold text-white transition disabled:opacity-50 cursor-pointer shadow-md"
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Sending Inquiry...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Request Quote / Submit
                  </>
                )}
              </button>
            </form>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
