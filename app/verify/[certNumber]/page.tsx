import { Metadata } from "next";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { CheckCircle2, XCircle, Award, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

interface VerifyResult {
  valid: boolean;
  driverName?: string;
  programme?: string;
  issuedAt?: string;
  certificateNumber?: string;
  status?: string;
  revokedAt?: string;
  error?: string;
}

async function verifyCertificate(certNumber: string): Promise<VerifyResult> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://betterdriver.co.za";
    const res = await fetch(`${baseUrl}/api/verify/${certNumber}`, {
      next: { revalidate: 300 }, // cache for 5 minutes
    });
    return await res.json();
  } catch {
    return { valid: false, error: "Verification service unavailable" };
  }
}

export async function generateMetadata({
  params,
}: {
  params: { certNumber: string };
}): Promise<Metadata> {
  return {
    title: `Verify Certificate ${params.certNumber} — BetterDriver`,
    description: "Verify the authenticity of a BetterDriver professional driver certificate.",
  };
}

export default async function VerifyPage({
  params,
}: {
  params: { certNumber: string };
}) {
  const certNumber = params.certNumber.toUpperCase();
  const result = await verifyCertificate(certNumber);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-ZA", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  return (
    <div style={{ minHeight: "100vh", background: "#111827", display: "flex", flexDirection: "column" }}>
      <Navigation />

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "6rem 1.5rem 4rem" }}>
        <div style={{ width: "100%", maxWidth: 520 }}>

          {/* Valid certificate */}
          {result.valid && (
            <div style={{
              background: "#1C2333",
              border: "2px solid rgba(16,185,129,0.4)",
              borderRadius: "1.5rem",
              padding: "2.5rem",
              textAlign: "center",
            }}>
              <div style={{
                width: 72, height: 72,
                background: "rgba(16,185,129,0.12)",
                border: "2px solid rgba(16,185,129,0.3)",
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 1.5rem",
              }}>
                <CheckCircle2 size={36} style={{ color: "#10B981" }} />
              </div>

              <div className="pill pill-green" style={{ marginBottom: "1rem", display: "inline-block" }}>
                Certificate Verified
              </div>

              <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: "1.5rem", color: "#F9FAFB", marginBottom: "0.375rem" }}>
                {result.driverName}
              </h1>
              <p style={{ color: "#9CA3AF", fontSize: "0.9375rem", marginBottom: "2rem" }}>
                has successfully completed
              </p>

              <div style={{
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.2)",
                borderRadius: "1rem",
                padding: "1.25rem",
                marginBottom: "2rem",
              }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "1.0625rem", color: "#F59E0B", margin: "0 0 0.5rem" }}>
                  {result.programme}
                </p>
                <p style={{ color: "#6B7280", fontSize: "0.875rem", margin: 0 }}>
                  Issued {result.issuedAt ? formatDate(result.issuedAt) : "—"}
                </p>
              </div>

              <div style={{ borderTop: "1px solid #2d3a4f", paddingTop: "1.25rem" }}>
                <p style={{ fontSize: "0.75rem", color: "#6B7280", margin: "0 0 0.25rem" }}>Certificate Number</p>
                <p style={{ fontFamily: "monospace", fontSize: "0.9375rem", color: "#9CA3AF", margin: 0 }}>
                  {result.certificateNumber}
                </p>
              </div>
            </div>
          )}

          {/* Revoked certificate */}
          {!result.valid && result.status === "revoked" && (
            <div style={{
              background: "#1C2333",
              border: "2px solid rgba(239,68,68,0.4)",
              borderRadius: "1.5rem",
              padding: "2.5rem",
              textAlign: "center",
            }}>
              <div style={{
                width: 72, height: 72,
                background: "rgba(239,68,68,0.12)",
                border: "2px solid rgba(239,68,68,0.3)",
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 1.5rem",
              }}>
                <XCircle size={36} style={{ color: "#EF4444" }} />
              </div>
              <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: "1.5rem", color: "#F9FAFB", marginBottom: "0.75rem" }}>
                Certificate Revoked
              </h1>
              <p style={{ color: "#9CA3AF", fontSize: "0.9375rem", marginBottom: "1rem" }}>
                Certificate <span style={{ fontFamily: "monospace" }}>{certNumber}</span> has been revoked
                {result.revokedAt ? ` on ${formatDate(result.revokedAt)}` : ""}.
              </p>
              <p style={{ color: "#6B7280", fontSize: "0.875rem" }}>
                Contact BetterDriver support if you believe this is an error.
              </p>
            </div>
          )}

          {/* Not found */}
          {!result.valid && result.status !== "revoked" && (
            <div style={{
              background: "#1C2333",
              border: "2px solid rgba(245,158,11,0.3)",
              borderRadius: "1.5rem",
              padding: "2.5rem",
              textAlign: "center",
            }}>
              <div style={{
                width: 72, height: 72,
                background: "rgba(245,158,11,0.08)",
                border: "2px solid rgba(245,158,11,0.2)",
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 1.5rem",
              }}>
                <AlertTriangle size={36} style={{ color: "#F59E0B" }} />
              </div>
              <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: "1.5rem", color: "#F9FAFB", marginBottom: "0.75rem" }}>
                Certificate Not Found
              </h1>
              <p style={{ color: "#9CA3AF", fontSize: "0.9375rem", marginBottom: "1rem" }}>
                No certificate with number <span style={{ fontFamily: "monospace", color: "#F59E0B" }}>{certNumber}</span> was found in the BetterDriver registry.
              </p>
              <p style={{ color: "#6B7280", fontSize: "0.875rem" }}>
                Check the certificate number and try again, or{" "}
                <a href="/registry" style={{ color: "#F59E0B", textDecoration: "none" }}>search the full registry</a>.
              </p>
            </div>
          )}

          {/* Back to registry link */}
          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <a href="/registry" style={{ color: "#6B7280", fontSize: "0.875rem", textDecoration: "none" }}>
              ← Back to Certificate Registry
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
