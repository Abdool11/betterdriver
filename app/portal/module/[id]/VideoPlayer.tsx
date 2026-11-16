"use client";

import { useRef, useState } from "react";
import { Loader2, PlayCircle } from "lucide-react";

interface Props {
  videoUrl: string;
  moduleName: string;
  onEnded: () => void;
}

/** In-app native player for direct video files. Signals the parent when effectively watched. */
export default function VideoPlayer({ videoUrl, moduleName, onEnded }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "ended">("loading");
  const endedRef = useRef(false);

  const fireEnded = () => {
    if (endedRef.current) return;
    endedRef.current = true;
    setPhase("ended");
    onEnded();
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || video.duration <= 0) return;
    if ((video.currentTime / video.duration) * 100 >= 90) fireEnded();
  };

  return (
    <div style={{ marginBottom: "1.5rem" }}>
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
          onEnded={fireEnded}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none", background: "#000" }}
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
          Video finished
        </div>
      )}
    </div>
  );
}
