import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Award, CheckCircle2, ShieldCheck } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Navigation } from "@/components/layout/Navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Certificate Verification",
  description: "Official driver certificate verification is provided by Green Freight Academy.",
};

const GFA_URL = process.env.NEXT_PUBLIC_GFA_URL?.replace(/\/$/, "") || "";

export default function RegistryPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#111827", display: "flex", flexDirection: "column" }}>
      <Navigation />
      <main style={{ flex: 1, paddingTop: "6rem" }}>
        <section style={{ padding: "4rem 0", background: "#0D1520", borderBottom: "1px solid #2d3a4f" }}>
          <div className="container" style={{ maxWidth: 760, margin: "0 auto", padding: "0 1.5rem" }}>
            <div className="pill pill-amber" style={{ marginBottom: "1rem" }}>Certificate verification</div>
            <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: "clamp(1.75rem, 4vw, 2.75rem)", color: "#F9FAFB", margin: "0 0 0.75rem" }}>Verify a driver qualification</h1>
            <p style={{ color: "#9CA3AF", maxWidth: 620, lineHeight: 1.7, margin: 0 }}>Green Freight Academy is the official source for professional driver certificate status, certificate PDFs and public verification. BetterDriver delivers learning and does not maintain a separate public certificate register.</p>
          </div>
        </section>

        <section style={{ padding: "2rem 0 4rem" }}>
          <div className="container" style={{ maxWidth: 760, margin: "0 auto", padding: "0 1.5rem" }}>
            <div style={{ background: "#1C2333", border: "1px solid #2d3a4f", borderRadius: "1.25rem", padding: "1.5rem", display: "grid", gap: "1.25rem" }}>
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                <div style={{ width: 44, height: 44, display: "grid", placeItems: "center", background: "rgba(20,184,166,0.1)", borderRadius: "50%", color: "#14b8a6", flexShrink: 0 }}><ShieldCheck size={22} /></div>
                <div>
                  <h2 style={{ color: "#F9FAFB", fontSize: "1.125rem", margin: "0 0 0.375rem" }}>Use the official GFA verification service</h2>
                  <p style={{ color: "#9CA3AF", lineHeight: 1.55, margin: 0 }}>GFA controls the verified certificate record and returns only the information approved for public verification. This protects driver personal information and prevents duplicate records.</p>
                </div>
              </div>

              {GFA_URL ? (
                <a href={GFA_URL} style={{ display: "inline-flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", padding: "0.8rem 1rem", borderRadius: "0.75rem", background: "#F59E0B", color: "#111827", textDecoration: "none", fontWeight: 800 }}>
                  Open Green Freight Academy <ArrowUpRight size={17} />
                </a>
              ) : (
                <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "0.75rem", padding: "1rem", color: "#FCD34D", fontSize: "0.875rem" }}>The GFA verification service link is being configured. Please contact Green Freight Academy for official verification.</div>
              )}
            </div>

            <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem", alignItems: "flex-start", color: "#9CA3AF", fontSize: "0.8125rem", lineHeight: 1.5 }}><CheckCircle2 size={17} style={{ color: "#10B981", flexShrink: 0, marginTop: "0.1rem" }} /><span>BetterDriver no longer displays sample driver names, ID numbers or certificate numbers. A driver’s official qualification is issued and verified by GFA.</span></div>
            <p style={{ marginTop: "1.5rem", color: "#6B7280", fontSize: "0.875rem" }}>Are you a driver looking for your own learning record? <Link href="/start" style={{ color: "#FCD34D" }}>Open BetterDriver</Link> using your authorised link.</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
