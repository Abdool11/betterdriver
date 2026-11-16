"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, PlayCircle } from "lucide-react";

interface Props {
  libraryId: string;
  videoId: string;
  moduleName: string;
  onEnded: () => void;
}

declare global {
  interface Window {
    playerjs?: any;
  }
}

/** In-app Bunny Stream player. Signals the parent when the video is effectively watched. */
export default function BunnyPlayer({ libraryId, videoId, moduleName, onEnded }: Props) {
  const [phase, setPhase] = useState<"loading" | "ready" | "ended">("loading");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const endedRef = useRef(false);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  const fireEnded = () => {
    if (endedRef.current) return;
    endedRef.current = true;
    setPhase("ended");
    onEndedRef.current();
  };

  useEffect(() => {
    if (phase !== "ready") return;

    const script = document.createElement("script");
    script.src = "https://assets.mediadelivery.net/playerjs/playerjs-latest.min.js";
    script.async = true;
    script.onload = () => {
      if (!iframeRef.current || !window.playerjs) return;
      try {
        const player = new window.playerjs.Player(iframeRef.current);
        player.on("ready", () => {
          player.on("ended", fireEnded);
          let duration = 0;
          player.getDuration((d: number) => { duration = d; });
          player.on("timeupdate", (data: { seconds: number; duration: number }) => {
            const dur = data.duration || duration;
            if (dur > 0 && (data.seconds / dur) * 100 >= 90) fireEnded();
          });
        });
      } catch {
        // Player events are best effort; the video still plays without them.
      }
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [phase]);

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
        <iframe
          ref={iframeRef}
          src={`https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false`}
          loading="lazy"
          title={moduleName}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
          allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
          allowFullScreen
          onLoad={() => setPhase("ready")}
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
