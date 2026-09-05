"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  BookOpen,
  CheckCircle2,
  Lock,
  PlayCircle,
  ChevronRight,
  Award,
  Wifi,
  Download,
  X,
} from "lucide-react";

interface Module {
  id: string;
  title: string;
  status: "completed" | "in_progress" | "locked" | "available";
  unit: number;
  downloadable: boolean;
}

interface Programme {
  title: string;
  progress: number;
  totalModules: number;
  completedModules: number;
  modules: Module[];
}

// Neutral starting state — real progress arrives from /api/portal/course.
const INITIAL_PROGRAMME: Programme = {
  title: "",
  progress: 0,
  totalModules: 0,
  completedModules: 0,
  modules: [],
};

const statusConfig = {
  completed: { icon: CheckCircle2, color: "var(--success)", label: "Completed", bg: "var(--success-subtle)" },
  in_progress: { icon: PlayCircle, color: "var(--amber)", label: "In Progress", bg: "var(--amber-subtle)" },
  available: { icon: PlayCircle, color: "var(--info)", label: "Start", bg: "var(--info-subtle)" },
  locked: { icon: Lock, color: "var(--text-muted)", label: "Locked", bg: "rgba(255,255,255,0.04)" },
};

interface CourseApiResponse {
  programme: {
    slug: string;
    title: string;
    progressPercent: number;
    totalModules: number;
    completedModules: number;
  };
  modules: Array<{
    id: string;
    name: string;
    status: "completed" | "in_progress" | "available";
    locked: boolean;
    order: number;
    downloadable: boolean;
  }>;
}

