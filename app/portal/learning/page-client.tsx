"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

import {
  BookOpen,
  CheckCircle2,
  Clock,
  PlayCircle,
  ChevronRight,
  Award,
  Wifi,
  Download,
  X,
} from "lucide-react";

interface Module {
  id: string;
  name: string;
  status: "completed" | "in_progress" | "available";
  order: number;
  url?: string;
  downloadable?: boolean;
  downloadSize?: number;
  downloadFilename?: string;
  locked?: boolean;
}

interface Programme {
  title: string;
  progressPercent: number;
  totalModules: number;
  completedModules: number;
}

const statusConfig = {
  completed: { icon: CheckCircle2, color: "var(--success)", label: "Completed", bg: "var(--success-subtle)" },
  in_progress: { icon: PlayCircle, color: "var(--amber)", label: "In Progress", bg: "var(--amber-subtle)" },
  available: { icon: PlayCircle, color: "var(--info)", label: "Start", bg: "var(--info-subtle)" },
};

export default function LearningPage() {
  const [expanded, setExpanded] = useState<string | null>("prog-1");
  const [showDownloadBanner, setShowDownloadBanner] = useState(true);
  const [programme, setProgramme] = useState<Programme | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/course", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.programme) setProgramme(d.programme);
        if (d.modules) setModules(d.modules);
      })
      .catch((err) => console.error("[LEARNING] Failed to fetch course:", err))
      .finally(() => setLoading(false));
  }, []);

  const prog = programme ?? {
    title: "Driver University Programme",
    progressPercent: 0,
    totalModules: 0,
    completedModules: 0,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header */}
      <div>
        <div className="section-label" style={{ marginBottom: "0.75rem" }}>
          <BookOpen size={12} /> Driver University
        </div>
        <h2 style={{ marginBottom: "0.25rem" }}>Driver University</h2>
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
          Work through each module at your own pace. Complete all units to earn your certificate.
        </p>
      </div>

      {/* Current / Next module — the only module the driver can access */}
      <div>
        <div className="section-header">
          <span className="section-title">
            {modules.find((m) => m.status === "in_progress") ? "Current module" : "Next module"}
          </span>
        </div>

        {(() => {
          const currentModule = modules.find((m) => m.status === "in_progress") ?? modules.find((m) => m.status === "available" && !m.locked);
          const allDone = prog.completedModules === prog.totalModules && prog.totalModules > 0;

          if (allDone) {
            return (
              <div className="card" style={{ textAlign: "center", padding: "1.5rem" }}>
                <CheckCircle2 size={28} style={{ color: "var(--success)", margin: "0 auto 0.75rem" }} />
                <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-primary)", margin: "0 0 0.25rem" }}>
                  Programme complete!
                </p>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", margin: 0 }}>
                  You have completed all modules. Your certificate is ready.
                </p>
              </div>
            );
          }

          if (!currentModule) {
            return (
              <div className="card" style={{ padding: "1.25rem" }}>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: 0 }}>
                  No module available right now.
                </p>
              </div>
            );
          }

          const cfg = statusConfig[currentModule.status];
          const Icon = cfg.icon;

          return (
            <Link key={currentModule.id} href={`/portal/module/${currentModule.id}`} style={{ textDecoration: "none" }}>
              <div
                className="card"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.875rem",
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                  borderLeft: "3px solid var(--amber)",
                }}
              >
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

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      color: "var(--text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {currentModule.order}. {currentModule.name}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", gap: "0.5rem", marginTop: "0.125rem" }}>
                    {currentModule.status === "in_progress" && (
                      <span style={{ color: "var(--amber)", fontWeight: 600 }}>· In progress</span>
                    )}
                    {currentModule.status === "available" && (
                      <span style={{ color: "var(--info)", fontWeight: 600 }}>· Ready to start</span>
                    )}
                  </div>
                </div>

                {currentModule.status === "in_progress" && (
                  <span className="badge badge-amber pulse-amber">Continue</span>
                )}
                {currentModule.status === "available" && (
                  <span className="badge badge-info">Start</span>
                )}
              </div>
            </Link>
          );
        })()}
      </div>

      {/* WiFi download banner */}
      {showDownloadBanner && (
        <div style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "0.875rem", padding: "1rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
            <div style={{ width: 32, height: 32, background: "rgba(59,130,246,0.15)", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Wifi size={15} color="#3B82F6" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--text-primary)", margin: "0 0 0.25rem" }}>Save data — download on WiFi</p>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", margin: "0 0 0.625rem", lineHeight: 1.5 }}>Download your course materials now while on WiFi so you can study without using mobile data.</p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {(() => {
                  const currentModule = modules.find((m) => m.status === "in_progress") ?? modules.find((m) => m.status === "available" && !m.locked);
                  if (!currentModule || !currentModule.downloadable) return null;
                  return (
                    <a
                      key={currentModule.id}
                      href={`/api/portal/download?moduleId=${currentModule.id}`}
                      download={currentModule.downloadFilename}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.375rem",
                        padding: "0.375rem 0.625rem",
                        background: "rgba(59,130,246,0.12)",
                        border: "1px solid rgba(59,130,246,0.25)",
                        borderRadius: "0.5rem",
                        color: "#3B82F6",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        textDecoration: "none",
                      }}
                    >
                      <Download size={11} /> Module {currentModule.order}
                    </a>
                  );
                })()}
                {!loading && modules.every((mod) => !mod.downloadable) && (
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    No downloadable materials found in this programme.
                  </span>
                )}
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
            <h3 style={{ marginBottom: "0.25rem", fontSize: "1rem" }}>{prog.title}</h3>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              Build the skills, knowledge, and professional standing that make you a safer, more valuable driver on South African roads.
            </p>
          </div>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: "1rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.625rem",
            }}
          >
            <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", fontWeight: 600 }}>
              {prog.completedModules} of {prog.totalModules} modules complete
            </span>
            <span
              style={{
                fontSize: "0.8125rem",
                fontWeight: 700,
                color: "var(--amber)",
                background: "var(--amber-subtle)",
                padding: "0.125rem 0.5rem",
                borderRadius: "9999px",
                minWidth: "2.5rem",
                textAlign: "center",
              }}
            >
              {prog.progressPercent}%
            </span>
          </div>
          <div
            style={{
              height: "0.625rem",
              background: "var(--amber-subtle)",
              borderRadius: "9999px",
              overflow: "hidden",
              border: "1px solid rgba(245, 158, 11, 0.15)",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${prog.progressPercent}%`,
                background: "var(--amber)",
                borderRadius: "9999px",
                transition: "width 0.6s ease",
              }}
            />
          </div>
        </div>

        {/* Meta */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <Clock size={13} style={{ color: "var(--text-muted)" }} />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Self-paced modules</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <Award size={13} style={{ color: "var(--success)" }} />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Certificate on completion</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-amber {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(245, 158, 11, 0); }
        }
        .pulse-amber {
          animation: pulse-amber 2s infinite;
        }
      `}</style>

      {/* Completion CTA */}
      {prog.progressPercent >= 100 && (
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
