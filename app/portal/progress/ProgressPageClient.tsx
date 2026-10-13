"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, TrendingUp, Calendar } from "lucide-react";
import TranslatedPageHeader from "@/components/portal/TranslatedPageHeader";

type CourseModule = {
  id: string;
  name: string;
  status: "completed" | "in_progress" | "available";
  locked: boolean;
  order: number;
};

type CourseResponse = {
  programme: { progressPercent: number; totalModules: number; completedModules: number };
  modules: CourseModule[];
};

type CpdRecord = {
  id: string;
  title: string;
  status: "completed" | "overdue" | "urgent" | "upcoming";
  dueDate: string | null;
  dueDateLabel: string | null;
  completedAt: string | null;
  completedAtLabel: string | null;
};

type CpdResponse = { completed: number; records: CpdRecord[] };

export default function ProgressPageClient() {
  const [course, setCourse] = useState<CourseResponse | null>(null);
  const [cpd, setCpd] = useState<CpdResponse | null>(null);
  const [courseError, setCourseError] = useState("");
  const [cpdError, setCpdError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadProgress() {
      const [courseResult, cpdResult] = await Promise.allSettled([
        fetch("/api/portal/course", { cache: "no-store" }),
        fetch("/api/portal/cpd/progress", { cache: "no-store" }),
      ]);
      if (!active) return;

      const responses = [courseResult, cpdResult]
        .filter((result): result is PromiseFulfilledResult<Response> => result.status === "fulfilled")
        .map((result) => result.value);
      if (responses.some((response) => response.status === 401)) {
        window.location.assign("/start");
        return;
      }

      if (courseResult.status === "fulfilled" && courseResult.value.ok) {
        try {
          setCourse((await courseResult.value.json()) as CourseResponse);
        } catch {
          setCourseError("Could not read your current course progress.");
        }
      } else {
        setCourseError("Could not load your current course progress. Please try again shortly.");
      }

      if (cpdResult.status === "fulfilled" && cpdResult.value.ok) {
        try {
          setCpd((await cpdResult.value.json()) as CpdResponse);
        } catch {
          setCpdError("CPD history is temporarily unavailable.");
        }
      } else {
        setCpdError("CPD history is temporarily unavailable.");
      }

      setLoading(false);
    }

    void loadProgress().catch(() => {
      if (active) {
        setCourseError("Could not load your current course progress. Please try again shortly.");
        setCpdError("CPD history is temporarily unavailable.");
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <div className="page-content"><TranslatedPageHeader pageKey="progress" /><p style={{ color: "#9CA3AF" }}>Loading your training progress…</p></div>;
  }
  if (!course) {
    return <div className="page-content"><TranslatedPageHeader pageKey="progress" /><p style={{ color: "#fca5a5" }}>{courseError || "Could not load your current course progress."}</p></div>;
  }

  const modules = course.modules;
  const outstandingCpd = cpd?.records.find((record) => record.status !== "completed");
  const stats = [
    { label: "Course progress", value: `${course.programme.progressPercent}%`, color: "#F59E0B" },
    { label: "Modules completed", value: `${course.programme.completedModules}/${course.programme.totalModules}`, color: "#10B981" },
    { label: "CPD sessions done", value: cpd ? String(cpd.completed) : "—", color: "#3B82F6" },
    { label: "Next CPD due", value: cpd ? (outstandingCpd?.dueDateLabel || "—") : "Unavailable", color: "#9CA3AF" },
  ];

  return (
    <div className="page-content">
      <TranslatedPageHeader pageKey="progress" />
      {modules.length === 0 && <div style={{ marginBottom: "1.5rem", background: "#1C2333", border: "1px solid #2d3a4f", borderRadius: "1rem", padding: "1rem", color: "#9CA3AF" }}>No active training programme has been assigned to this driver profile yet.</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {stats.map(({ label, value, color }) => <div key={label} style={{ background: "#1C2333", border: "1px solid #2d3a4f", borderRadius: "1rem", padding: "1.25rem" }}><p style={{ fontWeight: 800, fontSize: "1.75rem", color, margin: "0 0 0.25rem" }}>{value}</p><p style={{ fontSize: "0.8125rem", color: "#6B7280", margin: 0 }}>{label}</p></div>)}
      </div>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontWeight: 700, fontSize: "1.125rem", color: "#F9FAFB", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><TrendingUp size={18} style={{ color: "#F59E0B" }} /> Course modules</h2>
        {modules.length === 0 ? <p style={{ color: "#9CA3AF" }}>There are no course modules to show.</p> : <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>{modules.map((module) => <div key={module.id} style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "0.75rem 1rem", background: "#1C2333", border: "1px solid #2d3a4f", borderRadius: "0.75rem" }}>{module.status === "completed" ? <CheckCircle2 size={16} style={{ color: "#10B981", flexShrink: 0 }} /> : <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #2d3a4f", flexShrink: 0 }} />}<p style={{ fontSize: "0.875rem", color: module.status === "completed" ? "#F9FAFB" : "#9CA3AF", margin: 0, flex: 1 }}>{module.name}</p>{module.status === "in_progress" && <span className="pill pill-amber" style={{ fontSize: "0.6875rem" }}>In progress</span>}{module.status === "completed" && <span className="pill pill-green" style={{ fontSize: "0.6875rem" }}>Completed</span>}</div>)}</div>}
      </section>

      <section>
        <h2 style={{ fontWeight: 700, fontSize: "1.125rem", color: "#F9FAFB", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><Calendar size={18} style={{ color: "#3B82F6" }} /> CPD history</h2>
        {cpdError && <p style={{ color: "#fbbf24" }}>{cpdError}</p>}
        {!cpdError && cpd?.records.length === 0 && <p style={{ color: "#9CA3AF" }}>No CPD activities have been assigned to this driver profile.</p>}
        {!cpdError && cpd && cpd.records.length > 0 && <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>{cpd.records.map((record) => <div key={record.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "0.875rem 1rem", background: "#1C2333", border: "1px solid #2d3a4f", borderRadius: "0.75rem", flexWrap: "wrap" }}><p style={{ fontSize: "0.875rem", color: "#F9FAFB", margin: 0 }}>{record.title}</p><span style={{ fontSize: "0.75rem", color: record.status === "completed" ? "#10B981" : record.status === "overdue" ? "#fca5a5" : "#F59E0B" }}>{record.status === "completed" ? `Completed ${record.completedAtLabel || ""}` : `${record.status === "overdue" ? "Overdue" : "Due"} ${record.dueDateLabel || "date to be confirmed"}`}</span></div>)}</div>}
      </section>
    </div>
  );
}
