"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Award, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface VerifyData {
  valid: boolean;
  driverName?: string;
  programmeName?: string;
  issuedAt?: string;
  certificateNumber?: string;
  status?: string;
}

export default function VerifyCertificatePage() {
  const params = useParams();
  const certNumber = params?.certNumber as string;
  const [data, setData] = useState<VerifyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/verify/${certNumber}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData({ valid: false }))
      .finally(() => setLoading(false));
  }, [certNumber]);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a1628",
      }}>
        <Loader2 size={32} style={{ color: "#f59e0b", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0a1628",
      padding: "2rem",
      fontFamily: "var(--font-dm-sans), Arial, sans-serif",
    }}>
      <div style={{
        background: "#1C2333",
        border: `2px solid ${data?.valid ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
        borderRadius: "1.5rem",
        padding: "2.5rem",
        maxWidth: 480,
        width: "100%",
        textAlign: "center",
      }}>
        <div style={{
          width: 64,
          height: 64,
          background: data?.valid ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
          border: `2px solid ${data?.valid ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.5rem",
        }}>
          {data?.valid ? (
            <CheckCircle2 size={28} style={{ color: "#10B981" }} />
          ) : (
            <XCircle size={28} style={{ color: "#EF4444" }} />
          )}
        </div>

        {data?.valid ? (
          <>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#F9FAFB", margin: "0 0 0.5rem" }}>
              Certificate Verified
            </h1>
            <p style={{ color: "#9CA3AF", fontSize: "0.875rem", margin: "0 0 2rem" }}>
              This is a legitimate BetterDriver certificate.
            </p>

            <div style={{ textAlign: "left" }}>
              <div style={{ marginBottom: "1rem" }}>
                <p style={{ fontSize: "0.75rem", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 0.25rem" }}>
                  Recipient
                </p>
                <p style={{ fontSize: "1.125rem", fontWeight: 700, color: "#F59E0B", margin: 0 }}>
                  {data.driverName}
                </p>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <p style={{ fontSize: "0.75rem", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 0.25rem" }}>
                  Programme
                </p>
                <p style={{ fontSize: "0.9375rem", color: "#F9FAFB", margin: 0 }}>
                  {data.programmeName}
                </p>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <p style={{ fontSize: "0.75rem", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 0.25rem" }}>
                  Certificate Number
                </p>
                <p style={{ fontFamily: "monospace", fontSize: "0.875rem", color: "#9CA3AF", margin: 0 }}>
                  {data.certificateNumber}
                </p>
              </div>

              <div>
                <p style={{ fontSize: "0.75rem", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 0.25rem" }}>
                  Issued
                </p>
                <p style={{ fontSize: "0.875rem", color: "#9CA3AF", margin: 0 }}>
                  {data.issuedAt}
                </p>
              </div>
            </div>

            <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #2d3a4f", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
              <Award size={16} style={{ color: "#F59E0B" }} />
              <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#F59E0B" }}>
                BetterDriver
              </span>
            </div>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#F9FAFB", margin: "0 0 0.5rem" }}>
              Certificate Not Found
            </h1>
            <p style={{ color: "#9CA3AF", fontSize: "0.875rem", margin: "0 0 1.5rem" }}>
              The certificate number <span style={{ fontFamily: "monospace", color: "#EF4444" }}>{certNumber}</span> could not be verified.
            </p>
            <p style={{ color: "#6B7280", fontSize: "0.8125rem", margin: 0 }}>
              Please check the number and try again, or contact support if you believe this is an error.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
