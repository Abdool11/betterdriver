import { Metadata } from "next";
import Link from "next/link";
import { MOCK_MODULES } from "@/lib/constants";
import { moodleCourseUrl } from "@/lib/moodle";
import { CheckCircle2, PlayCircle, Lock, ArrowRight, ExternalLink, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

// DATA REQUIREMENTS (Asif):
// - module: SELECT * FROM modules WHERE id = ? LIMIT 1
// - videos: SELECT * FROM module_videos WHERE module_id = ? ORDER BY order_index ASC
// - completionState: from moodleGetCourseModules() — match by moodle_activity_id
// - quizPassed: from Moodle grade for this module's quiz activity
// TODO: Replace mock data with live Supabase + Moodle queries

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const mod = MOCK_MODULES.find((m) => m.id === id) ?? MOCK_MODULES[0];
  return {
    title: `${mod.title} | BetterDriver`,
  };
}

// Mock video data — Asif to replace with DB query
const MOCK_VIDEOS = [
  { id: "v1", title: "Introduction", durationMinutes: 8, status: "completed" },
  { id: "v2", title: "Core concepts", durationMinutes: 12, status: "completed" },
  { id: "v3", title: "Practical application", durationMinutes: 10, status: "in-progress" },
  { id: "v4", title: "Common mistakes", durationMinutes: 9, status: "locked" },
  { id: "v5", title: "Summary and review", durationMinutes: 7, status: "locked" },
];

