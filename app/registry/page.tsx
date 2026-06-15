import { Metadata } from "next";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { supabaseAdmin } from "@/lib/supabase";
import { Search, CheckCircle2, Award } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Certificate Registry",
  description: "Publicly verifiable registry of BetterDriver certified professional drivers. Verify any certificate by driver name, ID number, or certificate number.",
};

export default async function RegistryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams.q?.toLowerCase() ?? "";

  const { data: certifications } = await supabaseAdmin
    .from("certifications")
    .select("certificate_number, issued_at, programme, driver:driver_id(first_name, last_name)")
    .eq("status", "active")
    .order("issued_at", { ascending: false })
    .limit(50);

  const results = (certifications ?? []).filter((entry: any) => {
    if (!q) return true;
    const name = `${entry.driver?.first_name ?? ""} ${entry.driver?.last_name ?? ""}`.toLowerCase();
    return name.includes(q) || entry.certificate_number.toLowerCase().includes(q);
  });

  return (
    <div style={{ minHeight: "100vh", background: "#111827", display: "flex", flexDirection: "column" }}>
      <Navigation />

      <main style={{ flex: 1, paddingTop: "6rem" }}>
        {/* Header */}
        <section style={{ padding: "3rem 0 2rem", background: "#0D1520", borderBottom: "1px solid #2d3a4f" }}>
          <div className="container" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" }}>
            <div className="pill pill-amber" style={{ marginBottom: "1rem" }}>Certificate Registry</div>
            <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: "clamp(1.75rem, 4vw, 2.75rem)", color: "#F9FAFB", marginBottom: "0.75rem" }}>
              Driver Certification Registry
            </h1>
            <p style={{ color: "#9CA3AF", maxWidth: 560, lineHeight: 1.7, marginBottom: "1.5rem" }}>
              Verify any BetterDriver certificate. Search by driver name, ID number, or certificate number. Results show the programme completed, date issued, and certificate status.
            </p>

            <div style={{ position: "relative", maxWidth: 480 }}>
              <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#6B7280" }} />
              <input
                type="search"
                name="q"
                defaultValue={resolvedSearchParams.q ?? ""}
                placeholder="Search by driver name, ID number, or certificate number…"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem 0.75rem 2.75rem",
                  background: "#1C2333",
                  border: "1px solid #2d3a4f",
                  borderRadius: "0.75rem",
                  color: "#F9FAFB",
                  fontSize: "0.9375rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
        </section>

        {/* Results */}
        <section style={{ padding: "2rem 0 4rem" }}>
          <div className="container" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" }}>
            {results.length === 0 ? (
              <p style={{ color: "#6B7280", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
                No certified drivers found.
              </p>
            ) : (
              <>
                <p style={{ color: "#6B7280", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
                  Showing {results.length} certified drivers
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {results.map((entry: any) => (
                    <div
                      key={entry.certificate_number}
                      style={{
                        background: "#1C2333",
                        border: "1px solid #2d3a4f",
                        borderRadius: "1rem",
                        padding: "1.25rem 1.5rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "1rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            background: "rgba(245, 158, 11, 0.12)",
                            border: "1px solid rgba(245, 158, 11, 0.2)",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: 700,
                            fontSize: "1rem",
                            color: "#F59E0B",
                            flexShrink: 0,
                          }}
                        >
                          {entry.driver?.first_name?.charAt(0) ?? "?"}
                        </div>
                        <div>
                          <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "1rem", color: "#F9FAFB", margin: "0 0 0.125rem" }}>
                            {entry.driver?.first_name} {entry.driver?.last_name}
                          </p>
                          <p style={{ fontSize: "0.8125rem", color: "#9CA3AF", margin: 0 }}>{entry.programme}</p>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ fontSize: "0.75rem", color: "#6B7280", margin: "0 0 0.125rem" }}>Certificate</p>
                          <p style={{ fontFamily: "monospace", fontSize: "0.875rem", color: "#9CA3AF", margin: 0 }}>{entry.certificate_number}</p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ fontSize: "0.75rem", color: "#6B7280", margin: "0 0 0.125rem" }}>Issued</p>
                          <p style={{ fontSize: "0.875rem", color: "#9CA3AF", margin: 0 }}>
                            {entry.issued_at ? new Date(entry.issued_at).toLocaleDateString("en-ZA", { month: "short", year: "numeric" }) : ""}
                          </p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                          <CheckCircle2 size={16} style={{ color: "#10B981" }} />
                          <span className="pill pill-green" style={{ fontSize: "0.6875rem" }}>Verified</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
