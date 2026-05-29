"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { Search, CheckCircle2, XCircle, Loader2, Award, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

interface RegistryEntry {
  id: string;
  driverName: string;
  idNumber: string;
  certificateNumber: string;
  programme: string;
  issuedAt: string;
  status: string;
  verificationUrl: string;
}

interface RegistryResponse {
  results: RegistryEntry[];
  total: number;
  page: number;
  totalPages: number;
}

const DEBOUNCE_MS = 400;

export default function RegistryPage() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<RegistryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchRegistry = useCallback(async (q: string, p: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "20" });
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/registry?${params.toString()}`);
      if (!res.ok) throw new Error("Registry lookup failed");
      const json: RegistryResponse = await res.json();
      setData(json);
    } catch {
      setError("Could not load the registry. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { fetchRegistry("", 1); }, [fetchRegistry]);

  // Debounced search
  const handleSearch = (value: string) => {
    setQuery(value);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchRegistry(value, 1), DEBOUNCE_MS);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchRegistry(query, newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });

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
              Verify any BetterDriver certificate. Search by driver name, ID number, or certificate number.
            </p>

            {/* Search */}
            <div style={{ position: "relative", maxWidth: 520 }}>
              <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#6B7280", pointerEvents: "none" }} />
              {loading && query && (
                <Loader2 size={16} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: "#6B7280", animation: "spin 1s linear infinite" }} />
              )}
              <input
                type="search"
                value={query}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search by driver name, ID number, or certificate number…"
                style={{
                  width: "100%",
                  padding: "0.875rem 2.75rem 0.875rem 2.75rem",
                  background: "#1C2333",
                  border: "1px solid #2d3a4f",
                  borderRadius: "0.875rem",
                  color: "#F9FAFB",
                  fontSize: "0.9375rem",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
                onFocus={e => (e.target.style.borderColor = "rgba(245,158,11,0.5)")}
                onBlur={e => (e.target.style.borderColor = "#2d3a4f")}
              />
            </div>
          </div>
        </section>

        {/* Results */}
        <section style={{ padding: "2rem 0 4rem" }}>
          <div className="container" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" }}>

            {/* Stats bar */}
            {!loading && !error && data && (
              <p style={{ color: "#6B7280", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
                {query.trim()
                  ? `${data.total} result${data.total !== 1 ? "s" : ""} for "${query.trim()}"`
                  : `${data.total.toLocaleString()} certified driver${data.total !== 1 ? "s" : ""} in the registry`}
              </p>
            )}

            {/* Loading skeleton */}
            {loading && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} style={{ background: "#1C2333", border: "1px solid #2d3a4f", borderRadius: "1rem", padding: "1.25rem 1.5rem", height: 72, opacity: 0.5 + i * 0.1 }} />
                ))}
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "1rem", padding: "1.5rem", color: "#F87171", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <XCircle size={20} />
                {error}
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && data && data.results.length === 0 && (
              <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
                <Award size={48} style={{ color: "#374151", margin: "0 auto 1rem" }} />
                <p style={{ color: "#6B7280", fontSize: "0.9375rem" }}>
                  {query.trim()
                    ? `No certificates found matching "${query.trim()}".`
                    : "No certificates have been issued yet."}
                </p>
              </div>
            )}

            {/* Results list */}
            {!loading && !error && data && data.results.length > 0 && (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
                  {data.results.map(entry => (
                    <div
                      key={entry.id}
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
                        transition: "border-color 0.15s",
                      }}
                      onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.borderColor = "rgba(245,158,11,0.3)")}
                      onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor = "#2d3a4f")}
                    >
                      {/* Driver info */}
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{
                          width: 44, height: 44,
                          background: "rgba(245,158,11,0.12)",
                          border: "1px solid rgba(245,158,11,0.2)",
                          borderRadius: "50%",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "1rem",
                          color: "#F59E0B", flexShrink: 0,
                        }}>
                          {entry.driverName.charAt(0)}
                        </div>
                        <div>
                          <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "1rem", color: "#F9FAFB", margin: "0 0 0.125rem" }}>
                            {entry.driverName}
                          </p>
                          <p style={{ fontSize: "0.8125rem", color: "#9CA3AF", margin: 0 }}>{entry.programme}</p>
                        </div>
                      </div>

                      {/* Cert details */}
                      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ fontSize: "0.75rem", color: "#6B7280", margin: "0 0 0.125rem" }}>Certificate</p>
                          <p style={{ fontFamily: "monospace", fontSize: "0.875rem", color: "#9CA3AF", margin: 0 }}>{entry.certificateNumber}</p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ fontSize: "0.75rem", color: "#6B7280", margin: "0 0 0.125rem" }}>Issued</p>
                          <p style={{ fontSize: "0.875rem", color: "#9CA3AF", margin: 0 }}>{formatDate(entry.issuedAt)}</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          {entry.status === "active" ? (
                            <>
                              <CheckCircle2 size={16} style={{ color: "#10B981" }} />
                              <span className="pill pill-green" style={{ fontSize: "0.6875rem" }}>Verified</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={16} style={{ color: "#EF4444" }} />
                              <span className="pill" style={{ fontSize: "0.6875rem", background: "rgba(239,68,68,0.1)", color: "#F87171" }}>Revoked</span>
                            </>
                          )}
                          <a
                            href={entry.verificationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#6B7280", display: "flex", alignItems: "center" }}
                            title="Verify certificate"
                          >
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {data.totalPages > 1 && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      style={{
                        padding: "0.5rem 1rem", borderRadius: "0.625rem",
                        background: "#1C2333", border: "1px solid #2d3a4f",
                        color: page === 1 ? "#374151" : "#9CA3AF",
                        cursor: page === 1 ? "not-allowed" : "pointer", fontSize: "0.875rem",
                      }}
                    >
                      Previous
                    </button>
                    <span style={{ color: "#6B7280", fontSize: "0.875rem", padding: "0 0.75rem" }}>
                      Page {page} of {data.totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === data.totalPages}
                      style={{
                        padding: "0.5rem 1rem", borderRadius: "0.625rem",
                        background: "#1C2333", border: "1px solid #2d3a4f",
                        color: page === data.totalPages ? "#374151" : "#9CA3AF",
                        cursor: page === data.totalPages ? "not-allowed" : "pointer", fontSize: "0.875rem",
                      }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