export default function LearningPage() {
  const [showDownloadBanner, setShowDownloadBanner] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [prog, setProg] = useState<Programme>(INITIAL_PROGRAMME);

  useEffect(() => {
    fetch("/api/portal/course")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (d.programme && Array.isArray(d.modules)) {
          setProg({
            title: d.programme.title,
            progress: d.programme.progressPercent,
            totalModules: d.programme.totalModules,
            completedModules: d.programme.completedModules,
            modules: d.modules.map(
              (m: {
                id: string;
                name: string;
                status: "completed" | "in_progress" | "available";
                locked: boolean;
                order: number;
                downloadable: boolean;
              }) => ({
                id: m.id,
                title: m.name,
                status: m.locked ? "locked" : m.status,
                unit: m.order,
                downloadable: m.downloadable,
              })
            ),
          });
        } else {
          setLoadError(true);
        }
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  const startDownload = (mod: Module) => {
    window.location.href = `/api/portal/download?moduleId=${encodeURIComponent(mod.id)}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header */}
      <div>
        <div className="section-label" style={{ marginBottom: "0.75rem" }}>
          <BookOpen size={12} /> Driver University
        </div>
        <h2 style={{ marginBottom: "0.25rem" }}>{prog.title || "…"}</h2>
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
          Work through each module at your own pace. Complete all units to earn your certificate.
        </p>
      </div>

      {loadError && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "0.875rem", padding: "1rem" }}>
          <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)", margin: 0 }}>
            Unable to load your course right now. Please try again later.
          </p>
        </div>
      )}

      {/* WiFi download banner */}
      {showDownloadBanner && prog.modules.some((m) => m.downloadable) && (
        <div style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "0.875rem", padding: "1rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
            <div style={{ width: 32, height: 32, background: "rgba(59,130,246,0.15)", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Wifi size={15} color="#3B82F6" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--text-primary)", margin: "0 0 0.25rem" }}>Save data — download on WiFi</p>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", margin: "0 0 0.625rem", lineHeight: 1.5 }}>Download your course materials now while on WiFi so you can study without using mobile data.</p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {prog.modules.filter((m) => m.downloadable).map((mod) => (
                  <button key={mod.id} type="button"
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.375rem 0.625rem", background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: "0.5rem", color: "#3B82F6", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
                    onClick={() => startDownload(mod)}
                  >
                    <Download size={11} /> Module {mod.unit}
                  </button>
                ))}
              </div>
            </div>
            <button type="button" onClick={() => setShowDownloadBanner(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.25rem", flexShrink: 0 }}><X size={14} /></button>
          </div>
        </div>
      )}

      {/* Programme card */}
      <div className="card-elevated">
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem", marginBottom: "1rem" }}>
          <div
            style={{
              width: "3rem",
              height: "3rem",
              background: "var(--amber-subtle)",
              borderRadius: "0.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <BookOpen size={22} style={{ color: "var(--amber)" }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ marginBottom: "0.25rem", fontSize: "1rem" }}>{prog.title || "…"}</h3>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              Work through each module at your own pace. Complete all units to earn your certificate.
            </p>
          </div>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", fontWeight: 600 }}>
              {loading ? "…" : `${prog.completedModules} of ${prog.totalModules} modules complete`}
            </span>
            <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--amber)" }}>
              {loading ? "…" : `${prog.progress}%`}
            </span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${prog.progress}%` }} />
          </div>
        </div>

        {/* Meta */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <Award size={13} style={{ color: "var(--success)" }} />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Certificate on completion</span>
          </div>
        </div>
      </div>

      {/* Module list */}
      <div>
        <div className="section-header">
          <span className="section-title">Modules</span>
          {!loading && (
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {prog.completedModules}/{prog.totalModules} done
            </span>
          )}
        </div>

        {loading && (
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Loading your modules…</p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {prog.modules.map((mod) => {
            const cfg = statusConfig[mod.status];
            const Icon = cfg.icon;
            const isClickable = mod.status !== "locked";

            const content = (
              <div
                className="card"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.875rem",
                  opacity: mod.status === "locked" ? 0.55 : 1,
                  cursor: isClickable ? "pointer" : "default",
                  transition: "border-color 0.15s",
                  borderLeft: mod.status === "in_progress"
                    ? "3px solid var(--amber)"
                    : mod.status === "completed"
                    ? "3px solid var(--success)"
                    : "3px solid transparent",
                }}
              >
                {/* Unit number */}
                <div
                  style={{
                    width: "1.75rem",
                    height: "1.75rem",
                    borderRadius: "50%",
                    background: cfg.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={14} style={{ color: cfg.color }} />
                </div>

                {/* Title */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      color: mod.status === "locked" ? "var(--text-muted)" : "var(--text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {mod.unit}. {mod.title}
                  </div>
                  {mod.status === "in_progress" && (
                    <div style={{ fontSize: "0.75rem", color: "var(--amber)", fontWeight: 600, marginTop: "0.125rem" }}>
                      In progress
                    </div>
                  )}
                </div>

                {/* Action */}
                {mod.status === "in_progress" && (
                  <span className="badge badge-amber">Continue</span>
                )}
                {mod.status === "available" && (
                  <span className="badge badge-info">Start</span>
                )}
                {mod.status === "completed" && (
                  <CheckCircle2 size={16} style={{ color: "var(--success)", flexShrink: 0 }} />
                )}
                {mod.status === "locked" && (
                  <Lock size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                )}
              </div>
            );

            return isClickable ? (
              <Link key={mod.id} href={`/portal/module/${mod.id}`} style={{ textDecoration: "none" }}>
                {content}
              </Link>
            ) : (
              <div key={mod.id}>{content}</div>
            );
          })}
        </div>
      </div>

      {/* Completion CTA */}
      {prog.progress >= 100 && (
        <Link href="/portal/certificate" style={{ textDecoration: "none" }}>
          <div className="card-amber" style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
            <Award size={24} style={{ color: "var(--amber)", flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>Programme Complete!</div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                Your certificate is ready to download.
              </div>
            </div>
            <ChevronRight size={18} style={{ color: "var(--amber)", marginLeft: "auto", flexShrink: 0 }} />
          </div>
        </Link>
      )}
    </div>
  );
}
