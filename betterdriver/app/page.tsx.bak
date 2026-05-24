import Link from "next/link";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { PROGRAMMES, EXTERNAL_LINKS } from "@/lib/constants";
import {
  ArrowRight,
  CheckCircle2,
  Award,
  BookOpen,
  TrendingUp,
  RefreshCw,
  User,
  Search,
  Shield,
  Zap,
  ChevronRight,
} from "lucide-react";

// DATA REQUIREMENTS:
// - No dynamic data on the public homepage
// - All content is static from lib/constants.ts
// - Impact numbers (if added) would come from /api/metrics

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", background: "#111827", display: "flex", flexDirection: "column" }}>
      <Navigation />

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          paddingTop: "8rem",
          paddingBottom: "5rem",
          overflow: "hidden",
        }}
      >
        {/* Radial glow */}
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 800,
            height: 600,
            background: "radial-gradient(circle, rgba(245, 158, 11, 0.07) 0%, transparent 70%)",
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />

        <div className="container" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem", position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
            <div className="pill pill-amber" style={{ marginBottom: "1.5rem", display: "inline-flex" }}>
              Driver Development Portal
            </div>

            <h1
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 800,
                fontSize: "clamp(2.25rem, 5vw, 3.75rem)",
                lineHeight: 1.1,
                color: "#F9FAFB",
                marginBottom: "1.5rem",
                letterSpacing: "-0.02em",
              }}
            >
              Train. Certify.{" "}
              <span
                style={{
                  background: "linear-gradient(90deg, #F59E0B 0%, #FCD34D 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Build your professional record.
              </span>
            </h1>

            <p
              style={{
                fontSize: "1.125rem",
                color: "#9CA3AF",
                lineHeight: 1.7,
                marginBottom: "2.5rem",
                maxWidth: 620,
                margin: "0 auto 2.5rem",
              }}
            >
              BetterDriver is where professional truck drivers enrol in training, complete programmes, earn recognised certification, and build a professional record that belongs to them.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.875rem", justifyContent: "center" }}>
              <Link href="/start" className="btn-primary">
                Get started <ArrowRight size={16} />
              </Link>
              <Link href="/login" className="btn-secondary">
                Log in to my portal
              </Link>
              <Link href="/registry" className="btn-secondary">
                <Search size={16} /> Verify a certificate
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── What you can do here ──────────────────────────────────────────────── */}
      <section style={{ padding: "5rem 0", background: "#0D1520" }}>
        <div className="container" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <div className="pill pill-amber" style={{ marginBottom: "1rem", display: "inline-flex" }}>What you can do here</div>
            <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "clamp(1.5rem, 3vw, 2.25rem)", color: "#F9FAFB", marginBottom: "0.75rem" }}>
              Everything in one place
            </h2>
            <p style={{ color: "#9CA3AF", maxWidth: 520, margin: "0 auto" }}>
              BetterDriver gives you a single, simple place to manage your professional development as a driver.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
            {[
              { icon: BookOpen, title: "Enrol in training", desc: "Browse programmes and enrol individually or through your company. Start immediately." },
              { icon: TrendingUp, title: "Complete your programme", desc: "Work through your modules at your own pace. Pick up where you left off, any time." },
              { icon: Award, title: "Earn certification", desc: "Complete your programme and receive recognised certification you can download and share." },
              { icon: RefreshCw, title: "Stay current with CPD", desc: "Quarterly CPD keeps your skills relevant and your certification active." },
              { icon: User, title: "Build your professional record", desc: "Your CV builder captures your training, certification, and experience in one place." },
              { icon: Search, title: "Appear in the registry", desc: "Certified drivers appear in the publicly searchable BetterDriver registry." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card" style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    background: "rgba(245, 158, 11, 0.12)",
                    border: "1px solid rgba(245, 158, 11, 0.2)",
                    borderRadius: "0.75rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#F59E0B",
                  }}
                >
                  <Icon size={20} />
                </div>
                <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "1rem", color: "#F9FAFB", margin: 0 }}>{title}</h3>
                <p style={{ color: "#9CA3AF", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Two paths ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: "5rem 0" }}>
        <div className="container" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <div className="pill pill-amber" style={{ marginBottom: "1rem", display: "inline-flex" }}>Two ways to enrol</div>
            <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "clamp(1.5rem, 3vw, 2.25rem)", color: "#F9FAFB", marginBottom: "0.75rem" }}>
              Individual driver or company campaign
            </h2>
            <p style={{ color: "#9CA3AF", maxWidth: 520, margin: "0 auto" }}>
              You can enrol directly as an individual, or your company can enrol you as part of a fleet-wide training campaign. The experience and pricing are the same.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
            {/* Individual */}
            <div
              style={{
                background: "#1C2333",
                border: "1px solid rgba(245, 158, 11, 0.25)",
                borderRadius: "1.25rem",
                padding: "2rem",
              }}
            >
              <div className="pill pill-amber" style={{ marginBottom: "1.25rem" }}>Individual driver</div>
              <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "1.25rem", color: "#F9FAFB", marginBottom: "1rem" }}>
                Enrol yourself
              </h3>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.5rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {[
                  "Browse and select your programme",
                  "Pay directly — R35/month for driver programmes",
                  "Start immediately after payment",
                  "Your certificate belongs to you",
                  "Appears in the public registry",
                ].map((item) => (
                  <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", color: "#9CA3AF", fontSize: "0.9rem" }}>
                    <CheckCircle2 size={16} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 2 }} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/start" className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                Get started <ArrowRight size={16} />
              </Link>
            </div>

            {/* Company */}
            <div
              style={{
                background: "#1C2333",
                border: "1px solid #2d3a4f",
                borderRadius: "1.25rem",
                padding: "2rem",
              }}
            >
              <div className="pill" style={{ marginBottom: "1.25rem", background: "rgba(59, 130, 246, 0.12)", color: "#3B82F6", border: "1px solid rgba(59, 130, 246, 0.25)" }}>
                Company campaign
              </div>
              <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "1.25rem", color: "#F9FAFB", marginBottom: "1rem" }}>
                Enrolled by your company
              </h3>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.5rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {[
                  "Your company sets up the campaign on GreenFreightAcademy",
                  "You receive an enrolment notification",
                  "Log in to BetterDriver to start",
                  "Your progress is visible to your company",
                  "Same training, same certification",
                ].map((item) => (
                  <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", color: "#9CA3AF", fontSize: "0.9rem" }}>
                    <CheckCircle2 size={16} style={{ color: "#3B82F6", flexShrink: 0, marginTop: 2 }} />
                    {item}
                  </li>
                ))}
              </ul>
              <a href={EXTERNAL_LINKS.gfa} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ width: "100%", justifyContent: "center", display: "flex" }}>
                Tell your company about GFA <ChevronRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────────── */}
      <section style={{ padding: "5rem 0", background: "#0D1520" }}>
        <div className="container" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <div className="pill pill-amber" style={{ marginBottom: "1rem", display: "inline-flex" }}>Pricing</div>
            <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "clamp(1.5rem, 3vw, 2.25rem)", color: "#F9FAFB", marginBottom: "0.75rem" }}>
              Priced for adoption
            </h2>
            <p style={{ color: "#9CA3AF", maxWidth: 520, margin: "0 auto" }}>
              Driver programmes are priced at R35 per driver per month — designed to remove the cost barrier to professional development at scale.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
            {PROGRAMMES.map((prog) => (
              <div
                key={prog.id}
                className="card"
                style={{
                  borderColor: prog.tier === 1 ? "rgba(245, 158, 11, 0.25)" : "#2d3a4f",
                  position: "relative",
                }}
              >
                {prog.tier === 1 && (
                  <div className="pill pill-amber" style={{ marginBottom: "0.875rem", fontSize: "0.6875rem" }}>
                    Most popular
                  </div>
                )}
                <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "1rem", color: "#F9FAFB", marginBottom: "0.375rem" }}>
                  {prog.shortTitle}
                </h3>
                <p style={{ color: "#6B7280", fontSize: "0.8125rem", marginBottom: "0.875rem" }}>{prog.audience}</p>
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 800,
                    fontSize: "1.375rem",
                    color: "#F59E0B",
                    marginBottom: "0.375rem",
                  }}
                >
                  {prog.priceLabel}
                </p>
                <p style={{ color: "#6B7280", fontSize: "0.8125rem", marginBottom: "1rem" }}>{prog.durationLabel}</p>
                <Link href={`/start?programme=${prog.slug}`} className="btn-secondary" style={{ fontSize: "0.875rem", justifyContent: "center", display: "flex" }}>
                  Enrol now
                </Link>
              </div>
            ))}
          </div>

          <p style={{ textAlign: "center", color: "#6B7280", fontSize: "0.875rem", marginTop: "2rem" }}>
            Payment processed securely.{" "}
            {/* TODO: Asif — add Paystack badge/logo here */}
            All prices include VAT.
          </p>
        </div>
      </section>

      {/* ── CPD ───────────────────────────────────────────────────────────────── */}
      <section style={{ padding: "5rem 0" }}>
        <div className="container" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "3rem", alignItems: "center" }}>
            <div>
              <div className="pill pill-amber" style={{ marginBottom: "1rem" }}>Continuous Professional Development</div>
              <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "clamp(1.5rem, 3vw, 2.25rem)", color: "#F9FAFB", marginBottom: "1rem" }}>
                Training does not stop at certification
              </h2>
              <p style={{ color: "#9CA3AF", lineHeight: 1.7, marginBottom: "1.5rem" }}>
                Quarterly CPD keeps your skills current and relevant to real operating conditions. Your company can also request urgent CPD interventions when a specific risk or incident needs to be addressed immediately.
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {[
                  "Quarterly CPD included in your subscription",
                  "Urgent interventions pushed within the month",
                  "CPD content informed by real field incidents",
                  "Keeps your certification active and relevant",
                ].map((item) => (
                  <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", color: "#9CA3AF", fontSize: "0.9rem" }}>
                    <CheckCircle2 size={16} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 2 }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {[
                { icon: RefreshCw, title: "Quarterly CPD", desc: "Structured quarterly updates keep your knowledge current.", color: "#F59E0B" },
                { icon: Zap, title: "Urgent interventions", desc: "When your company needs to address a risk now, it gets pushed to you within the month.", color: "#EF4444" },
                { icon: Shield, title: "Field-informed content", desc: "CPD content is shaped by real incidents and operational challenges from the industry.", color: "#10B981" },
              ].map(({ icon: Icon, title, desc, color }) => (
                <div key={title} className="card" style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      background: `${color}18`,
                      border: `1px solid ${color}30`,
                      borderRadius: "0.625rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color,
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <div>
                    <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "0.9375rem", color: "#F9FAFB", margin: "0 0 0.25rem" }}>{title}</h4>
                    <p style={{ color: "#9CA3AF", fontSize: "0.875rem", lineHeight: 1.5, margin: 0 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Registry ──────────────────────────────────────────────────────────── */}
      <section style={{ padding: "5rem 0", background: "#0D1520" }}>
        <div className="container" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "3rem", alignItems: "center" }}>
            <div>
              <div className="pill pill-amber" style={{ marginBottom: "1rem" }}>Driver Registry</div>
              <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "clamp(1.5rem, 3vw, 2.25rem)", color: "#F9FAFB", marginBottom: "1rem" }}>
                Your certification is publicly verifiable
              </h2>
              <p style={{ color: "#9CA3AF", lineHeight: 1.7, marginBottom: "1.5rem" }}>
                Every certified BetterDriver graduate appears in the publicly searchable driver registry. Employers, fleet operators, and industry partners can verify your certification instantly.
              </p>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <Link href="/registry" className="btn-primary">
                  <Search size={16} /> Search the registry
                </Link>
                <Link href="/start" className="btn-secondary">
                  Get certified
                </Link>
              </div>
            </div>

            <div
              style={{
                background: "#1C2333",
                border: "1px solid #2d3a4f",
                borderRadius: "1.25rem",
                padding: "1.5rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "0.9375rem", color: "#F9FAFB", margin: 0 }}>
                  Sample registry entry
                </h4>
                <span className="pill pill-green" style={{ fontSize: "0.6875rem" }}>Verified</span>
              </div>
              {[
                { name: "Sipho Dlamini", cert: "BD-2026-00127", programme: "Professional Truck Driver" },
                { name: "Thabo Mokoena", cert: "BD-2026-00089", programme: "Eco-Driver Training" },
                { name: "Nomsa Khumalo", cert: "BD-2026-00143", programme: "Professional Truck Driver" },
              ].map((entry) => (
                <div
                  key={entry.cert}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem 0",
                    borderBottom: "1px solid #2d3a4f",
                  }}
                >
                  <div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: "0.875rem", color: "#F9FAFB", margin: 0 }}>{entry.name}</p>
                    <p style={{ fontSize: "0.75rem", color: "#6B7280", margin: 0 }}>{entry.programme}</p>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "#9CA3AF", fontFamily: "monospace" }}>{entry.cert}</span>
                </div>
              ))}
              <p style={{ fontSize: "0.75rem", color: "#4B5563", marginTop: "0.75rem", marginBottom: 0 }}>
                ⚠ Demo data — Asif to connect live registry
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CV Builder ────────────────────────────────────────────────────────── */}
      <section style={{ padding: "5rem 0" }}>
        <div className="container" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <div className="pill pill-amber" style={{ marginBottom: "1rem", display: "inline-flex" }}>CV Builder</div>
            <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "clamp(1.5rem, 3vw, 2.25rem)", color: "#F9FAFB", marginBottom: "0.75rem" }}>
              Your professional record belongs to you
            </h2>
            <p style={{ color: "#9CA3AF", maxWidth: 520, margin: "0 auto" }}>
              BetterDriver builds a professional record that is yours — not your company's. Your training history, certifications, CPD completions, and work experience in one portable profile.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
            {[
              { title: "Training history", desc: "Every programme you have completed, with dates and status." },
              { title: "Certifications", desc: "Your certificates, downloadable and shareable at any time." },
              { title: "CPD record", desc: "Your ongoing CPD completions — evidence of continuous development." },
              { title: "Work experience", desc: "Add your employment history to build a complete professional profile." },
            ].map(({ title, desc }) => (
              <div key={title} className="card">
                <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "1rem", color: "#F9FAFB", marginBottom: "0.5rem" }}>{title}</h3>
                <p style={{ color: "#9CA3AF", fontSize: "0.875rem", lineHeight: 1.6, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────────── */}
      <section
        style={{
          padding: "5rem 0",
          background: "linear-gradient(135deg, #1C2333 0%, #111827 100%)",
          borderTop: "1px solid #2d3a4f",
        }}
      >
        <div className="container" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem", textAlign: "center" }}>
          <div className="pill pill-amber" style={{ marginBottom: "1.5rem", display: "inline-flex" }}>Ready to start</div>
          <h2
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(1.75rem, 4vw, 3rem)",
              color: "#F9FAFB",
              marginBottom: "1rem",
              letterSpacing: "-0.02em",
            }}
          >
            Become a better driver.{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #F59E0B 0%, #FCD34D 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Build your future.
            </span>
          </h2>
          <p style={{ color: "#9CA3AF", fontSize: "1.0625rem", marginBottom: "2.5rem", maxWidth: 480, margin: "0 auto 2.5rem" }}>
            Enrol today. Start your training. Earn your certificate. Your professional record starts here.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.875rem", justifyContent: "center" }}>
            <Link href="/start" className="btn-primary">
              Get started <ArrowRight size={16} />
            </Link>
            <Link href="/help" className="btn-secondary">
              Have a question?
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
