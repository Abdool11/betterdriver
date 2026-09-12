"use client";

import Link from "next/link";
import { Award, ExternalLink, ShieldCheck } from "lucide-react";
import TranslatedPageHeader from "@/components/portal/TranslatedPageHeader";

const GFA_URL = process.env.NEXT_PUBLIC_GFA_URL?.replace(/\/$/, "") || "";

export const dynamic = "force-dynamic";

export default function PortalCertificatePage() {
  return (
    <div className="page-content">
      <TranslatedPageHeader pageKey="certificate" />

      <section style={{ background: "#1C2333", border: "1px solid #2d3a4f", borderRadius: "1.25rem", padding: "2rem", maxWidth: 620 }}>
        <div style={{ width: 64, height: 64, background: "rgba(20,184,166,0.1)", border: "2px solid rgba(20,184,166,0.25)", borderRadius: "50%", display: "grid", placeItems: "center", margin: "0 auto 1.25rem", color: "#14b8a6" }}><ShieldCheck size={29} /></div>
        <h1 style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 800, fontSize: "1.375rem", color: "#F9FAFB", textAlign: "center", margin: "0 0 0.625rem" }}>Your official certificate is managed by GFA</h1>
        <p style={{ color: "#9CA3AF", fontSize: "0.9rem", lineHeight: 1.6, textAlign: "center", margin: "0 auto 1.5rem", maxWidth: 500 }}>Green Freight Academy is the authoritative source for your professional qualification status, certificate PDF and certificate verification. BetterDriver records your learning delivery only; it does not issue a duplicate certificate.</p>

        <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.22)", borderRadius: "0.875rem", padding: "1rem", display: "flex", gap: "0.75rem", alignItems: "flex-start", marginBottom: "1.25rem" }}>
          <Award size={20} style={{ color: "#F59E0B", flexShrink: 0, marginTop: "0.1rem" }} />
          <div><h2 style={{ color: "#F9FAFB", fontSize: "0.95rem", margin: "0 0 0.25rem" }}>Certificate access is being connected</h2><p style={{ color: "#D1D5DB", fontSize: "0.8125rem", lineHeight: 1.5, margin: 0 }}>Once GFA’s approved secure certificate handoff is enabled, this page will open your own GFA record and allow the GFA-issued PDF to be downloaded. No certificate number, document or verification record is fabricated here.</p></div>
        </div>

        {GFA_URL ? <a href={GFA_URL} className="btn-primary" style={{ display: "inline-flex", width: "100%", boxSizing: "border-box", justifyContent: "center", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>Open Green Freight Academy <ExternalLink size={16} /></a> : <p style={{ color: "#FCD34D", fontSize: "0.8125rem", textAlign: "center", margin: 0 }}>The GFA certificate service link is being configured. Contact GFA support if you need a certificate urgently.</p>}
      </section>

      <p style={{ marginTop: "1.25rem", color: "#9CA3AF", fontSize: "0.8125rem" }}>Need help with your learning progress? <Link href="/portal/support" style={{ color: "#FCD34D" }}>Contact BetterDriver support</Link>.</p>
    </div>
  );
}
