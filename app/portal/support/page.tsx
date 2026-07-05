"use client";

import { useState } from "react";
import { MessageCircle, Phone, Mail, HelpCircle, CheckCircle2 } from "lucide-react";
import TranslatedPageHeader from "@/components/portal/TranslatedPageHeader";

const FAQS = [
  {
    q: "I cannot log in — what should I do?",
    a: "Make sure you are using the mobile number or email address you registered with. If you have forgotten your password, use the 'Forgot password' link on the login screen. If you still cannot get in, contact us below.",
  },
  {
    q: "My training is not showing as complete even though I finished it.",
    a: "Progress updates from the training platform can take up to 30 minutes to reflect here. If it has been longer than that, please contact your company training coordinator or reach out to us directly.",
  },
  {
    q: "How do I download my certificate?",
    a: "Go to My Certificate in the left menu. Once your programme is complete, a Download PDF button will appear. If your certificate is not showing, please contact support.",
  },
  {
    q: "What is CPD and why do I need to do it?",
    a: "CPD stands for Continuing Professional Development. It is short, regular training that keeps your skills current and your certification valid. Your company or the training team will notify you when a CPD session is due.",
  },
  {
    q: "Can I do training on my phone?",
    a: "Yes. BetterDriver and the training platform are designed to work on any smartphone. You do not need a computer.",
  },
];

export default function SupportPage() {
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !message.trim() || message.trim().length < 5) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/portal/support-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, message: message.trim() }),
      });
      if (res.ok) {
        setSent(true);
        setCategory("");
        setMessage("");
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  }

  const supportEmail = "support@betterdriver.co.za";
  const supportPhone = "+27 000 000 0000";
  const whatsappNumber = "27000000000";

  return (
    <div className="page-content">
      <TranslatedPageHeader pageKey="support" />

      {/* Contact options */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          {
            icon: <MessageCircle size={20} style={{ color: "#F59E0B" }} />,
            label: "Chat with us",
            value: "Available Mon–Fri, 8am–5pm",
            href: `https://wa.me/${whatsappNumber}`,
          },
          {
            icon: <Phone size={20} style={{ color: "#10B981" }} />,
            label: "Call us",
            value: supportPhone,
            href: `tel:${supportPhone}`,
          },
          {
            icon: <Mail size={20} style={{ color: "#3B82F6" }} />,
            label: "Email us",
            value: supportEmail,
            href: `mailto:${supportEmail}`,
          },
        ].map(({ icon, label, value, href }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "#1C2333",
              border: "1px solid #2d3a4f",
              borderRadius: "1rem",
              padding: "1.25rem",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.875rem",
              textDecoration: "none",
            }}
          >
            <div style={{ marginTop: "0.125rem" }}>{icon}</div>
            <div>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#F9FAFB", margin: "0 0 0.25rem" }}>
                {label}
              </p>
              <p style={{ fontSize: "0.8125rem", color: "#9CA3AF", margin: 0 }}>{value}</p>
            </div>
          </a>
        ))}
      </div>

      {/* FAQs */}
      <div style={{ marginBottom: "2rem" }}>
        <h2
          style={{
            fontFamily: "var(--font-dm-sans), sans-serif",
            fontWeight: 700,
            fontSize: "1.125rem",
            color: "#F9FAFB",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <HelpCircle size={18} style={{ color: "#F59E0B" }} /> Common questions
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {FAQS.map(({ q, a }) => (
            <div
              key={q}
              style={{
                background: "#1C2333",
                border: "1px solid #2d3a4f",
                borderRadius: "1rem",
                padding: "1.25rem",
              }}
            >
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#F9FAFB", margin: "0 0 0.5rem" }}>
                {q}
              </p>
              <p style={{ fontSize: "0.875rem", color: "#9CA3AF", margin: 0, lineHeight: 1.6 }}>{a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact form */}
      <div
        style={{
          background: "#1C2333",
          border: "1px solid #2d3a4f",
          borderRadius: "1.25rem",
          padding: "1.75rem",
        }}
      >
        <h2 style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 700, fontSize: "1.0625rem", color: "#F9FAFB", marginBottom: "1.25rem" }}>
          Send us a message
        </h2>
        {sent ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#10B981", fontSize: "0.9375rem" }}>
            <CheckCircle2 size={18} /> Your message has been sent. We will get back to you soon.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#6B7280", marginBottom: "0.375rem" }}>
                What do you need help with?
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                style={{
                  width: "100%",
                  background: "#243044",
                  border: "1px solid #2d3a4f",
                  borderRadius: "0.625rem",
                  padding: "0.625rem 0.875rem",
                  color: "#F9FAFB",
                  fontSize: "0.875rem",
                  outline: "none",
                }}
              >
                <option value="">Select a topic</option>
                <option value="login">Login or access problem</option>
                <option value="training">Training or course issue</option>
                <option value="certificate">Certificate not showing</option>
                <option value="cpd">CPD question</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#6B7280", marginBottom: "0.375rem" }}>
                Message
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue..."
                required
                minLength={5}
                style={{
                  width: "100%",
                  background: "#243044",
                  border: "1px solid #2d3a4f",
                  borderRadius: "0.625rem",
                  padding: "0.625rem 0.875rem",
                  color: "#F9FAFB",
                  fontSize: "0.875rem",
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={submitting} style={{ alignSelf: "flex-start" }}>
              {submitting ? "Sending…" : "Send message"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}