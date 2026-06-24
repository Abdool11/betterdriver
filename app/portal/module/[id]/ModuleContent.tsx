"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  PlayCircle,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import BunnyPlayer from "./BunnyPlayer";
import QuizPlayer from "./QuizPlayer";
import MoodleIframe from "./MoodleIframe";

interface ModuleContentProps {
  id: string;
  moduleName: string;
  moduleIndex: number;
  totalModules: number;
  isComplete: boolean;
  moduleUrl: string;
  nextModuleId: string | null;
  loadError: string;
  bunnyVideoId: string;
  bunnyLibraryId: string;
  modName: string;
  quizId: number;
  hasData: boolean;
}

export default function ModuleContent({
  id,
  moduleName,
  moduleIndex,
  totalModules,
  isComplete,
  moduleUrl,
  nextModuleId,
  loadError,
  bunnyVideoId,
  bunnyLibraryId,
  modName,
  quizId,
  hasData,
}: ModuleContentProps) {
  const [complete, setComplete] = useState(isComplete);

  const handleComplete = () => {
    setComplete(true);
  };

  return (
    <div className="page-content">
      {/* Back link */}
      <Link
        href="/portal/learning"
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
        {totalModules > 0 && moduleIndex >= 0 && (
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
              Module {moduleIndex + 1} of {totalModules}
            </span>
          </div>
        )}
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
          {moduleName || "Module"}
        </h1>
        {hasData && (
          <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
            {complete ? (
              <span style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", color: "#10B981" }}>
                <CheckCircle2 size={13} /> Completed
              </span>
            ) : (
              <span style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", color: "#F59E0B" }}>
                <PlayCircle size={13} /> In progress
              </span>
            )}
          </div>
        )}
      </div>

      {/* Error state */}
      {loadError && (
        <div
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: "1rem",
            padding: "1.25rem 1.5rem",
            marginBottom: "2rem",
            display: "flex",
            alignItems: "flex-start",
            gap: "0.875rem",
          }}
        >
          <AlertCircle size={20} style={{ color: "#EF4444", flexShrink: 0, marginTop: "0.125rem" }} />
          <div>
            <p
              style={{
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontWeight: 700,
                fontSize: "0.9375rem",
                color: "#F9FAFB",
                margin: "0 0 0.25rem",
              }}
            >
              Couldn&apos;t load module content
            </p>
            <p style={{ fontSize: "0.8125rem", color: "#9CA3AF", margin: 0 }}>
              {loadError}
            </p>
          </div>
        </div>
      )}

      {/* Bunny Stream player — preferred when video data exists */}
      {bunnyVideoId && bunnyLibraryId && (
        <BunnyPlayer
          libraryId={bunnyLibraryId}
          videoId={bunnyVideoId}
          moduleId={id}
          moduleName={moduleName || "Module"}
          onComplete={handleComplete}
        />
      )}

      {/* Native quiz player — when module is a Moodle quiz */}
      {modName === "quiz" && !bunnyVideoId && (
        <QuizPlayer moduleId={id} quizId={quizId} moduleName={moduleName || "Quiz"} />
      )}

      {/* Moodle iframe fallback — when no Bunny video or as secondary option */}
      {!bunnyVideoId && modName !== "quiz" && moduleUrl && (
        <MoodleIframe moduleUrl={moduleUrl} moduleName={moduleName || "Module"} />
      )}

      {/* Completion status — only when we successfully found the module */}
      {hasData && (
        <div
          style={{
            background: "#1C2333",
            border: `1px solid ${complete ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}`,
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
              background: complete ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
              border: `1px solid ${complete ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {complete ? (
              <CheckCircle2 size={18} style={{ color: "#10B981" }} />
            ) : (
              <PlayCircle size={18} style={{ color: "#F59E0B" }} />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontWeight: 700,
                fontSize: "0.9375rem",
                color: complete ? "#10B981" : "#F59E0B",
                margin: "0 0 0.125rem",
              }}
            >
              {complete ? "Module completed" : "Module in progress"}
            </p>
            <p style={{ fontSize: "0.8125rem", color: "#6B7280", margin: 0 }}>
              {complete
                ? "You have completed this module. Great work!"
                : "Finish the activity above to mark this module complete."}
            </p>
          </div>
          {complete && (
            <span className="pill pill-green" style={{ fontSize: "0.6875rem" }}>Done</span>
          )}
          {complete && nextModuleId && (
            <Link
              href={`/portal/module/${nextModuleId}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                background: "var(--amber)",
                color: "#111827",
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontWeight: 700,
                fontSize: "0.8125rem",
                padding: "0.5rem 0.875rem",
                borderRadius: "0.625rem",
                textDecoration: "none",
                flexShrink: 0,
              }}
            >
              Next module <ArrowRight size={14} />
            </Link>
          )}
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
        <Link
          href="/portal/course"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "#9CA3AF",
            fontSize: "0.9375rem",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          ← Back to programme
        </Link>
      </div>
    </div>
  );
}
