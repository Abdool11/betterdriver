"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { CheckCircle2, PlayCircle, ArrowRight, Lock } from "lucide-react";
import ProgressRefreshControl from "@/components/portal/ProgressRefreshControl";
import { usePortalRefresh } from "@/components/portal/usePortalRefresh";
import { readPortalJson, isCourseData } from "@/lib/portal-read";

type CourseModule = {
  id: string;
  name: string;
  status: "completed" | "available" | "locked";
  locked: boolean;
  order: number;
};

type CourseResponse = {
  programme: {
    title: string;
    progressPercent: number;
    totalModules: number;
    completedModules: number;
  };
  modules: CourseModule[];
};

export default function CoursePageClient() {
  const [data, setData] = useState<CourseResponse | null>(null);
  const [error, setError] = useState("");
  const loadCourse = useCallback(async (signal: AbortSignal) => {
    try {
      const nextData = await readPortalJson("/api/portal/course", signal, isCourseData);
      if (!signal.aborted) { setData(nextData); setError(""); }
    } catch (loadError) {
      if (!signal.aborted) setError(loadError instanceof Error ? loadError.message : "Could not load your training information.");
    }
  }, []);
  const { refresh, refreshing } = usePortalRefresh(loadCourse);
  const refreshControl = <ProgressRefreshControl refreshing={refreshing} onRefresh={() => void refresh()} error={error ? `${error}${data ? " Showing the last confirmed information." : ""}` : undefined} />;

  if (!data) {
    return (
      <div className="page-content">
        <h1 className="portal-page-title">My Course</h1>
        {!error && <p style={{ color: "#9CA3AF" }}>Loading your training information…</p>}
        {refreshControl}
      </div>
    );
  }

  const { programme, modules } = data;
  const nextModule = !error && modules.find((module) => !module.locked && module.status === "available");

  if (modules.length === 0) {
    return (
      <div className="page-content">
        <div style={{ marginBottom: "2rem" }}>
          <h1 className="portal-page-title">My Course</h1>
          <p style={{ color: "#9CA3AF", margin: 0 }}>Your training programme and modules.</p>
        </div>
        {refreshControl}
        <section style={{ background: "#1C2333", border: "1px solid #2d3a4f", borderRadius: "1rem", padding: "1.5rem" }}>
          <h2 style={{ color: "#F9FAFB", fontSize: "1.125rem", marginTop: 0 }}>No training assigned yet</h2>
          <p style={{ color: "#9CA3AF", marginBottom: 0 }}>Your fleet manager has not assigned a training programme to this driver profile yet. Please contact your fleet manager if you expected an assignment.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div style={{ marginBottom: "2rem" }}>
        <h1 className="portal-page-title">{programme.title}</h1>
        <p style={{ color: "#9CA3AF", margin: 0 }}>{programme.completedModules} of {programme.totalModules} modules complete</p>
        {refreshControl}
      </div>

      <section style={{ background: "#1C2333", border: "1px solid #2d3a4f", borderRadius: "1.25rem", padding: "1.5rem 2rem", marginBottom: "2rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1.5rem" }}>
        <div>
          <p style={{ fontSize: "0.8125rem", color: "#6B7280", margin: "0 0 0.25rem" }}>Your progress</p>
          <p style={{ fontWeight: 800, fontSize: "2rem", color: "#F59E0B", margin: "0 0 0.5rem" }}>{programme.progressPercent}%</p>
          <div className="progress-bar" style={{ width: 200 }}><div className="progress-fill" style={{ width: `${programme.progressPercent}%` }} /></div>
        </div>
        <div style={{ display: "flex", gap: "2rem" }}>
          <div style={{ textAlign: "center" }}><p style={{ fontWeight: 700, fontSize: "1.5rem", color: "#F9FAFB", margin: "0 0 0.25rem" }}>{programme.completedModules}</p><p style={{ fontSize: "0.75rem", color: "#6B7280", margin: 0 }}>Done</p></div>
          <div style={{ textAlign: "center" }}><p style={{ fontWeight: 700, fontSize: "1.5rem", color: "#F9FAFB", margin: "0 0 0.25rem" }}>{Math.max(programme.totalModules - programme.completedModules, 0)}</p><p style={{ fontSize: "0.75rem", color: "#6B7280", margin: 0 }}>Remaining</p></div>
        </div>
        {nextModule && <Link href={`/portal/module/${nextModule.id}`} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "#F59E0B", color: "#111827", fontWeight: 700, fontSize: "0.9375rem", padding: "0.75rem 1.5rem", borderRadius: "0.75rem", textDecoration: "none" }}>Start <ArrowRight size={16} /></Link>}
      </section>

      <h2 style={{ fontWeight: 700, fontSize: "1.125rem", color: "#F9FAFB", marginBottom: "1rem" }}>All modules</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        {modules.map((module) => {
          const isCompleted = module.status === "completed";
          const isAvailable = !module.locked && module.status === "available";
          const cannotOpen = module.locked || Boolean(error);
          return (
            <Link key={module.id} href={cannotOpen ? "#" : `/portal/module/${module.id}`} aria-disabled={cannotOpen} style={{ background: "#1C2333", border: `1px solid ${isAvailable ? "rgba(59,130,246,0.35)" : "#2d3a4f"}`, borderRadius: "0.875rem", padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem", opacity: cannotOpen ? 0.5 : 1, cursor: cannotOpen ? "default" : "pointer", textDecoration: "none", pointerEvents: cannotOpen ? "none" : "auto" }}>
              <div style={{ width: 36, height: 36, background: isCompleted ? "rgba(16,185,129,0.12)" : isAvailable ? "rgba(59,130,246,0.12)" : "#243044", border: `1px solid ${isCompleted ? "rgba(16,185,129,0.25)" : isAvailable ? "rgba(59,130,246,0.25)" : "#2d3a4f"}`, borderRadius: "0.625rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {isCompleted ? <CheckCircle2 size={16} style={{ color: "#10B981" }} /> : isAvailable ? <PlayCircle size={16} style={{ color: "#3B82F6" }} /> : <Lock size={14} style={{ color: "#6B7280" }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}><p style={{ fontWeight: 600, fontSize: "0.9rem", color: "#F9FAFB", margin: "0 0 0.125rem" }}>{module.name}</p><p style={{ fontSize: "0.75rem", color: "#6B7280", margin: 0 }}>{module.locked ? "Complete the previous module to unlock this one." : isAvailable ? "Ready to start" : "Review module"}</p></div>
              {isAvailable && <span className="pill pill-blue" style={{ fontSize: "0.6875rem" }}>Available</span>}
              {isCompleted && <span className="pill pill-green" style={{ fontSize: "0.6875rem" }}>Done</span>}
              {!module.locked && !isCompleted && <ArrowRight size={16} style={{ color: "#6B7280", flexShrink: 0 }} />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
