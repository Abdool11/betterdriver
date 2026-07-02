"use client";

import { useEffect, useState } from "react";
import { Award, Download, Share2, CheckCircle2 } from "lucide-react";
import TranslatedPageHeader from "@/components/portal/TranslatedPageHeader";

interface CertData {
  driverName: string;
  programmeName: string;
  certNumber: string;
  issuedDate: string;
  isComplete: boolean;
}

export default function PortalCertificatePage() {
  const [data, setData] = useState<CertData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/certificate")
      .then((r) => r.json())
      .then((d) => {
        const isComplete = d?.isComplete ?? false;
        const issuedDateRaw = d?.certificateIssuedAt;
        const issuedDate = issuedDateRaw
          ? new Date(issuedDateRaw).toLocaleDateString("en-ZA", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : "";

        setData({
          driverName: `${d?.driverName ?? ""}`.trim() || "Driver",
          programmeName: d?.programmeTitle || "The Professional Truck Driver Programme",
          certNumber: d?.certificateNumber ?? "",
          issuedDate,
          isComplete,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleDownload() {
    window.open("/api/portal/certificate/download", "_blank");
  }

  function handleShare() {
    const url = `${window.location.origin}/verify/${data?.certNumber ?? ""}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => alert("Public link copied to clipboard"));
    } else {
      alert(`Share this link: ${url}`);
    }
  }

  if (loading || !data) {
    return (
      <div className="page-content">
        <TranslatedPageHeader pageKey="certificate" />
        <p style={{ color: "#6B7280", fontSize: "0.875rem" }}>Loading certificate…</p>
      </div>
    );
  }

  const { driverName, programmeName, certNumber, issuedDate, isComplete } = data;

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
            {isComplete ? `Congratulations, ${driverName}!` : `Hi, ${driverName}`}
          </p>
          <p style={{ color: "#9CA3AF", fontSize: "0.875rem", margin: 0 }}>
            {isComplete
              ? `You have completed the ${programmeName} and earned your professional certification.`
              : `Complete the ${programmeName} to earn your professional certification.`}
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
            {programmeName}
          </h3>
          <p style={{ color: "#6B7280", fontSize: "0.875rem" }}>{issuedDate ? `Issued ${issuedDate}` : "Pending completion"}</p>
        </div>
        <div style={{ borderTop: "1px solid #2d3a4f", paddingTop: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: "0.75rem", color: "#6B7280", margin: "0 0 0.125rem" }}>Certificate number</p>
            <p style={{ fontFamily: "monospace", fontSize: "0.875rem", color: "#9CA3AF", margin: 0 }}>{certNumber || "—"}</p>
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
          className="btn-primary"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          onClick={handleDownload}
          disabled={!isComplete}
        >
          <Download size={16} /> Download PDF
        </button>
        <button
          className="btn-secondary"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          onClick={handleShare}
          disabled={!isComplete}
        >
          <Share2 size={16} /> Share certificate
        </button>
      </div>
    </div>
  );
}