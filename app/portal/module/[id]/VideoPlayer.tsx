"use client";

import { useRef, useState } from "react";
import { Loader2, PlayCircle } from "lucide-react";

interface Props {
  videoUrl: string;
  moduleId: string;
  moduleName: string;
  onComplete?: () => void;
}

export default function VideoPlayer({ videoUrl, moduleId, moduleName, onComplete }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "ended">("loading");
  const markedRef = useRef(false);
  const lastReportedRef = useRef(0);

  async function reportProgress(percent: number, completed: boolean) {
    try {
      const res = await fetch("/api/portal/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, completed, percentWatched: Math.round(percent) }),
      });
      if (!res.ok) {
        console.error("[VideoPlayer] Progress API returned", res.status);
        return;
      }
      if (completed) onComplete?.();
    } catch (err) {
      console.error("[VideoPlayer] Failed to report progress:", err);
    }
  }

  async function markComplete() {
    await reportProgress(100, true);
  }

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || video.duration <= 0) return;

    const percent = (video.currentTime / video.duration) * 100;
    const threshold = Math.floor(percent / 10) * 10;
    if (threshold > lastReportedRef.current && threshold < 90) {
      lastReportedRef.current = threshold;
      reportProgress(percent, false);
    }
    if (percent >= 90 && !markedRef.current) {
      markedRef.current = true;
      markComplete();
    }
  };

  const handleEnded = () => {
    setPhase("ended");
    if (!markedRef.current) {
      markedRef.current = true;
      markComplete();
    }
  };

  return (
    <div style={{ marginBottom: "2rem" }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingBottom: "56.25%",
          background: "#0d1526",
          borderRadius: "1rem",
          overflow: "hidden",
          border: "1px solid #2d3a4f",
        }}
      >
        {phase === "loading" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
            }}
          >
            <Loader2 size={28} style={{ color: "#F59E0B", animation: "spin 1s linear infinite" }} />
            <p style={{ fontSize: "0.875rem", color: "#9CA3AF", margin: 0 }}>Loading video…</p>
          </div>
        )}
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          playsInline
          preload="metadata"
          title={moduleName}
          onLoadedMetadata={() => setPhase("ready")}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            border: "none",
            background: "#000",
          }}
        />
      </div>
      {phase === "ended" && (
        <div
          style={{
            marginTop: "0.75rem",
            padding: "0.75rem 1rem",
            background: "rgba(16,185,129,0.1)",
            border: "1px solid rgba(16,185,129,0.3)",
            borderRadius: "0.75rem",
            color: "#10B981",
            fontSize: "0.875rem",
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          <PlayCircle size={14} style={{ verticalAlign: "middle", marginRight: "0.375rem" }} />
          Video complete — module marked as done!
        </div>
      )}
    </div>
  );
}