export default async function ModuleLandingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const mod = MOCK_MODULES.find((m) => m.id === id) ?? MOCK_MODULES[0];
  const videos = MOCK_VIDEOS;
  const completedVideos = videos.filter((v) => v.status === "completed").length;
  const allVideosComplete = completedVideos === videos.length;
  const quizPassed = false; // TODO: Asif — check Moodle grade for this module's quiz
  const moodleUrl = moodleCourseUrl("professional-truck-driver");

  return (
    <div className="page-content">
      {/* Back link */}
      <Link
        href="/portal/course"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.375rem",
          color: "#9CA3AF",
          fontSize: "0.875rem",
          textDecoration: "none",
          marginBottom: "1.5rem",
        }}
      >
        ← Back to programme
      </Link>

      {/* Module header */}
      <div style={{ marginBottom: "2rem" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "rgba(245,158,11,0.12)",
            border: "1px solid rgba(245,158,11,0.25)",
            borderRadius: "2rem",
            padding: "0.25rem 0.875rem",
            marginBottom: "0.875rem",
          }}
        >
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#F59E0B" }}>
            Module {MOCK_MODULES.indexOf(mod) + 1} of {MOCK_MODULES.length}
          </span>
        </div>
        <h1
          style={{
            fontFamily: "var(--font-dm-sans), sans-serif",
            fontWeight: 800,
            fontSize: "1.75rem",
            color: "#F9FAFB",
            margin: "0 0 0.75rem",
            lineHeight: 1.2,
          }}
        >
          {mod.title}
        </h1>
        <p style={{ color: "#9CA3AF", margin: "0 0 1rem", fontSize: "0.9375rem", lineHeight: 1.6 }}>
          {/* TODO: Asif — replace with mod.description from DB */}
          This module covers the essential knowledge and practical skills you need to operate professionally and safely.
          Complete all five videos, then pass the quiz to unlock the next module.
        </p>
        <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", color: "#6B7280" }}>
            <Clock size={13} /> {mod.durationMinutes} min total
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", color: "#6B7280" }}>
            <PlayCircle size={13} /> 5 videos
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", color: completedVideos > 0 ? "#10B981" : "#6B7280" }}>
            <CheckCircle2 size={13} /> {completedVideos} of 5 complete
          </span>
        </div>
      </div>

      {/* Video list */}
      <h2
        style={{
          fontFamily: "var(--font-dm-sans), sans-serif",
          fontWeight: 700,
          fontSize: "1rem",
          color: "#F9FAFB",
          marginBottom: "0.875rem",
        }}
      >
        Videos
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "2rem" }}>
        {videos.map((video, i) => {
          const isLocked = video.status === "locked";
          return (
            <div
              key={video.id}
              style={{
                background: "#1C2333",
                border: `1px solid ${video.status === "in-progress" ? "rgba(245,158,11,0.3)" : "#2d3a4f"}`,
                borderRadius: "0.75rem",
                padding: "0.875rem 1.125rem",
                display: "flex",
                alignItems: "center",
                gap: "0.875rem",
                opacity: isLocked ? 0.5 : 1,
              }}
            >
              {/* Status icon */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background:
                    video.status === "completed"
                      ? "rgba(16,185,129,0.15)"
                      : video.status === "in-progress"
                        ? "rgba(245,158,11,0.15)"
                        : "rgba(255,255,255,0.04)",
                  border: `1px solid ${
                    video.status === "completed"
                      ? "rgba(16,185,129,0.3)"
                      : video.status === "in-progress"
                        ? "rgba(245,158,11,0.3)"
                        : "rgba(255,255,255,0.08)"
                  }`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {video.status === "completed" ? (
                  <CheckCircle2 size={14} style={{ color: "#10B981" }} />
                ) : video.status === "in-progress" ? (
                  <PlayCircle size={14} style={{ color: "#F59E0B" }} />
                ) : isLocked ? (
                  <Lock size={12} style={{ color: "#6B7280" }} />
                ) : (
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6B7280" }}>{i + 1}</span>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans), sans-serif",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    color: "#F9FAFB",
                    margin: "0 0 0.125rem",
                  }}
                >
                  {video.title}
                </p>
                <p style={{ fontSize: "0.75rem", color: "#6B7280", margin: 0 }}>
                  {isLocked
                    ? "Complete the previous video to unlock."
                    : `${video.durationMinutes} min`}
                </p>
              </div>

              {video.status === "completed" && (
                <span className="pill pill-green" style={{ fontSize: "0.6875rem" }}>Done</span>
              )}
              {video.status === "in-progress" && (
                <span className="pill pill-amber" style={{ fontSize: "0.6875rem" }}>In progress</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Quiz status */}
      <div
        style={{
          background: "#1C2333",
          border: `1px solid ${quizPassed ? "rgba(16,185,129,0.3)" : allVideosComplete ? "rgba(245,158,11,0.3)" : "#2d3a4f"}`,
          borderRadius: "1rem",
          padding: "1.25rem 1.5rem",
          marginBottom: "2rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "0.625rem",
            background: quizPassed
              ? "rgba(16,185,129,0.12)"
              : allVideosComplete
                ? "rgba(245,158,11,0.12)"
                : "rgba(255,255,255,0.04)",
            border: `1px solid ${quizPassed ? "rgba(16,185,129,0.25)" : allVideosComplete ? "rgba(245,158,11,0.25)" : "rgba(255,255,255,0.08)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {quizPassed ? (
            <CheckCircle2 size={18} style={{ color: "#10B981" }} />
          ) : (
            <span style={{ fontSize: "1rem" }}>📝</span>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontWeight: 700,
              fontSize: "0.9375rem",
              color: "#F9FAFB",
              margin: "0 0 0.125rem",
            }}
          >
            Module quiz
          </p>
          <p style={{ fontSize: "0.8125rem", color: "#6B7280", margin: 0 }}>
            {quizPassed
              ? "Passed. Next module unlocked."
              : allVideosComplete
                ? "All videos complete. You are ready to take the quiz."
                : "Complete all 5 videos to unlock the quiz."}
          </p>
        </div>
        {quizPassed && (
          <span className="pill pill-green" style={{ fontSize: "0.6875rem" }}>Passed</span>
        )}
      </div>

      {/* Launch Moodle CTA */}
      {!quizPassed && (
        <a
          href={moodleUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.625rem",
            width: "100%",
            padding: "1rem 1.5rem",
            background: allVideosComplete
              ? "linear-gradient(135deg, #F59E0B, #D97706)"
              : "rgba(255,255,255,0.06)",
            color: allVideosComplete ? "#111827" : "rgba(255,255,255,0.5)",
            border: "none",
            borderRadius: "0.875rem",
            fontFamily: "var(--font-dm-sans), sans-serif",
            fontWeight: 700,
            fontSize: "1rem",
            textDecoration: "none",
            cursor: allVideosComplete ? "pointer" : "not-allowed",
            pointerEvents: allVideosComplete ? "auto" : "none",
          }}
        >
          {allVideosComplete ? (
            <>Open in Moodle <ExternalLink size={16} /></>
          ) : (
            <>Complete all videos to unlock quiz</>
          )}
        </a>
      )}

      {/* Next module link */}
      {quizPassed && (
        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <Link
            href="/portal/course"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "#14b8a6",
              fontSize: "0.9375rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Continue to next module <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}