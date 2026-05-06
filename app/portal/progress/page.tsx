import { Metadata } from "next";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { MOCK_ENROLMENT, MOCK_MODULES, MOCK_CPD_RECORDS } from "@/lib/constants";
import { CheckCircle2, TrendingUp, Calendar } from "lucide-react";
import TranslatedPageHeader from "@/components/portal/TranslatedPageHeader";

export const dynamic = "force-dynamic";


// DATA REQUIREMENTS:
// - enrolment: Enrolment — Supabase: SELECT * FROM enrolments WHERE driver_id = ?
// - modules: Module[] — Supabase: SELECT * FROM modules WHERE programme_id = ? ORDER BY order_index
// - cpdRecords: CpdRecord[] — Supabase: SELECT * FROM cpd_records WHERE driver_id = ? ORDER BY due_date DESC
// TODO: Asif — replace mock data with live Supabase queries

export const metadata: Metadata = { title: "My Progress" };

export default function ProgressPage() {
  const enrolment = MOCK_ENROLMENT;
  const modules = MOCK_MODULES;
  const cpdRecords = MOCK_CPD_RECORDS;
  const completedModules = modules.filter((m) => m.status === "completed");
  const completedCpd = cpdRecords.filter((c) => c.status === "completed");

  return (
    <PortalLayout>
      <div className="mock-banner" style={{ marginBottom: "1.5rem" }}>
        MOCK DATA — Asif to connect live Supabase progress data
      </div>
      <TranslatedPageHeader pageKey="progress" />

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Course progress", value: `${enrolment.progressPercent}%`, color: "#F59E0B" },
          { label: "Modules completed", value: `${completedModules.length}/${modules.length}`, color: "#10B981" },
          { label: "CPD sessions done", value: `${completedCpd.length}`, color: "#3B82F6" },
          { label: "Next CPD due", value: "30 Apr", color: "#9CA3AF" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "#1C2333", border: "1px solid #2d3a4f", borderRadius: "1rem", padding: "1.25rem" }}>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 800, fontSize: "1.75rem", color, margin: "0 0 0.25rem" }}>
              {value}
            </p>
            <p style={{ fontSize: "0.8125rem", color: "#6B7280", margin: 0 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Module progress */}
      <div style={{ marginBottom: "2rem" }}>
        <h2
          style={{
            fontFamily: "var(--font-dm-sans), sans-serif",
            fontWeight: 700,
            fontSize: "1.125rem",
            color: "#F9FAFB",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <TrendingUp size={18} style={{ color: "#F59E0B" }} /> Course modules
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {modules.map((mod) => (
            <div
              key={mod.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.875rem",
                padding: "0.75rem 1rem",
                background: "#1C2333",
                border: "1px solid #2d3a4f",
                borderRadius: "0.75rem",
              }}
            >
              {mod.status === "completed" ? (
                <CheckCircle2 size={16} style={{ color: "#10B981", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #2d3a4f", flexShrink: 0 }} />
              )}
              <p style={{ fontSize: "0.875rem", color: mod.status === "completed" ? "#F9FAFB" : "#6B7280", margin: 0, flex: 1 }}>
                {mod.title}
              </p>
              {mod.status === "in-progress" && (
                <span className="pill pill-amber" style={{ fontSize: "0.6875rem" }}>
                  In progress
                </span>
              )}
              {mod.status === "completed" && (
                <span style={{ fontSize: "0.75rem", color: "#6B7280" }}>{mod.durationMinutes} min</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CPD history */}
      <div>
        <h2
          style={{
            fontFamily: "var(--font-dm-sans), sans-serif",
            fontWeight: 700,
            fontSize: "1.125rem",
            color: "#F9FAFB",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Calendar size={18} style={{ color: "#3B82F6" }} /> CPD history
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {cpdRecords.map((cpd) => (
            <div
              key={cpd.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                padding: "0.875rem 1rem",
                background: "#1C2333",
                border: "1px solid #2d3a4f",
                borderRadius: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              <p style={{ fontSize: "0.875rem", color: "#F9FAFB", margin: 0 }}>{cpd.title}</p>
              {cpd.status === "completed" && (
                <span className="pill pill-green" style={{ fontSize: "0.6875rem" }}>
                  Completed
                </span>
              )}
              {cpd.status === "urgent" && (
                <span className="pill pill-amber" style={{ fontSize: "0.6875rem" }}>
                  Due soon
                </span>
              )}
              {cpd.status === "upcoming" && (
                <span style={{ fontSize: "0.6875rem", background: "#243044", color: "#9CA3AF", padding: "0.25rem 0.625rem", borderRadius: "999px" }}>
                  Upcoming
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </PortalLayout>
  );
}
