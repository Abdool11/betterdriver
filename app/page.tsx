import Link from "next/link";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";

export const dynamic = "force-dynamic";

import {
  ArrowRight,
  Award,
  BookOpen,
  TrendingUp,
  Search,
  Shield,
  Smartphone,
  CheckCircle2,
} from "lucide-react";

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", background: "#111827", display: "flex", flexDirection: "column" }}>
      <Navigation />

      {/* Hero */}
      <section style={{ position: "relative", paddingTop: "7rem", paddingBottom: "5rem", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", width: 700, height: 500, background: "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 1.5rem", position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.375rem 1rem", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "2rem", color: "#f59e0b", fontSize: "0.8125rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" as const, marginBottom: "1.75rem" }}>
              <Smartphone size={13} />
              Driver University
            </div>

            <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)", fontWeight: 900, color: "#f9fafb", lineHeight: 1.15, marginBottom: "1.25rem", letterSpacing: "-0.02em" }}>
              Your training.<br />
              <span style={{ color: "#f59e0b" }}>Your certification.</span><br />
              Your career record.
            </h1>

            <p style={{ fontSize: "1.125rem", color: "#9ca3af", lineHeight: 1.7, maxWidth: 540, margin: "0 auto 2.5rem" }}>
              BetterDriver is your professional development portal. Complete your training,
              earn your certification, and build a verified career record you own.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", alignItems: "center", marginBottom: "1.5rem" }}>
              <Link href="/activate" style={{ display: "inline-flex", alignItems: "center", gap: "0.625rem", padding: "0.9rem 2rem", background: "#f59e0b", color: "#111827", borderRadius: "0.75rem", fontWeight: 800, fontSize: "1rem", textDecoration: "none", width: "100%", maxWidth: 340, justifyContent: "center", boxShadow: "0 4px 24px rgba(245,158,11,0.3)" }}>
                Activate my account
                <ArrowRight size={18} />
              </Link>

              <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: "0.625rem", padding: "0.875rem 2rem", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#f9fafb", borderRadius: "0.75rem", fontWeight: 700, fontSize: "0.9375rem", textDecoration: "none", width: "100%", maxWidth: 340, justifyContent: "center" }}>
                Log in to my portal
              </Link>
            </div>

            <p style={{ color: "#6b7280", fontSize: "0.8125rem" }}>
              Received a WhatsApp or email from your employer?{" "}
              <Link href="/activate" style={{ color: "#f59e0b", textDecoration: "none", fontWeight: 600 }}>
                Tap here to activate your account.
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* What you can do here */}
      <section style={{ padding: "4rem 1.5rem", background: "#0d1117" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800, color: "#f9fafb", marginBottom: "0.75rem" }}>
            Everything in one place
          </h2>
          <p style={{ textAlign: "center", color: "#9ca3af", fontSize: "1rem", maxWidth: 520, margin: "0 auto 3rem" }}>
            Your Driver University gives you everything you need to train, certify, and build your professional record.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
            {[
              { icon: <BookOpen size={22} color="#f59e0b" />, title: "Driver University", desc: "Access your assigned training modules and complete your programme at your own pace — online or offline." },
              { icon: <Award size={22} color="#f59e0b" />, title: "Certification", desc: "Earn a verified digital certificate on completion. Share it with employers or download it any time." },
              { icon: <TrendingUp size={22} color="#f59e0b" />, title: "CV Builder", desc: "Build a professional CV from your profile, experience, and certifications — ready to download and share." },
              { icon: <Shield size={22} color="#f59e0b" />, title: "CPD Record", desc: "Your continuous professional development record grows with every module and refresh you complete." },
            ].map((item, i) => (
              <div key={i} style={{ background: "#161d2b", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "1rem", padding: "1.5rem" }}>
                <div style={{ width: 44, height: 44, background: "rgba(245,158,11,0.1)", borderRadius: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                  {item.icon}
                </div>
                <h3 style={{ color: "#f9fafb", fontWeight: 700, fontSize: "1rem", marginBottom: "0.5rem" }}>{item.title}</h3>
                <p style={{ color: "#6b7280", fontSize: "0.875rem", lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: "4rem 1.5rem" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800, color: "#f9fafb", marginBottom: "0.75rem" }}>
            How to get started
          </h2>
          <p style={{ textAlign: "center", color: "#9ca3af", fontSize: "1rem", marginBottom: "3rem" }}>
            Your employer has enrolled you through Green Freight Academy. Here is what happens next.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {[
              { step: "1", title: "Check your WhatsApp or email", desc: "You will receive an activation link from your employer via WhatsApp or email. Tap the link to begin." },
              { step: "2", title: "Activate your account", desc: "The link brings you directly to BetterDriver. Enter your details to activate your Driver University account." },
              { step: "3", title: "Complete your profile", desc: "Add your licence details, experience, and career history. This builds your professional record and CV." },
              { step: "4", title: "Start your training", desc: "Your assigned modules are ready in Driver University. Download them on WiFi to save data, then learn anywhere." },
            ].map((item) => (
              <div key={item.step} style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start", background: "#0d1117", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "1rem", padding: "1.25rem 1.5rem" }}>
                <div style={{ width: 36, height: 36, background: "#f59e0b", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#111827", fontWeight: 900, fontSize: "0.9375rem", flexShrink: 0 }}>
                  {item.step}
                </div>
                <div>
                  <h3 style={{ color: "#f9fafb", fontWeight: 700, fontSize: "0.9375rem", marginBottom: "0.25rem" }}>{item.title}</h3>
                  <p style={{ color: "#6b7280", fontSize: "0.875rem", lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Registry / Verify */}
      <section style={{ padding: "4rem 1.5rem", background: "#0d1117", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <div style={{ width: 52, height: 52, background: "rgba(245,158,11,0.1)", borderRadius: "1rem", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
            <Search size={24} color="#f59e0b" />
          </div>
          <h2 style={{ fontSize: "clamp(1.375rem, 3vw, 1.875rem)", fontWeight: 800, color: "#f9fafb", marginBottom: "0.75rem" }}>
            Verify a driver certificate
          </h2>
          <p style={{ color: "#9ca3af", fontSize: "1rem", lineHeight: 1.7, marginBottom: "2rem" }}>
            Employers and fleet managers can verify the certification status of any BetterDriver-trained driver
            using their certificate number or ID number.
          </p>
          <Link href="/registry" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.75rem", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b", borderRadius: "0.75rem", fontWeight: 700, fontSize: "0.9375rem", textDecoration: "none" }}>
            <Search size={16} />
            Verify a certificate
          </Link>
        </div>
      </section>

      {/* Trust strip */}
      <section style={{ padding: "3rem 1.5rem" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            {[
              { icon: <CheckCircle2 size={18} color="#22c55e" />, text: "Verifiable digital certificates" },
              { icon: <CheckCircle2 size={18} color="#22c55e" />, text: "Works offline — save data" },
              { icon: <CheckCircle2 size={18} color="#22c55e" />, text: "Mobile-first — built for drivers" },
              { icon: <CheckCircle2 size={18} color="#22c55e" />, text: "CV builder included" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.875rem 1rem", background: "#0d1117", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.75rem" }}>
                {item.icon}
                <span style={{ color: "#d1d5db", fontSize: "0.875rem", fontWeight: 600 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
