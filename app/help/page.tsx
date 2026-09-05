import { Metadata } from "next";
import Link from "next/link";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { FAQS, EXTERNAL_LINKS } from "@/lib/constants";
import { HelpCircle, MessageSquare, Phone, Mail } from "lucide-react";
import { getConfigs } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// DATA REQUIREMENTS:
// - faqs: FAQ[] — from lib/constants.ts (static)
// - support contact details: from site_config table (bd_support_email, bd_support_phone, bd_whatsapp_number)

export const metadata: Metadata = {
  title: "Help",
  description: "Get help with BetterDriver — FAQs, login support, and contact options.",
};

export default async function HelpPage() {
  const config = await getConfigs(["bd_support_email", "bd_support_phone", "bd_whatsapp_number"]);

  const supportEmail = config["bd_support_email"] || process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@betterdriver.co.za";
  const supportPhone = config["bd_support_phone"] || process.env.NEXT_PUBLIC_SUPPORT_PHONE || "+27 000 000 0000";
  const whatsappNumber = config["bd_whatsapp_number"] || "27000000000";

  return (
    <div style={{ minHeight: "100vh", background: "#111827", display: "flex", flexDirection: "column" }}>
      <Navigation />

      <main style={{ flex: 1, paddingTop: "6rem" }}>
        {/* Header */}
        <section style={{ padding: "3rem 0 2rem", background: "#0D1520", borderBottom: "1px solid #2d3a4f" }}>
          <div className="container" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" }}>
            <div className="pill pill-amber" style={{ marginBottom: "1rem" }}>Help</div>
            <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: "clamp(1.75rem, 4vw, 2.75rem)", color: "#F9FAFB", marginBottom: "0.75rem" }}>
              How can we help?
            </h1>
            <p style={{ color: "#9CA3AF", maxWidth: 520, lineHeight: 1.7 }}>
              Find answers to common questions, get help with login, or contact our support team.
            </p>
          </div>
        </section>

        {/* Contact options */}
        <section style={{ padding: "3rem 0" }}>
          <div className="container" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem", marginBottom: "3rem" }}>
              {[
                { icon: MessageSquare, title: "WhatsApp support", desc: "Message us on WhatsApp for the fastest response.", action: "Message us", href: `https://wa.me/${whatsappNumber}`, color: "#10B981" },
                { icon: Mail, title: "Email support", desc: "Send us an email and we will respond within one business day.", action: "Send email", href: `mailto:${supportEmail}`, color: "#3B82F6" },
                { icon: Phone, title: "Call us", desc: "Speak to a support agent during business hours (Mon–Fri, 8am–5pm).", action: "Call now", href: `tel:${supportPhone}`, color: "#F59E0B" },
              ].map(({ icon: Icon, title, desc, action, href, color }) => (
                <div key={title} className="card" style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                  <div style={{ width: 44, height: 44, background: `${color}18`, border: `1px solid ${color}30`, borderRadius: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", color }}>
                    <Icon size={20} />
                  </div>
                  <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "1rem", color: "#F9FAFB", margin: 0 }}>{title}</h3>
                  <p style={{ color: "#9CA3AF", fontSize: "0.875rem", lineHeight: 1.6, margin: 0, flex: 1 }}>{desc}</p>
                  <a href={href} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ fontSize: "0.875rem", justifyContent: "center", display: "flex" }}>
                    {action}
                  </a>
                </div>
              ))}
            </div>

            {/* FAQs */}
            <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "1.375rem", color: "#F9FAFB", marginBottom: "1.5rem" }}>
              Frequently asked questions
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: 720 }}>
              {FAQS.map((faq, i) => (
                <div
                  key={i}
                  className="card"
                  style={{ padding: "1.25rem 1.5rem" }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem" }}>
                    <HelpCircle size={18} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "0.9375rem", color: "#F9FAFB", margin: "0 0 0.5rem" }}>
                        {faq.question}
                      </h3>
                      <p style={{ color: "#9CA3AF", fontSize: "0.875rem", lineHeight: 1.6, margin: 0 }}>
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Ecosystem note */}
            <div
              style={{
                background: "#1C2333",
                border: "1px solid #2d3a4f",
                borderRadius: "1.25rem",
                padding: "1.5rem 2rem",
                marginTop: "3rem",
                maxWidth: 720,
              }}
            >
              <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "1rem", color: "#F9FAFB", marginBottom: "0.5rem" }}>
                Are you a fleet operator or training manager?
              </h3>
              <p style={{ color: "#9CA3AF", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "1rem" }}>
                BetterDriver is the driver-facing portal. If you are looking to enrol your fleet, manage training campaigns, or access compliance reporting, visit GreenFreightAcademy.
              </p>
              <a href={EXTERNAL_LINKS.gfa} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ fontSize: "0.875rem", display: "inline-flex" }}>
                Visit GreenFreightAcademy →
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
