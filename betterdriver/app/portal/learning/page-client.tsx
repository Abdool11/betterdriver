"use client";

import { useState } from "react";
import Link from "next/link";


import {
  BookOpen,
  CheckCircle2,
  Clock,
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
  duration: string;
  status: "completed" | "in_progress" | "locked" | "available";
  unit: number;
}

interface Programme {
  id: string;
  title: string;
  description: string;
  progress: number;
  totalModules: number;
  completedModules: number;
  estimatedHours: number;
  modules: Module[];
}

const MOCK_PROGRAMME: Programme = {
  id: "prog-1",
  title: "Driver University Programme",
  description:
    "Build the skills, knowledge, and professional standing that make you a safer, more valuable driver on South African roads.",
  progress: 42,
  totalModules: 12,
  completedModules: 5,
  estimatedHours: 24,
  modules: [
    { id: "m1", unit: 1, title: "Road Traffic Act — Your Rights and Responsibilities", duration: "45 min", status: "completed" },
    { id: "m2", unit: 2, title: "Defensive Driving Principles", duration: "60 min", status: "completed" },
    { id: "m3", unit: 3, title: "Fatigue Management and Hours of Service", duration: "50 min", status: "completed" },
    { id: "m4", unit: 4, title: "Vehicle Inspection and Pre-Trip Checks", duration: "40 min", status: "completed" },
    { id: "m5", unit: 5, title: "Load Security and Overloading", duration: "55 min", status: "completed" },
    { id: "m6", unit: 6, title: "Hazardous Materials Awareness", duration: "60 min", status: "in_progress" },
    { id: "m7", unit: 7, title: "Emergency Procedures and Incident Reporting", duration: "45 min", status: "available" },
    { id: "m8", unit: 8, title: "Fuel Efficiency and Eco-Driving", duration: "40 min", status: "locked" },
    { id: "m9", unit: 9, title: "Driver Health and Wellness", duration: "35 min", status: "locked" },
    { id: "m10", unit: 10, title: "Professional Communication", duration: "30 min", status: "locked" },
    { id: "m11", unit: 11, title: "Green Freight Awareness", duration: "50 min", status: "locked" },
    { id: "m12", unit: 12, title: "Final Assessment and Certification", duration: "90 min", status: "locked" },
  ],
};

const statusConfig = {
  completed: { icon: CheckCircle2, color: "var(--success)", label: "Completed", bg: "var(--success-subtle)" },
  in_progress: { icon: PlayCircle, color: "var(--amber)", label: "In Progress", bg: "var(--amber-subtle)" },
  available: { icon: PlayCircle, color: "var(--info)", label: "Start", bg: "var(--info-subtle)" },
  locked: { icon: Lock, color: "var(--text-muted)", label: "Locked", bg: "rgba(255,255,255,0.04)" },
};

export default function LearningPage() {
  const [expanded, setExpanded] = useState<string | null>("prog-1");
  const [showDownloadBanner, setShowDownloadBanner] = useState(true);
  const prog = MOCK_PROGRAMME;

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
                {prog.modules.filter(m => m.status !== "locked").map((mod) => (
                  <button key={mod.id} type="button"
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.375rem 0.625rem", background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: "0.5rem", color: "#3B82F6", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
                    onClick={() => alert(`Downloading: ${mod.title}`)}
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
            <h3 style={{ marginBottom: "0.25rem", fontSize: "1rem" }}>{prog.title}</h3>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              {prog.description}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", fontWeight: 600 }}>
              {prog.completedModules} of {prog.totalModules} modules complete
            </span>
            <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--amber)" }}>
              {prog.progress}%
            </span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${prog.progress}%` }} />
          </div>
        </div>

        {/* Meta */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <Clock size={13} style={{ color: "var(--text-muted)" }} />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{prog.estimatedHours}h total</span>
          </div>
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
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {prog.completedModules}/{prog.totalModules} done
          </span>
        </div>

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
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", gap: "0.5rem", marginTop: "0.125rem" }}>
                    <span>{mod.duration}</span>
                    {mod.status === "in_progress" && (
                      <span style={{ color: "var(--amber)", fontWeight: 600 }}>· In progress</span>
                    )}
                  </div>
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
              <Link key={mod.id} href={`/portal/learning/${mod.id}`} style={{ textDecoration: "none" }}>
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
