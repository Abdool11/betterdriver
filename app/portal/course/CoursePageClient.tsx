"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, PlayCircle, ArrowRight, Lock } from "lucide-react";

type CourseModule = {
  id: string;
  name: string;
  status: "completed" | "in_progress" | "available";
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

  useEffect(() => {
    let active = true;

    async function loadCourse() {
      try {
        const response = await fetch("/api/portal/course", { cache: "no-store" });
        if (response.status === 401) {
          window.location.assign("/start");
          return;
        }
        if (!response.ok) throw new Error("Could not load your training information.");
        const nextData = (await response.json()) as CourseResponse;
        if (active) setData(nextData);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load your training information.");
      }
    }

    void loadCourse();
    return () => { active = false; };
  }, []);

  if (error) {
    return (
      <div className="page-content">
        <h1 className="portal-page-title">My Course</h1>
        <p style={{ color: "#fca5a5" }}>{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-content">
        <h1 className="portal-page-title">My Course</h1>
        <p style={{ color: "#9CA3AF" }}>Loading your training information…</p>
      </div>
    );
  }

  const { programme, modules } = data;
  const nextModule = modules.find((module) => module.status === "in_progress" || (!module.locked && module.status === "available"));

  if (modules.length === 0) {
    return (
      <div className="page-content">
        <div style={{ marginBottom: "2rem" }}>
          <h1 className="portal-page-title">My Course</h1>
          <p style={{ color: "#9CA3AF", margin: 0 }}>Your training programme and modules.</p>
        </div>
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
        {nextModule && <Link href={`/portal/module/${nextModule.id}`} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "#F59E0B", color: "#111827", fontWeight: 700, fontSize: "0.9375rem", padding: "0.75rem 1.5rem", borderRadius: "0.75rem", textDecoration: "none" }}>{nextModule.status === "in_progress" ? "Continue" : "Start"} <ArrowRight size={16} /></Link>}
      </section>

      <h2 style={{ fontWeight: 700, fontSize: "1.125rem", color: "#F9FAFB", marginBottom: "1rem" }}>All modules</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        {modules.map((module) => {
          const isCompleted = module.status === "completed";
          const isInProgress = module.status === "in_progress";
          return (
            <Link key={module.id} href={module.locked ? "#" : `/portal/module/${module.id}`} aria-disabled={module.locked} style={{ background: "#1C2333", border: `1px solid ${isInProgress ? "rgba(245,158,11,0.35)" : "#2d3a4f"}`, borderRadius: "0.875rem", padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem", opacity: module.locked ? 0.5 : 1, cursor: module.locked ? "default" : "pointer", textDecoration: "none", pointerEvents: module.locked ? "none" : "auto" }}>
              <div style={{ width: 36, height: 36, background: isCompleted ? "rgba(16,185,129,0.12)" : isInProgress ? "rgba(245,158,11,0.12)" : "#243044", border: `1px solid ${isCompleted ? "rgba(16,185,129,0.25)" : isInProgress ? "rgba(245,158,11,0.25)" : "#2d3a4f"}`, borderRadius: "0.625rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {isCompleted ? <CheckCircle2 size={16} style={{ color: "#10B981" }} /> : isInProgress ? <PlayCircle size={16} style={{ color: "#F59E0B" }} /> : module.locked ? <Lock size={14} style={{ color: "#6B7280" }} /> : <span style={{ fontWeight: 700, fontSize: "0.75rem", color: "#6B7280" }}>{module.order}</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}><p style={{ fontWeight: 600, fontSize: "0.9rem", color: "#F9FAFB", margin: "0 0 0.125rem" }}>{module.name}</p><p style={{ fontSize: "0.75rem", color: "#6B7280", margin: 0 }}>{module.locked ? "Complete the previous module to unlock this one." : "Open module"}</p></div>
              {isInProgress && <span className="pill pill-amber" style={{ fontSize: "0.6875rem" }}>In progress</span>}
              {isCompleted && <span className="pill pill-green" style={{ fontSize: "0.6875rem" }}>Done</span>}
              {!module.locked && !isCompleted && <ArrowRight size={16} style={{ color: "#6B7280", flexShrink: 0 }} />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
