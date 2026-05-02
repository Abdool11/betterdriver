import Link from "next/link";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

import {
  CheckCircle2,
  Mail,
  MessageCircle,
  ArrowRight,
  Building2,
  Users,
  Award,
  Smartphone,
} from "lucide-react";

import StartErrorBanner from "./StartErrorBanner";

export default function HowToJoinPage() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--color-bg)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Top bar */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.25rem",
          height: "3.5rem",
          background: "var(--color-bg-card)",
          borderBottom: "1px solid var(--color-border)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "0.5rem",
              background: "linear-gradient(135deg, #F59E0B, #D97706)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "0.875rem",
              color: "#0d1526",
            }}
          >
            BD
          </div>
          <span style={{ fontWeight: 700, fontSize: "1rem", color: "#F9FAFB" }}>BetterDriver</span>
        </Link>
        <Link
          href="/login"
          style={{
            padding: "0.5rem 1rem",
            background: "rgba(245,158,11,0.12)",
            border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: "0.5rem",
            color: "#F59E0B",
            fontWeight: 600,
            fontSize: "0.875rem",
            textDecoration: "none",
          }}
        >
          Log in
        </Link>
      </header>

      <main style={{ flex: 1, padding: "2rem 1.25rem", maxWidth: 600, margin: "0 auto", width: "100%" }}>
        <Suspense fallback={null}><StartErrorBanner /></Suspense>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.375rem 1rem",
              background: "rgba(245,158,11,0.1)",
              border: "1px solid rgba(245,158,11,0.25)",
              borderRadius: "9999px",
              color: "#F59E0B",
              fontSize: "0.8125rem",
              fontWeight: 600,
              marginBottom: "1.25rem",
            }}
          >
            <Award size={14} />
            Driver University Programme
          </div>
          <h1
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(1.75rem, 5vw, 2.25rem)",
              color: "#F9FAFB",
              lineHeight: 1.2,
              marginBottom: "1rem",
            }}
          >
            Your company has enrolled you in BetterDriver
          </h1>
          <p style={{ color: "#9CA3AF", fontSize: "1rem", lineHeight: 1.6, maxWidth: 480, margin: "0 auto" }}>
            BetterDriver is a professional development platform for drivers. Your employer has booked your place — you just need to activate your account using the link they sent you.
          </p>
        </div>

        {/* How it works */}
        <div
          style={{
            background: "#1C2333",
            border: "1px solid #2d3a4f",
            borderRadius: "1.25rem",
            padding: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <h2
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
              color: "#F9FAFB",
              marginBottom: "1.25rem",
            }}
          >
            How to get started
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {[
              {
                icon: Building2,
                title: "Your company booked your seat",
                desc: "Your transport company enrolled you through the Green Freight Academy. No payment is needed from you.",
              },
              {
                icon: MessageCircle,
                title: "Check your SMS or WhatsApp",
                desc: "You received a personal activation link via SMS or WhatsApp from BetterDriver. It looks like: betterdriver.co.za/activate?token=...",
              },
              {
                icon: Smartphone,
                title: "Tap your activation link",
                desc: "Open the link on your phone. You will land directly in your training portal — no password needed. It takes seconds.",
              },
              {
                icon: Award,
                title: "Begin your learning journey",
                desc: "Access Driver University, download course material on WiFi to save data, and earn your professional certification.",
              },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "0.625rem",
                    background: "rgba(245,158,11,0.12)",
                    border: "1px solid rgba(245,158,11,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <item.icon size={16} color="#F59E0B" />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#F9FAFB", margin: "0 0 0.25rem" }}>
                    {item.title}
                  </p>
                  <p style={{ fontSize: "0.875rem", color: "#9CA3AF", margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What you get */}
        <div
          style={{
            background: "#1C2333",
            border: "1px solid #2d3a4f",
            borderRadius: "1.25rem",
            padding: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <h2
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
              color: "#F9FAFB",
              marginBottom: "1rem",
            }}
          >
            What you get as a BetterDriver member
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[
              "Professional certification recognised across the industry",
              "Driver University — structured e-learning at your own pace",
              "Offline course material — download on WiFi, study anywhere",
              "CPD refresher modules released every quarter",
              "Digital CV builder — showcase your skills and certifications",
              "Your name in the verified driver registry",
            ].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
                <CheckCircle2 size={15} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: "0.875rem", color: "#D1D5DB", lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.05))",
            border: "1px solid rgba(245,158,11,0.25)",
            borderRadius: "1.25rem",
            padding: "1.5rem",
            textAlign: "center",
            marginBottom: "1.5rem",
          }}
        >
          <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "#F9FAFB", marginBottom: "0.5rem" }}>
            Already have your link?
          </h3>
          <p style={{ color: "#9CA3AF", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
            Tap your personal activation link from WhatsApp or SMS to go straight to your portal — no password required.
          </p>
        </div>

        {/* Didn't receive link */}
        <div
          style={{
            background: "#1C2333",
            border: "1px solid #2d3a4f",
            borderRadius: "1.25rem",
            padding: "1.25rem 1.5rem",
            marginBottom: "2rem",
          }}
        >
          <h3 style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#F9FAFB", marginBottom: "0.375rem" }}>
            Didn&apos;t receive your activation link?
          </h3>
          <p style={{ color: "#9CA3AF", fontSize: "0.875rem", lineHeight: 1.5, marginBottom: "1rem" }}>
            Check your SMS and WhatsApp inbox. If you still can&apos;t find it, speak to your fleet manager or HR department — they can request a new link through the Green Freight Academy.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link
              href="/help"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                padding: "0.5rem 1rem",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid #2d3a4f",
                borderRadius: "0.5rem",
                color: "#9CA3AF",
                fontSize: "0.8125rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <Mail size={14} /> Get help
            </Link>
            <a
              href="https://greenfreightacademy.co.za"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                padding: "0.5rem 1rem",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid #2d3a4f",
                borderRadius: "0.5rem",
                color: "#9CA3AF",
                fontSize: "0.8125rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <Users size={14} /> Green Freight Academy
            </a>
          </div>
        </div>

        <p style={{ textAlign: "center", color: "#4B5563", fontSize: "0.8125rem" }}>
          BetterDriver is a product of the{" "}
          <a href="https://transportactiongroup.com" target="_blank" rel="noopener noreferrer" style={{ color: "#6B7280" }}>
            Transport Action Group
          </a>
        </p>
      </main>
    </div>
  );
}
