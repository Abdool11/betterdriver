import { Metadata } from "next";
import Link from "next/link";
import { MOCK_ENROLMENT, MOCK_MODULES } from "@/lib/constants";
import { CheckCircle2, Clock, PlayCircle, ArrowRight, Lock } from "lucide-react";

export const dynamic = "force-dynamic";


// DATA REQUIREMENTS:
// - enrolment: Enrolment — Supabase: SELECT * FROM enrolments WHERE driver_id = ? AND status = 'active' LIMIT 1
// - modules: Module[] — Supabase: SELECT * FROM modules WHERE programme_id = ? ORDER BY order_index ASC
// TODO: Asif — replace MOCK_ENROLMENT and MOCK_MODULES with live Supabase + Moodle data
// moodleGetCourseModules() returns completion state per module

export const metadata: Metadata = {
  title: "My Programme | BetterDriver",
  description: "Track your progress through the Professional Truck Driver programme.",
};

export default function CoursePage() {
  const enrolment = MOCK_ENROLMENT;
  const modules = MOCK_MODULES;
  const completed = modules.filter((m) => m.status === "completed").length;
  const inProgress = modules.find((m) => m.status === "in-progress");
  const nextModule = inProgress ?? modules.find((m) => m.status === "upcoming");

  return (
    <div className="page-content">
      <div className="mock-banner" style={{ marginBottom: "1.5rem" }}>
        MOCK DATA — Asif to connect live Supabase enrolment + Moodle module data
      </div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 800, fontSize: "1.75rem", color: "#F9FAFB", margin: "0 0 0.375rem" }}>
          {enrolment.programmeTitle}
        </h1>
        <p style={{ color: "#9CA3AF", margin: 0, fontSize: "0.9375rem" }}>
          {completed} of {modules.length} modules complete
        </p>
      </div>

      {/* Progress summary card */}
      <div
        style={{
          background: "#1C2333",
          border: "1px solid #2d3a4f",
          borderRadius: "1.25rem",
          padding: "1.5rem 2rem",
          marginBottom: "2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1.5rem",
        }}
      >
        <div>
          <p style={{ fontSize: "0.8125rem", color: "#6B7280", margin: "0 0 0.25rem" }}>Your progress</p>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 800, fontSize: "2rem", color: "#F59E0B", margin: "0 0 0.5rem" }}>
            {enrolment.progressPercent}%
          </p>
          <div className="progress-bar" style={{ width: 200 }}>
            <div className="progress-fill" style={{ width: `${enrolment.progressPercent}%` }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: "2rem" }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "#F9FAFB", margin: "0 0 0.25rem" }}>
              {completed}
            </p>
            <p style={{ fontSize: "0.75rem", color: "#6B7280", margin: 0 }}>Done</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "#F9FAFB", margin: "0 0 0.25rem" }}>
              {modules.length - completed}
            </p>
            <p style={{ fontSize: "0.75rem", color: "#6B7280", margin: 0 }}>Remaining</p>
          </div>
        </div>
        {/* Continue / Start CTA — links to the next module landing page */}
        {nextModule && (
          <Link
            href={`/portal/module/${nextModule.id}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "#F59E0B",
              color: "#111827",
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontWeight: 700,
              fontSize: "0.9375rem",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.75rem",
              textDecoration: "none",
            }}
          >
            {inProgress ? "Continue" : "Start"} <ArrowRight size={16} />
          </Link>
        )}
      </div>

      {/* Module list */}
      <h2 style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 700, fontSize: "1.125rem", color: "#F9FAFB", marginBottom: "1rem" }}>
        All modules
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        {modules.map((mod, i) => {
          const isLocked = mod.status === "upcoming" && i > 0 && modules[i - 1].status !== "completed";
          return (
          <Link
            key={mod.id}
            href={isLocked ? "#" : `/portal/module/${mod.id}`}
            style={{
              background: "#1C2333",
              border: `1px solid ${mod.status === "in-progress" ? "rgba(245,158,11,0.35)" : "#2d3a4f"}`,
              borderRadius: "0.875rem",
              padding: "1rem 1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              opacity: isLocked ? 0.5 : 1,
              cursor: isLocked ? "default" : "pointer",
              textDecoration: "none",
              pointerEvents: isLocked ? "none" : "auto",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                background:
                  mod.status === "completed"
                    ? "rgba(16,185,129,0.12)"
                    : mod.status === "in-progress"
                      ? "rgba(245,158,11,0.12)"
                      : "#243044",
                border: `1px solid ${mod.status === "completed" ? "rgba(16,185,129,0.25)" : mod.status === "in-progress" ? "rgba(245,158,11,0.25)" : "#2d3a4f"}`,
                borderRadius: "0.625rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {mod.status === "completed" ? (
                <CheckCircle2 size={16} style={{ color: "#10B981" }} />
              ) : mod.status === "in-progress" ? (
                <PlayCircle size={16} style={{ color: "#F59E0B" }} />
              ) : isLocked ? (
                <Lock size={14} style={{ color: "#6B7280" }} />
              ) : (
                <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 700, fontSize: "0.75rem", color: "#6B7280" }}>
                  {i + 1}
                </span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#F9FAFB", margin: "0 0 0.125rem" }}>
                {mod.title}
              </p>
              <p style={{ fontSize: "0.75rem", color: "#6B7280", margin: 0, display: "flex", alignItems: "center", gap: "0.375rem" }}>
                {isLocked ? (
                  "Complete the previous module to unlock this one."
                ) : (
                  <><Clock size={12} /> {mod.durationMinutes} min</>
                )}
              </p>
            </div>
            {mod.status === "in-progress" && (
              <span className="pill pill-amber" style={{ fontSize: "0.6875rem" }}>
                In progress
              </span>
            )}
            {mod.status === "completed" && (
              <span className="pill pill-green" style={{ fontSize: "0.6875rem" }}>
                Done
              </span>
            )}
            {!isLocked && mod.status !== "completed" && (
              <ArrowRight size={16} style={{ color: "#6B7280", flexShrink: 0 }} />
            )}
          </Link>
          );
        })}
      </div>
    </div>
  );
}