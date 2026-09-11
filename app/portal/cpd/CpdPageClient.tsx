"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import TranslatedPageHeader from "@/components/portal/TranslatedPageHeader";

type CpdRecord = {
  id: string;
  title: string;
  status: "completed" | "overdue" | "urgent" | "upcoming";
  dueDateLabel: string | null;
  completedAtLabel: string | null;
};

type CpdResponse = {
  records: CpdRecord[];
};

export default function CpdPageClient() {
  const [records, setRecords] = useState<CpdRecord[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCpd() {
      try {
        const response = await fetch("/api/portal/cpd/progress", { cache: "no-store" });
        if (response.status === 401) {
          window.location.assign("/start");
          return;
        }
        if (!response.ok) throw new Error("Could not load your CPD record.");
        const data = (await response.json()) as CpdResponse;
        if (active) setRecords(data.records);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load your CPD record.");
      }
    }

    void loadCpd();
    return () => { active = false; };
  }, []);

  if (error) return <div className="page-content"><TranslatedPageHeader pageKey="cpd" /><p style={{ color: "#fca5a5" }}>{error}</p></div>;
  if (!records) return <div className="page-content"><TranslatedPageHeader pageKey="cpd" /><p style={{ color: "#9CA3AF" }}>Loading your CPD record…</p></div>;

  const actionRequired = records.filter((record) => record.status === "urgent" || record.status === "overdue");
  const upcoming = records.filter((record) => record.status === "upcoming");
  const completed = records.filter((record) => record.status === "completed");

  const sectionTitle = (title: string, color = "#9CA3AF") => <h2 style={{ fontWeight: 700, fontSize: "0.9375rem", color, marginBottom: "0.875rem" }}>{title}</h2>;

  return (
    <div className="page-content">
      <TranslatedPageHeader pageKey="cpd" />
      {records.length === 0 && <section style={{ background: "#1C2333", border: "1px solid #2d3a4f", borderRadius: "1rem", padding: "1.5rem", color: "#9CA3AF" }}><h2 style={{ color: "#F9FAFB", fontSize: "1.125rem", marginTop: 0 }}>No CPD activities assigned</h2><p style={{ marginBottom: 0 }}>There are no CPD or refresher activities assigned to this driver profile.</p></section>}
      {actionRequired.length > 0 && <section style={{ marginBottom: "2rem" }}><div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}><AlertTriangle size={16} style={{ color: "#F59E0B" }} />{sectionTitle(`Action required (${actionRequired.length})`, "#F59E0B")}</div>{actionRequired.map((record) => <div key={record.id} style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "1rem", padding: "1.25rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "1rem" }}><Clock size={18} style={{ color: "#F59E0B", flexShrink: 0 }} /><div><p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#F9FAFB", margin: "0 0 0.25rem" }}>{record.title}</p><p style={{ fontSize: "0.8125rem", color: "#9CA3AF", margin: 0 }}>{record.status === "overdue" ? "Overdue" : "Due"} {record.dueDateLabel || "date to be confirmed"}</p></div></div>)}</section>}
      {upcoming.length > 0 && <section style={{ marginBottom: "2rem" }}>{sectionTitle("Upcoming")}{upcoming.map((record) => <div key={record.id} style={{ background: "#1C2333", border: "1px solid #2d3a4f", borderRadius: "1rem", padding: "1.25rem", marginBottom: "0.75rem" }}><p style={{ fontWeight: 600, fontSize: "0.9rem", color: "#F9FAFB", margin: "0 0 0.25rem" }}>{record.title}</p><p style={{ fontSize: "0.8125rem", color: "#6B7280", margin: 0 }}>Due {record.dueDateLabel || "date to be confirmed"}</p></div>)}</section>}
      {completed.length > 0 && <section>{sectionTitle("Completed")}{completed.map((record) => <div key={record.id} style={{ background: "#1C2333", border: "1px solid #2d3a4f", borderRadius: "1rem", padding: "1.25rem", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "1rem" }}><CheckCircle2 size={18} style={{ color: "#10B981", flexShrink: 0 }} /><div><p style={{ fontWeight: 600, fontSize: "0.9rem", color: "#F9FAFB", margin: "0 0 0.125rem" }}>{record.title}</p><p style={{ fontSize: "0.8125rem", color: "#6B7280", margin: 0 }}>Completed {record.completedAtLabel || "date to be confirmed"}</p></div></div>)}</section>}
    </div>
  );
}
