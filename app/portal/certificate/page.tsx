import { Metadata } from "next";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { MOCK_DRIVER, MOCK_CERTIFICATE } from "@/lib/constants";
import { Award, Download, Share2, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";


// DATA REQUIREMENTS:
// - driver: Driver — from Supabase auth session
// - certificate: Certificate | null — Supabase: SELECT * FROM certifications WHERE driver_id = ? AND status = 'active' ORDER BY issued_at DESC LIMIT 1
// TODO: Asif — replace mock data with live Supabase query
// TODO: Asif — implement PDF download via /api/certificate/download?id=

export const metadata: Metadata = { title: "My Certificate" };

export default function PortalCertificatePage() {
  const driver = MOCK_DRIVER;
  const cert = MOCK_CERTIFICATE;

  return (
    <PortalLayout>
      <div className="mock-banner" style={{ marginBottom: "1.5rem" }}>
        MOCK DATA — Asif to connect live Supabase certifications query
      </div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 800, fontSize: "1.75rem", color: "#F9FAFB", margin: "0 0 0.375rem" }}>
          My Certificate
        </h1>
        <p style={{ color: "#9CA3AF", margin: 0 }}>Your recognised professional certification.</p>
      </div>

      {/* Congratulations banner */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(252,211,77,0.08) 100%)",
          border: "1px solid rgba(245,158,11,0.3)",
          borderRadius: "1.25rem",
          padding: "1.5rem 2rem",
          marginBottom: "2rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <Award size={32} style={{ color: "#F59E0B", flexShrink: 0 }} />
        <div>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 700, fontSize: "1.0625rem", color: "#F9FAFB", margin: "0 0 0.25rem" }}>
            Congratulations, {driver.name.split(" ")[0]}!
          </p>
          <p style={{ color: "#9CA3AF", fontSize: "0.875rem", margin: 0 }}>
            You have completed the {cert.programmeName} and earned your professional certification.
          </p>
        </div>
      </div>

      {/* Certificate card */}
      <div
        style={{
          background: "#1C2333",
          border: "2px solid rgba(245,158,11,0.3)",
          borderRadius: "1.5rem",
          padding: "2.5rem",
          maxWidth: 560,
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: 64,
              height: 64,
              background: "rgba(245,158,11,0.12)",
              border: "2px solid rgba(245,158,11,0.3)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
              color: "#F59E0B",
            }}
          >
            <Award size={28} />
          </div>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
            Certificate of Completion
          </p>
          <h2 style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 800, fontSize: "1.375rem", color: "#F9FAFB", marginBottom: "0.375rem" }}>
            {driver.name}
          </h2>
          <p style={{ color: "#9CA3AF", fontSize: "0.9rem" }}>has successfully completed</p>
          <h3 style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 700, fontSize: "1.125rem", color: "#F59E0B", marginBottom: "0.375rem" }}>
            {cert.programmeName}
          </h3>
          <p style={{ color: "#6B7280", fontSize: "0.875rem" }}>Issued {cert.issuedDate}</p>
        </div>
        <div style={{ borderTop: "1px solid #2d3a4f", paddingTop: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: "0.75rem", color: "#6B7280", margin: "0 0 0.125rem" }}>Certificate number</p>
            <p style={{ fontFamily: "monospace", fontSize: "0.875rem", color: "#9CA3AF", margin: 0 }}>{cert.certNumber}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <CheckCircle2 size={16} style={{ color: "#10B981" }} />
            <span className="pill pill-green" style={{ fontSize: "0.6875rem" }}>
              Verified
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.875rem", flexWrap: "wrap" }}>
        {/* TODO: Asif — implement PDF download via /api/certificate/download?id= */}
        <button
          className="btn-primary"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <Download size={16} /> Download PDF
        </button>
        <button
          className="btn-secondary"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <Share2 size={16} /> Share certificate
        </button>
      </div>
    </PortalLayout>
  );
}
