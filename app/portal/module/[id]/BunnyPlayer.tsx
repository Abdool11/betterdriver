"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface Props {
  libraryId: string;
  videoId: string;
  moduleId: string;
  moduleName: string;
  onComplete?: () => void;
}

declare global {
  interface Window {
    playerjs?: any;
  }
}

export default function BunnyPlayer({
  libraryId,
  videoId,
  moduleId,
  moduleName,
  onComplete,
}: Props) {
  const [phase, setPhase] = useState<"loading" | "ready" | "ended">("loading");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const markedRef = useRef(false);

  useEffect(() => {
    if (phase !== "ready") return;

    const script = document.createElement("script");
    script.src = "https://assets.mediadelivery.net/playerjs/playerjs-latest.min.js";
    script.async = true;
    script.onload = () => {
      if (!iframeRef.current || !window.playerjs) return;
      const player = new window.playerjs.Player(iframeRef.current);

      player.on("ready", () => {
        console.log("[BunnyPlayer] Player ready");
        player.on("ended", () => {
          console.log("[BunnyPlayer] Video ended");
          setPhase("ended");
          if (!markedRef.current) {
            markedRef.current = true;
            markComplete();
          }
        });

        // Track 90% watched as fallback
        let duration = 0;
        player.getDuration((d: number) => {
          duration = d;
        });

        player.on("timeupdate", (data: { seconds: number; duration: number }) => {
          const dur = data.duration || duration;
          if (dur > 0 && data.seconds / dur >= 0.9 && !markedRef.current) {
            console.log("[BunnyPlayer] 90% watched — marking complete");
            markedRef.current = true;
            markComplete();
          }
        });
      });
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [phase]);

  async function markComplete() {
    try {
      const res = await fetch("/api/portal/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, completed: true }),
      });
      if (!res.ok) {
        console.error("[BunnyPlayer] Progress API returned", res.status);
        return;
      }
      const data = await res.json();
      console.log("[BunnyPlayer] Progress API response:", data);

      // Trigger Moodle's native completion tracking by loading the signed
      // autologin URL in a hidden iframe (server-side fetch lacks cookies).
      if (data.moodleUrl && typeof data.moodleUrl === "string") {
        const iframe = document.createElement("iframe");
        iframe.src = data.moodleUrl;
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.border = "none";
        iframe.style.position = "absolute";
        iframe.style.visibility = "hidden";
        iframe.setAttribute("aria-hidden", "true");
        document.body.appendChild(iframe);
        // Clean up after 30 seconds — enough time for Moodle to log the view
        setTimeout(() => {
          if (iframe.parentNode) document.body.removeChild(iframe);
        }, 30000);
      }

      onComplete?.();
    } catch (err) {
      console.error("[BunnyPlayer] Failed to mark complete:", err);
    }
  }

  const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false`;

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
            <p style={{ fontSize: "0.875rem", color: "#9CA3AF", margin: 0 }}>
              Loading video…
            </p>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={embedUrl}
          loading="lazy"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            border: "none",
          }}
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
          Video complete — module marked as done!
        </div>
      )}
    </div>
  );
}
