"use client";

import { useState } from "react";
import { Search, Download, User, Award } from "lucide-react";

interface Driver {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  branch: string;
  region: string;
  status: string;
  created_at: string;
  companies?: { name: string } | null;
  certifications?: Array<{
    id: string;
    certificate_number: string;
    issue_date: string;
    status: string;
    courses?: { name: string; slug: string } | null;
  }>;
}

export default function RegistryClient({ drivers: initial }: { drivers: Driver[] }) {
  const [search, setSearch] = useState("");

  const filtered = initial.filter(d => {
    const q = search.toLowerCase();
    return (
      `${d.first_name} ${d.last_name}`.toLowerCase().includes(q) ||
      d.mobile?.includes(q) ||
      d.email?.toLowerCase().includes(q) ||
      d.companies?.name?.toLowerCase().includes(q)
    );
  });

  const exportCSV = () => {
    const headers = ["Name", "Mobile", "Email", "Company", "Branch", "Region", "Certifications", "Registered"];
    const rows = filtered.map(d => [
      `${d.first_name} ${d.last_name}`,
      d.mobile,
      d.email ?? "",
      d.companies?.name ?? "",
      d.branch ?? "",
      d.region ?? "",
      (d.certifications ?? []).map(c => c.courses?.name ?? c.certificate_number).join("; "),
      new Date(d.created_at).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `driver-registry-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ color: "#f9fafb", fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>Driver Registry</h1>
          <p style={{ color: "#6b7280", marginTop: "0.25rem", fontSize: "0.875rem" }}>
            {initial.length} registered drivers · {initial.filter(d => (d.certifications?.length ?? 0) > 0).length} certified
          </p>
        </div>
        <button onClick={exportCSV} style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          background: "#111827", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "0.5rem", padding: "0.5rem 1rem",
          color: "#9ca3af", fontSize: "0.8125rem", cursor: "pointer",
        }}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "1.25rem" }}>
        <Search size={16} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "#4b5563" }} />
        <input
          type="text"
          placeholder="Search by name, mobile, email, or company..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: "100%",
            background: "#0d1520",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "0.625rem",
            padding: "0.625rem 0.875rem 0.625rem 2.5rem",
            color: "#f9fafb",
            fontSize: "0.875rem",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {filtered.length === 0 ? (
        <div style={{
          background: "#0d1520",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "0.875rem",
          padding: "4rem",
          textAlign: "center",
          color: "#4b5563",
        }}>
          <User size={40} style={{ margin: "0 auto 1rem", display: "block" }} />
          {search ? "No drivers match your search." : "No drivers registered yet."}
        </div>
      ) : (
        <div style={{
          background: "#0d1520",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "0.875rem",
          overflow: "hidden",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Driver", "Contact", "Company", "Certifications", "Registered"].map(h => (
                  <th key={h} style={{
                    padding: "0.875rem 1.25rem",
                    textAlign: "left",
                    color: "#6b7280",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((driver, i) => (
                <tr key={driver.id} style={{
                  borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                }}>
                  <td style={{ padding: "1rem 1.25rem" }}>
                    <div style={{ fontWeight: 600, color: "#f9fafb", fontSize: "0.875rem" }}>
                      {driver.first_name} {driver.last_name}
                    </div>
                    {driver.branch && (
                      <div style={{ color: "#6b7280", fontSize: "0.75rem", marginTop: "0.125rem" }}>
                        {driver.branch}{driver.region ? ` · ${driver.region}` : ""}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "1rem 1.25rem" }}>
                    <div style={{ color: "#9ca3af", fontSize: "0.8125rem" }}>{driver.mobile}</div>
                    {driver.email && <div style={{ color: "#6b7280", fontSize: "0.75rem" }}>{driver.email}</div>}
                  </td>
                  <td style={{ padding: "1rem 1.25rem", color: "#9ca3af", fontSize: "0.8125rem" }}>
                    {driver.companies?.name ?? <span style={{ color: "#374151" }}>Self-enrolled</span>}
                  </td>
                  <td style={{ padding: "1rem 1.25rem" }}>
                    {(driver.certifications?.length ?? 0) === 0 ? (
                      <span style={{ color: "#374151", fontSize: "0.8125rem" }}>None</span>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        {driver.certifications!.map(cert => (
                          <span key={cert.id} style={{
                            display: "inline-flex", alignItems: "center", gap: "0.375rem",
                            background: "rgba(34,197,94,0.1)",
                            color: "#22c55e",
                            border: "1px solid rgba(34,197,94,0.2)",
                            borderRadius: "1rem",
                            padding: "0.15rem 0.5rem",
                            fontSize: "0.7rem",
                            fontWeight: 600,
                          }}>
                            <Award size={10} />
                            {cert.courses?.name ?? cert.certificate_number}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "1rem 1.25rem", color: "#6b7280", fontSize: "0.8125rem" }}>
                    {new Date(driver.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
