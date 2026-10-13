"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Lock,
  PlayCircle,
} from "lucide-react";

type CourseModule = {
  id: string;
  name: string;
  url?: string;
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

type ModulePageClientProps = {
  moduleId: string;
};

export default function ModulePageClient({ moduleId }: ModulePageClientProps) {
  const [course, setCourse] = useState<CourseResponse | null>(null);
  const [error, setError] = useState("");
  const [launchError, setLaunchError] = useState("");
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadCourse() {
      try {
        const response = await fetch("/api/portal/course", { cache: "no-store" });
        if (response.status === 401) {
          window.location.assign("/start");
          return;
        }
        if (!response.ok) throw new Error("Could not load this learning module.");
        const data = (await response.json()) as CourseResponse;
        if (active) setCourse(data);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Could not load this learning module.");
        }
      }
    }

    void loadCourse();
    return () => {
      active = false;
    };
  }, []);

  const module = useMemo(
    () => course?.modules.find((candidate) => candidate.id === moduleId) ?? null,
    [course, moduleId]
  );

  async function openLearning() {
    setLaunchError("");
    setLaunching(true);

    try {
      const response = await fetch("/api/moodle/autologin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId }),
      });

      if (response.status === 401) {
        window.location.assign("/start");
        return;
      }

      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        throw new Error(data.error || "Your learning content could not be opened right now.");
      }

      window.location.assign(data.url);
    } catch (launchFailure) {
      setLaunchError(
        launchFailure instanceof Error
          ? launchFailure.message
          : "Your learning content could not be opened right now. Please try again."
      );
    } finally {
      setLaunching(false);
    }
  }

  if (error) {
    return (
      <div className="page-content">
        <Link href="/portal/course" className="portal-back-link">← Back to my course</Link>
        <h1 className="portal-page-title">Learning module</h1>
        <div className="portal-status-card portal-status-card-error">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="page-content">
        <Link href="/portal/course" className="portal-back-link">← Back to my course</Link>
        <h1 className="portal-page-title">Loading module…</h1>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="page-content">
        <Link href="/portal/course" className="portal-back-link">← Back to my course</Link>
        <h1 className="portal-page-title">Module not available</h1>
        <div className="portal-status-card">
          <p>This module is not part of your currently assigned programme.</p>
        </div>
      </div>
    );
  }

  const previousModule = course.modules.find((candidate) => candidate.order === module.order - 1);
  const isComplete = module.status === "completed";

  return (
    <div className="page-content">
      <Link href="/portal/course" className="portal-back-link">← Back to my course</Link>

      <div style={{ marginBottom: "1.5rem" }}>
        <span className="pill pill-amber">Module {module.order} of {course.programme.totalModules}</span>
        <h1 className="portal-page-title" style={{ marginTop: "0.75rem" }}>{module.name}</h1>
        <p style={{ color: "#9CA3AF", margin: 0, lineHeight: 1.6 }}>
          Open your assigned learning content to continue your programme. Your progress is recorded against your signed-in driver profile.
        </p>
      </div>

      {module.locked ? (
        <section className="portal-status-card" style={{ marginBottom: "1.25rem" }}>
          <Lock size={20} style={{ color: "#9CA3AF", flexShrink: 0 }} />
          <div>
            <h2 style={{ color: "#F9FAFB", fontSize: "1rem", margin: "0 0 0.25rem" }}>Complete the previous module first</h2>
            <p style={{ color: "#9CA3AF", margin: 0 }}>
              {previousModule ? `Finish ${previousModule.name} to unlock this module.` : "This module is not available yet."}
            </p>
          </div>
        </section>
      ) : (
        <section style={{ background: "#1C2333", border: "1px solid #2d3a4f", borderRadius: "1rem", padding: "1.25rem", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem", marginBottom: "1rem" }}>
            {isComplete ? <CheckCircle2 size={22} style={{ color: "#10B981", flexShrink: 0 }} /> : <PlayCircle size={22} style={{ color: "#F59E0B", flexShrink: 0 }} />}
            <div>
              <h2 style={{ color: "#F9FAFB", fontSize: "1rem", margin: "0 0 0.25rem" }}>
                {isComplete ? "Module completed" : "Ready to learn"}
              </h2>
              <p style={{ color: "#9CA3AF", margin: 0, lineHeight: 1.5 }}>
                {isComplete
                  ? "You can reopen this module to review the authorised learning material."
                  : "Select Open learning to continue securely in the learning player."}
              </p>
            </div>
          </div>

          {launchError && (
            <div className="portal-status-card portal-status-card-error" style={{ marginBottom: "1rem" }}>
              <AlertCircle size={18} />
              <p>{launchError}</p>
            </div>
          )}

          <button
            type="button"
            className="btn-primary"
            onClick={() => void openLearning()}
            disabled={launching || !module.url}
            style={{ width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", opacity: module.url ? 1 : 0.6 }}
          >
            <ExternalLink size={17} />
            {launching ? "Opening learning…" : isComplete ? "Review learning" : "Open learning"}
          </button>
          {!module.url && (
            <p style={{ color: "#fca5a5", fontSize: "0.8125rem", margin: "0.75rem 0 0" }}>
              Learning content is not available for this module yet. Please contact your fleet manager or support team.
            </p>
          )}
        </section>
      )}

      <section style={{ marginTop: "1.5rem" }}>
        <h2 style={{ color: "#F9FAFB", fontSize: "1rem", marginBottom: "0.75rem" }}>Programme modules</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {course.modules.map((candidate) => (
            <Link
              key={candidate.id}
              href={candidate.locked ? "#" : `/portal/module/${candidate.id}`}
              aria-disabled={candidate.locked}
              style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1rem", background: candidate.id === module.id ? "rgba(245,158,11,0.08)" : "#1C2333", border: `1px solid ${candidate.id === module.id ? "rgba(245,158,11,0.3)" : "#2d3a4f"}`, borderRadius: "0.75rem", color: "inherit", textDecoration: "none", opacity: candidate.locked ? 0.55 : 1, pointerEvents: candidate.locked ? "none" : "auto" }}
            >
              {candidate.status === "completed" ? <CheckCircle2 size={16} style={{ color: "#10B981" }} /> : candidate.locked ? <Lock size={15} style={{ color: "#6B7280" }} /> : <PlayCircle size={16} style={{ color: "#F59E0B" }} />}
              <span style={{ flex: 1, color: "#F9FAFB", fontSize: "0.875rem" }}>{candidate.order}. {candidate.name}</span>
              {candidate.id === module.id && <ArrowRight size={15} style={{ color: "#F59E0B" }} />}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
