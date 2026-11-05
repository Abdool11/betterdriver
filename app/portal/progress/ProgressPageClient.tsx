"use client";

import { useCallback, useState } from "react";
import { CheckCircle2, TrendingUp, Calendar } from "lucide-react";
import TranslatedPageHeader from "@/components/portal/TranslatedPageHeader";
import ProgressRefreshControl from "@/components/portal/ProgressRefreshControl";
import { usePortalRefresh } from "@/components/portal/usePortalRefresh";

type CourseModule = {
  id: string;
  name: string;
  status: "completed" | "available" | "locked";
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
  const loadProgress = useCallback(async (signal: AbortSignal) => {
    try {
      const [courseResult, cpdResult] = await Promise.allSettled([
        fetch("/api/portal/course", { cache: "no-store", signal }),
        fetch("/api/portal/cpd/progress", { cache: "no-store", signal }),
      ]);
      if (signal.aborted) return;
      const responses = [courseResult, cpdResult]
        .filter((result): result is PromiseFulfilledResult<Response> => result.status === "fulfilled")
        .map((result) => result.value);
      if (responses.some((response) => response.status === 401)) {
        window.location.assign("/start");
        return;
      }
      if (courseResult.status === "fulfilled" && courseResult.value.ok) {
        try {
          const data = (await courseResult.value.json()) as CourseResponse;
          if (!signal.aborted) { setCourse(data); setCourseError(""); }
        } catch {
          if (!signal.aborted) setCourseError("Could not read your current course progress.");
        }
      } else {
        setCourseError("Could not confirm your latest course progress. Please refresh to try again.");
      }
      if (cpdResult.status === "fulfilled" && cpdResult.value.ok) {
        try {
          const data = (await cpdResult.value.json()) as CpdResponse;
          if (!signal.aborted) { setCpd(data); setCpdError(""); }
        } catch {
          if (!signal.aborted) setCpdError("CPD history is temporarily unavailable.");
        }
      } else {
        setCpdError("CPD history is temporarily unavailable.");
      }
    } catch {
      if (!signal.aborted) setCourseError("Could not confirm your latest course progress. Please refresh to try again.");
    }
  }, []);
  const { refresh, refreshing } = usePortalRefresh(loadProgress);
  const refreshControl = <ProgressRefreshControl refreshing={refreshing} onRefresh={() => void refresh()} error={courseError ? `${courseError}${course ? " Showing the last confirmed course information." : ""}` : undefined} />;

  if (!course) {
    return <div className="page-content"><TranslatedPageHeader pageKey="progress" />{!courseError && <p style={{ color: "#9CA3AF" }}>Loading your training progress…</p>}{refreshControl}</div>;
  }

  const modules = course.modules;
  const outstandingCpd = cpd?.records.find((record) => record.status !== "completed");
  const cpdConfirmed = Boolean(cpd) && !cpdError;
  const stats = [
    { label: "Course progress", value: `${course.programme.progressPercent}%`, color: "#F59E0B" },
    { label: "Modules completed", value: `${course.programme.completedModules}/${course.programme.totalModules}`, color: "#10B981" },
    { label: "CPD sessions done", value: cpdConfirmed ? String(cpd!.completed) : "—", color: "#3B82F6" },
    { label: "Next CPD due", value: cpdConfirmed ? (outstandingCpd?.dueDateLabel || "—") : "Unavailable", color: "#9CA3AF" },
  ];

  return (
    <div className="page-content">
      <TranslatedPageHeader pageKey="progress" />
      {refreshControl}
      {modules.length === 0 && <div style={{ marginBottom: "1.5rem", background: "#1C2333", border: "1px solid #2d3a4f", borderRadius: "1rem", padding: "1rem", color: "#9CA3AF" }}>No active training programme has been assigned to this driver profile yet.</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {stats.map(({ label, value, color }) => <div key={label} style={{ background: "#1C2333", border: "1px solid #2d3a4f", borderRadius: "1rem", padding: "1.25rem" }}><p style={{ fontWeight: 800, fontSize: "1.75rem", color, margin: "0 0 0.25rem" }}>{value}</p><p style={{ fontSize: "0.8125rem", color: "#6B7280", margin: 0 }}>{label}</p></div>)}
      </div>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontWeight: 700, fontSize: "1.125rem", color: "#F9FAFB", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><TrendingUp size={18} style={{ color: "#F59E0B" }} /> Course modules</h2>
        {modules.length === 0 ? <p style={{ color: "#9CA3AF" }}>There are no course modules to show.</p> : <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>{modules.map((module) => <div key={module.id} style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "0.75rem 1rem", background: "#1C2333", border: "1px solid #2d3a4f", borderRadius: "0.75rem" }}>{module.status === "completed" ? <CheckCircle2 size={16} style={{ color: "#10B981", flexShrink: 0 }} /> : <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #2d3a4f", flexShrink: 0 }} />}<p style={{ fontSize: "0.875rem", color: module.status === "completed" ? "#F9FAFB" : "#9CA3AF", margin: 0, flex: 1 }}>{module.name}</p>{!module.locked && module.status === "available" && <span className="pill pill-blue" style={{ fontSize: "0.6875rem" }}>Available</span>}{module.locked && <span style={{ color: "#9CA3AF", fontSize: "0.6875rem" }}>Locked</span>}{module.status === "completed" && <span className="pill pill-green" style={{ fontSize: "0.6875rem" }}>Completed</span>}</div>)}</div>}
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
