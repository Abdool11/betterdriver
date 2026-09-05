import { Metadata } from "next";
import Link from "next/link";
import { MOCK_CPD_RECORDS } from "@/lib/constants";
import DemoContentNotice from "@/components/portal/DemoContentNotice";
import { AlertTriangle, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import TranslatedPageHeader from "@/components/portal/TranslatedPageHeader";

export const dynamic = "force-dynamic";


// DATA REQUIREMENTS:
// - cpdRecords: CpdRecord[] — Supabase: SELECT * FROM cpd_records WHERE driver_id = ? ORDER BY due_date DESC
// - CpdRecord status values: 'urgent' | 'upcoming' | 'completed' | 'overdue'
// TODO: Asif — replace mock data with live Supabase query

export const metadata: Metadata = { title: "CPD & Refresh" };

export default function CpdPage() {
  const records = MOCK_CPD_RECORDS;
  const urgent = records.filter((r) => r.status === "urgent");
  const upcoming = records.filter((r) => r.status === "upcoming");
  const completed = records.filter((r) => r.status === "completed");

  return (
    <div className="page-content">
      <DemoContentNotice description="The CPD and refresher activities below are sample content for demonstration. They are not assigned to, completed by, or due for the signed-in account." />
      <TranslatedPageHeader pageKey="cpd" />

      {/* Urgent / action required */}
      {urgent.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
            <AlertTriangle size={16} style={{ color: "#F59E0B" }} />
            <h2 style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 700, fontSize: "0.9375rem", color: "#F59E0B", margin: 0 }}>
              Action required ({urgent.length})
            </h2>
          </div>
          {urgent.map((r) => (
            <div
              key={r.id}
              style={{
                background: "rgba(245,158,11,0.06)",
                border: "1px solid rgba(245,158,11,0.2)",
                borderRadius: "1rem",
                padding: "1.25rem",
                marginBottom: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              <Clock size={18} style={{ color: "#F59E0B", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 700, fontSize: "0.9375rem", color: "#F9FAFB", margin: "0 0 0.25rem" }}>
                  {r.title}
                </p>
                <p style={{ fontSize: "0.8125rem", color: "#9CA3AF", margin: 0 }}>Due {r.dueDate}</p>
              </div>
              <Link
                href="/portal/cpd"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  background: "#F59E0B",
                  color: "#111827",
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  fontWeight: 700,
                  fontSize: "0.8125rem",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.625rem",
                  textDecoration: "none",
                  flexShrink: 0,
                }}
              >
                Start now <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 700, fontSize: "0.9375rem", color: "#9CA3AF", marginBottom: "0.875rem" }}>
            Upcoming
          </h2>
          {upcoming.map((r) => (
            <div
              key={r.id}
              style={{
                background: "#1C2333",
                border: "1px solid #2d3a4f",
                borderRadius: "1rem",
                padding: "1.25rem",
                marginBottom: "0.75rem",
                opacity: 0.7,
              }}
            >
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#9CA3AF", margin: "0 0 0.25rem" }}>
                {r.title}
              </p>
              <p style={{ fontSize: "0.8125rem", color: "#6B7280", margin: 0 }}>Due {r.dueDate}</p>
            </div>
          ))}
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <h2 style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 700, fontSize: "0.9375rem", color: "#9CA3AF", marginBottom: "0.875rem" }}>
            Completed
          </h2>
          {completed.map((r) => (
            <div
              key={r.id}
              style={{
                background: "#1C2333",
                border: "1px solid #2d3a4f",
                borderRadius: "1rem",
                padding: "1.25rem",
                marginBottom: "0.5rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <CheckCircle2 size={18} style={{ color: "#10B981", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#F9FAFB", margin: "0 0 0.125rem" }}>
                  {r.title}
                </p>
                {"completedAt" in r && (
                  <p style={{ fontSize: "0.8125rem", color: "#6B7280", margin: 0 }}>Completed {String(r.completedAt)}</p>
                )}
              </div>
              <span className="pill pill-green" style={{ fontSize: "0.6875rem" }}>
                Done
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}