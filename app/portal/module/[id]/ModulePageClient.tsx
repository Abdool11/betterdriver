"use client";

import Link from "next/link";
import ProgressRefreshControl from "@/components/portal/ProgressRefreshControl";
import { usePortalRefresh } from "@/components/portal/usePortalRefresh";
import { readPortalJson, isCourseData } from "@/lib/portal-read";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Lock,
  PlayCircle,
} from "lucide-react";
import BunnyPlayer from "./BunnyPlayer";
import VideoPlayer from "./VideoPlayer";
import QuizPlayer from "./QuizPlayer";
import MoodleIframe from "./MoodleIframe";

type CourseModule = {
  id: string;
  name: string;
  url?: string;
  status: "completed" | "available" | "locked";
  locked: boolean;
  order: number;
  modname?: string;
  instance?: number;
  bunnyVideoId?: string;
  bunnyLibraryId?: string;
  videoUrl?: string;
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

type ProgressResult = {
  success?: boolean;
  confirmed?: boolean;
  untracked?: boolean;
  moodleUrl?: string;
  error?: string;
};

type ModulePageClientProps = {
  moduleId: string;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Replay the module view in Moodle so native view-based completion records for the driver. */
function pingModuleView(url: string) {
  const iframe = document.createElement("iframe");
  iframe.src = url;
  iframe.style.cssText = "position:absolute;width:0;height:0;border:none;visibility:hidden;";
  iframe.setAttribute("aria-hidden", "true");
  iframe.setAttribute("tabindex", "-1");
  document.body.appendChild(iframe);
  setTimeout(() => iframe.parentNode?.removeChild(iframe), 30000);
}

export default function ModulePageClient({ moduleId }: ModulePageClientProps) {
  const [course, setCourse] = useState<CourseResponse | null>(null);
  const [error, setError] = useState("");
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [progressError, setProgressError] = useState("");
  const confirmingRef = useRef(false);

  const loadCourse = useCallback(async (signal: AbortSignal) => {
    try {
      const nextData = await readPortalJson("/api/portal/course", signal, isCourseData);
      if (!signal.aborted) { setCourse(nextData); setError(""); }
    } catch (loadError) {
      if (!signal.aborted) setError(loadError instanceof Error ? loadError.message : "Could not load this learning module.");
    }
  }, []);
  const { refresh, refreshing } = usePortalRefresh(loadCourse);
  const refreshControl = <ProgressRefreshControl refreshing={refreshing} onRefresh={() => void refresh()} error={error ? `${error}${course ? " Showing the last confirmed module information." : ""}` : undefined} />;

  const module = useMemo(
    () => course?.modules.find((candidate) => candidate.id === moduleId) ?? null,
    [course, moduleId]
  );

  const markConfirmed = useCallback(() => {
    setCourse((current) => {
      if (!current) return current;
      const alreadyComplete = current.modules.some((m) => m.id === moduleId && m.status === "completed");
      if (alreadyComplete) return current;
      const completedModules = current.programme.completedModules + 1;
      return {
        programme: {
          ...current.programme,
          completedModules,
          progressPercent: current.programme.totalModules > 0
            ? Math.round((completedModules / current.programme.totalModules) * 100)
            : 0,
        },
        modules: current.modules.map((m) =>
          m.id === moduleId ? { ...m, status: "completed" as const, locked: false } : m
        ),
      };
    });
  }, [moduleId]);

  const postProgress = useCallback(async (): Promise<ProgressResult | null> => {
    try {
      const response = await fetch("/api/portal/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId }),
      });
      if (response.status === 401) {
        window.location.assign("/start");
        return null;
      }
      return (await response.json()) as ProgressResult;
    } catch {
      return null;
    }
  }, [moduleId]);

  /**
   * Completion flow: ask Moodle whether the activity is already confirmed; if
   * not, replay the module view in a hidden iframe (records the "viewed" event
   * under the driver's Moodle session) and re-check. Untracked activities have
   * no Moodle confirmation to wait for, so they are marked watched locally.
   */
  const markViewed = useCallback(async () => {
    if (confirmingRef.current) return;
    confirmingRef.current = true;
    setSaving(true);
    setProgressError("");

    try {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const result = await postProgress();
        if (!result || result.success !== true) {
          setProgressError(result?.error || "Your progress could not be confirmed right now. Please try again.");
          return;
        }
        if (result.confirmed) {
          markConfirmed();
          void refresh();
          return;
        }
        if (result.untracked) {
          setWatchedIds((current) => new Set(current).add(moduleId));
          return;
        }
        if (result.moodleUrl) pingModuleView(result.moodleUrl);
        if (attempt < 2) await sleep(4500);
      }
      // Moodle may take longer than our retries to record the view; record the
      // watch locally — the module remains authoritative on the next read.
      setWatchedIds((current) => new Set(current).add(moduleId));
    } finally {
      confirmingRef.current = false;
      setSaving(false);
    }
  }, [moduleId, postProgress, markConfirmed, refresh]);

  if (error && !course) {
    return (
      <div className="page-content">
        <Link href="/portal/course" className="portal-back-link">← Back to my course</Link>
        <h1 className="portal-page-title">Learning module</h1>
        <div className="portal-status-card portal-status-card-error">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
        {refreshControl}
      </div>
    );
  }

  if (!course) {
    return (
      <div className="page-content">
        <Link href="/portal/course" className="portal-back-link">← Back to my course</Link>
        <h1 className="portal-page-title">Loading module…</h1>
        {refreshControl}
      </div>
    );
  }

  if (!module) {
    return (
      <div className="page-content">
        <Link href="/portal/course" className="portal-back-link">← Back to my course</Link>
        <h1 className="portal-page-title">Module not available</h1>
        {refreshControl}
        <div className="portal-status-card">
          <p>This module is not part of your currently assigned programme.</p>
        </div>
      </div>
    );
  }

  const previousModule = course.modules.find((candidate) => candidate.order === module.order - 1);
  const nextModule = course.modules.find((candidate) => candidate.order === module.order + 1);
  const isComplete = module.status === "completed";
  const isWatched = isComplete || watchedIds.has(module.id);
  const hasBunnyVideo = Boolean(module.bunnyVideoId && module.bunnyLibraryId);
  const hasDirectVideo = Boolean(module.videoUrl) && !hasBunnyVideo;
  const isQuiz = module.modname === "quiz" && !hasBunnyVideo && !hasDirectVideo;
  const done = isComplete || isWatched;

  return (
    <div className="page-content">
      <Link href="/portal/course" className="portal-back-link">← Back to my course</Link>

      <div style={{ marginBottom: "1.5rem" }}>
        <span className="pill pill-amber">Module {module.order} of {course.modules.length}</span>
        <h1 className="portal-page-title" style={{ marginTop: "0.75rem" }}>{module.name}</h1>
      </div>

      {refreshControl}

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
        <>
          {/* In-app learning player */}
          {hasBunnyVideo && (
            <BunnyPlayer
              libraryId={module.bunnyLibraryId!}
              videoId={module.bunnyVideoId!}
              moduleName={module.name}
              onEnded={() => void markViewed()}
            />
          )}
          {hasDirectVideo && (
            <VideoPlayer
              videoUrl={module.videoUrl!}
              moduleName={module.name}
              onEnded={() => void markViewed()}
            />
          )}
          {isQuiz && (
            <QuizPlayer
              moduleId={module.id}
              quizId={module.instance}
              moduleName={module.name}
              onSaving={() => setSaving(true)}
              onSettled={() => setSaving(false)}
              onComplete={() => void markViewed()}
            />
          )}
          {!hasBunnyVideo && !hasDirectVideo && !isQuiz && module.url && (
            <MoodleIframe
              moduleId={module.id}
              moduleUrl={module.url}
              moduleName={module.name}
              onViewed={() => void markViewed()}
            />
          )}
          {!hasBunnyVideo && !hasDirectVideo && !isQuiz && !module.url && (
            <div className="portal-status-card" style={{ marginBottom: "1.25rem" }}>
              <AlertCircle size={18} style={{ color: "#F59E0B", flexShrink: 0 }} />
              <p style={{ margin: 0 }}>Learning content is not available for this module yet. Please contact your fleet manager or support team.</p>
            </div>
          )}

          {/* Completion status */}
          <section
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.875rem",
              background: isComplete ? "rgba(16,185,129,0.06)" : "#1C2333",
              border: `1px solid ${isComplete ? "rgba(16,185,129,0.3)" : "#2d3a4f"}`,
              borderRadius: "1rem",
              padding: "1.25rem",
              marginBottom: "1.25rem",
            }}
          >
            {saving ? (
              <Loader2 size={22} style={{ color: "#F59E0B", flexShrink: 0, animation: "spin 1s linear infinite" }} />
            ) : isComplete ? (
              <CheckCircle2 size={22} style={{ color: "#10B981", flexShrink: 0 }} />
            ) : isWatched ? (
              <CheckCircle2 size={22} style={{ color: "#10B981", flexShrink: 0 }} />
            ) : (
              <PlayCircle size={22} style={{ color: "#F59E0B", flexShrink: 0 }} />
            )}
            <div style={{ flex: 1 }}>
              <h2 style={{ color: "#F9FAFB", fontSize: "1rem", margin: "0 0 0.25rem" }}>
                {saving ? "Confirming your progress…" : isComplete ? "Module completed" : isWatched ? "Marked as watched" : "Module in progress"}
              </h2>
              <p style={{ color: "#9CA3AF", margin: 0, lineHeight: 1.5 }}>
                {saving
                  ? "Recording this activity with the learning service."
                  : isComplete
                    ? "Your completion is confirmed and recorded."
                    : isWatched
                      ? "You finished this activity. You can continue to the next module."
                      : "Finish the activity above to complete this module."}
              </p>
            </div>
            {done && !saving && nextModule && (
              <Link
                href={`/portal/module/${nextModule.id}`}
                className="btn-primary"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", textDecoration: "none", flexShrink: 0 }}
              >
                Next module <ArrowRight size={17} />
              </Link>
            )}
          </section>

          {progressError && (
            <div className="portal-status-card portal-status-card-error" style={{ marginBottom: "1.25rem" }}>
              <AlertCircle size={18} />
              <p>{progressError}</p>
            </div>
          )}

          {/* Manual completion for read/watch-at-own-pace modules */}
          {!done && !saving && !isQuiz && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => void markViewed()}
              style={{ width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "1.25rem" }}
            >
              <CheckCircle2 size={17} /> Mark as complete
            </button>
          )}

          {module.url && (
            <p style={{ fontSize: "0.8125rem", color: "#6B7280", margin: "0 0 1.25rem", textAlign: "center" }}>
              Trouble playing?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  fetch("/api/moodle/autologin", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ moduleId: module.id }),
                  })
                    .then((r) => r.json())
                    .then((data) => { if (data.url) window.open(data.url, "_blank", "noopener"); })
                    .catch(() => { if (module.url) window.open(module.url, "_blank", "noopener"); });
                }}
                style={{ color: "#F59E0B" }}
              >
                Open in the learning portal <ExternalLink size={12} style={{ verticalAlign: "middle" }} />
              </a>
            </p>
          )}
        </>
      )}

      <section style={{ marginTop: "1.5rem" }}>
        <h2 style={{ color: "#F9FAFB", fontSize: "1rem", marginBottom: "0.75rem" }}>Programme modules</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {course.modules.map((candidate) => (
            <Link
              key={candidate.id}
              href={candidate.locked || error ? "#" : `/portal/module/${candidate.id}`}
              aria-disabled={candidate.locked || Boolean(error)}
              style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1rem", background: candidate.id === module.id ? "rgba(245,158,11,0.08)" : "#1C2333", border: `1px solid ${candidate.id === module.id ? "rgba(245,158,11,0.3)" : "#2d3a4f"}`, borderRadius: "0.75rem", color: "inherit", textDecoration: "none", opacity: candidate.locked || error ? 0.55 : 1, pointerEvents: candidate.locked || error ? "none" : "auto" }}
            >
              {candidate.status === "completed" ? <CheckCircle2 size={16} style={{ color: "#10B981" }} /> : watchedIds.has(candidate.id) ? <CheckCircle2 size={16} style={{ color: "#10B981" }} /> : candidate.locked ? <Lock size={15} style={{ color: "#6B7280" }} /> : <PlayCircle size={16} style={{ color: "#F59E0B" }} />}
              <span style={{ flex: 1, color: "#F9FAFB", fontSize: "0.875rem" }}>{candidate.order}. {candidate.name}</span>
              {candidate.id === module.id && <ArrowRight size={15} style={{ color: "#F59E0B" }} />}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
