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
import VideoPlayer from "./VideoPlayer";

interface ModuleContentProps {
  id: string;
  moduleName: string;
  moduleIndex: number;
  totalModules: number;
  isComplete: boolean;
  moduleUrl: string;
  videoUrl: string;
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
  videoUrl,
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
          fontSize: "clamp(0.8125rem, 2.5vw, 0.875rem)",
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
            fontSize: "clamp(1.25rem, 5vw, 1.75rem)",
            color: "#F9FAFB",
            margin: "0 0 0.75rem",
            lineHeight: 1.2,
          }}
        >
          {moduleName || "Module"}
        </h1>
        {hasData && (
          <div style={{ display: "flex", gap: "clamp(0.75rem, 3vw, 1.25rem)", flexWrap: "wrap", alignItems: "center" }}>
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
            padding: "clamp(0.875rem, 3vw, 1.25rem) clamp(1rem, 4vw, 1.5rem)",
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

      {/* Native video player — direct video files uploaded to Moodle */}
      {videoUrl && !bunnyVideoId && (
        <VideoPlayer
          videoUrl={videoUrl}
          moduleId={id}
          moduleName={moduleName || "Module"}
          onComplete={handleComplete}
        />
      )}

      {/* Native quiz player — when module is a Moodle quiz */}
      {modName === "quiz" && !bunnyVideoId && !videoUrl && (
        <QuizPlayer moduleId={id} quizId={quizId} moduleName={moduleName || "Quiz"} />
      )}

      {/* Moodle iframe fallback — when no Bunny video, direct video, or quiz */}
      {!bunnyVideoId && !videoUrl && modName !== "quiz" && moduleUrl && (
        <MoodleIframe moduleUrl={moduleUrl} moduleName={moduleName || "Module"} />
      )}

      {/* Completion status — only when we successfully found the module */}
      {hasData && (
        <div
          className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-2xl mb-8 ${
            complete ? "border border-emerald-500/30 bg-emerald-500/[0.06]" : "border border-amber-500/30 bg-[#1C2333]"
          }`}
        >
          <div
            className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${
              complete ? "bg-emerald-500/15 border border-emerald-500/25" : "bg-amber-500/15 border border-amber-500/25"
            }`}
          >
            {complete ? (
              <CheckCircle2 size={20} className="text-emerald-500" />
            ) : (
              <PlayCircle size={20} className="text-amber-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={`font-bold text-[0.9375rem] mb-0.5 ${
                complete ? "text-emerald-500" : "text-amber-500"
              }`}
              style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
            >
              {complete ? "Module completed" : "Module in progress"}
            </p>
            <p className="text-[0.8125rem] text-gray-500 m-0">
              {complete
                ? "You have completed this module. Great work!"
                : "Finish the activity above to mark this module complete."}
            </p>
          </div>
          {complete && nextModuleId && (
            <Link
              href={`/portal/module/${nextModuleId}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-[0.9375rem] shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-amber-500 transition-colors shrink-0"
              style={{ fontFamily: "var(--font-dm-sans), sans-serif", textDecoration: "none" }}
            >
              Next module <ArrowRight size={18} />
            </Link>
          )}
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <Link
          href="/portal/course"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "#9CA3AF",
            fontSize: "clamp(0.875rem, 3vw, 0.9375rem)",
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
