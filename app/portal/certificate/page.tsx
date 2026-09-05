"use client";

import { useState, useEffect } from "react";
import { Award, Download, Share2, CheckCircle2, AlertCircle } from "lucide-react";
import TranslatedPageHeader from "@/components/portal/TranslatedPageHeader";

export const dynamic = "force-dynamic";

interface CertificateData {
  id: string;
  certificateNumber: string;
  programmeName: string;
  programme: string;
  issuedAt: string;
  expiresAt?: string;
  status: string;
  verificationUrl: string;
}

interface ApiResponse {
  certificate: CertificateData | null;
  driver: { name: string };
  message?: string;
}

export default function PortalCertificatePage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch("/api/portal/certificate")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/portal/certificate/download");
      if (!res.ok) {
        console.error("Download failed:", res.status);
        return;
      }
      const html = await res.text();
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "BetterDriver_Certificate.html";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (data?.certificate?.verificationUrl) {
      try {
        if (navigator.share) {
          await navigator.share({
            title: "My BetterDriver Certificate",
            text: `I completed ${data.certificate.programmeName} on BetterDriver!`,
            url: data.certificate.verificationUrl,
          });
        } else {
          await navigator.clipboard.writeText(data.certificate.verificationUrl);
          alert("Verification link copied to clipboard!");
        }
      } catch {
        // User cancelled share or clipboard not available
      }
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <TranslatedPageHeader pageKey="certificate" />
        <div style={{ textAlign: "center", padding: "3rem", color: "#6B7280" }}>
          Loading your certificate…
        </div>
      </div>
    );
  }

  const cert = data?.certificate;
  const driverName = data?.driver?.name ?? "Driver";

  if (!cert) {
    return (
      <div className="page-content">
        <TranslatedPageHeader pageKey="certificate" />

        <div
          style={{
            background: "#1C2333",
            border: "1px solid #2d3a4f",
            borderRadius: "1.25rem",
            padding: "2.5rem",
            maxWidth: 560,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              background: "rgba(245,158,11,0.08)",
              border: "2px solid rgba(245,158,11,0.2)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
              color: "#6B7280",
            }}
          >
            <AlertCircle size={28} />
          </div>
          <h2
            style={{
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontWeight: 700,
              fontSize: "1.125rem",
              color: "#F9FAFB",
              marginBottom: "0.5rem",
            }}
          >
            Certificate not yet available
          </h2>
          <p style={{ color: "#9CA3AF", fontSize: "0.875rem", lineHeight: 1.5 }}>
            Complete your training programme to earn your professional certification.
            Your certificate will appear here once you finish all modules.
          </p>
        </div>
      </div>
    );
  }

  const issuedDate = new Date(cert.issuedAt).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="page-content">
      <TranslatedPageHeader pageKey="certificate" />

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
            Congratulations, {driverName.split(" ")[0]}!
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
            {driverName}
          </h2>
          <p style={{ color: "#9CA3AF", fontSize: "0.9rem" }}>has successfully completed</p>
          <h3 style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 700, fontSize: "1.125rem", color: "#F59E0B", marginBottom: "0.375rem" }}>
            {cert.programmeName}
          </h3>
          <p style={{ color: "#6B7280", fontSize: "0.875rem" }}>Issued {issuedDate}</p>
        </div>
        <div style={{ borderTop: "1px solid #2d3a4f", paddingTop: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: "0.75rem", color: "#6B7280", margin: "0 0 0.125rem" }}>Certificate number</p>
            <p style={{ fontFamily: "monospace", fontSize: "0.875rem", color: "#9CA3AF", margin: 0 }}>{cert.certificateNumber}</p>
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
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="btn-primary"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", opacity: downloading ? 0.6 : 1, cursor: downloading ? "wait" : "pointer" }}
        >
          <Download size={16} /> {downloading ? "Preparing…" : "Download PDF"}
        </button>
        <button
          onClick={handleShare}
          className="btn-secondary"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <Share2 size={16} /> Share certificate
        </button>
      </div>
    </div>
  );
}