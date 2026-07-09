"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ExternalLink, Loader2, PlayCircle } from "lucide-react";

interface Props {
  moduleUrl: string;
  moduleName: string;
}

export default function MoodleIframe({ moduleUrl, moduleName }: Props) {
  const [src, setSrc] = useState<string>("");
  const [phase, setPhase] = useState<"fetching" | "rendering" | "loaded" | "blocked">("fetching");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoadedRef = useRef(false);

  /* 1. Fetch signed autologin URL */
  useEffect(() => {
    let cancelled = false;
    fetch("/api/moodle/autologin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ redirectUrl: moduleUrl }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.url) {
          setSrc(data.url);
        } else {
          setSrc(moduleUrl);
        }
        setPhase("rendering");
      })
      .catch(() => {
        if (cancelled) return;
        setSrc(moduleUrl);
        setPhase("rendering");
      });
    return () => {
      cancelled = true;
    };
  }, [moduleUrl]);

  /* 2. Start a timeout when we begin rendering the iframe.
     If onLoad never fires within 8 s, assume Moodle is blocking the iframe. */
  useEffect(() => {
    if (phase !== "rendering") return;
    hasLoadedRef.current = false;
    timeoutRef.current = setTimeout(() => {
      if (!hasLoadedRef.current) {
        setPhase("blocked");
      }
    }, 8000);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [phase, src]);

  const handleLoad = useCallback(() => {
    hasLoadedRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setPhase("loaded");
  }, []);

  const containerStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    paddingBottom: "56.25%",
    minHeight: "clamp(220px, 56vh, 520px)",
    background: "#0d1526",
    borderRadius: "1rem",
    overflow: "hidden",
    border: "1px solid #2d3a4f",
  };

  /* ---------- FETCHING ---------- */
  if (phase === "fetching") {
    return (
      <div style={{ marginBottom: "2rem" }}>
        <div style={containerStyle}>
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
              Preparing your module…
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- BLOCKED ---------- */
  if (phase === "blocked") {
    return (
      <div style={{ marginBottom: "2rem" }}>
        <div style={containerStyle}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "1rem",
              padding: "1.5rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "0.75rem",
                background: "rgba(245,158,11,0.12)",
                border: "1px solid rgba(245,158,11,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PlayCircle size={22} style={{ color: "#F59E0B" }} />
            </div>
            <div>
              <p
                style={{
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  fontWeight: 700,
                  fontSize: "1rem",
                  color: "#F9FAFB",
                  margin: "0 0 0.375rem",
                }}
              >
                Open this module to begin
              </p>
              <p style={{ fontSize: "0.8125rem", color: "#6B7280", margin: 0, maxWidth: 320, lineHeight: 1.5 }}>
                Your browser requires this content to be opened directly in Moodle.
              </p>
            </div>
            <a
              href={moduleUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "linear-gradient(135deg, #F59E0B, #D97706)",
                color: "#111827",
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontWeight: 700,
                fontSize: "0.9375rem",
                padding: "0.75rem 1.5rem",
                borderRadius: "0.75rem",
                textDecoration: "none",
              }}
            >
              Start Module <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- RENDERING / LOADED ---------- */
  return (
    <div style={{ marginBottom: "2rem" }}>
      <div style={containerStyle}>
        {phase === "rendering" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              zIndex: 1,
            }}
          >
            <Loader2 size={28} style={{ color: "#F59E0B", animation: "spin 1s linear infinite" }} />
            <p style={{ fontSize: "0.875rem", color: "#9CA3AF", margin: 0 }}>
              Loading content…
            </p>
          </div>
        )}
        <iframe
          key={src}
          src={src}
          title={moduleName}
          onLoad={handleLoad}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            border: "none",
            zIndex: 2,
            opacity: phase === "loaded" ? 1 : 0,
            transition: "opacity 0.4s ease",
          }}
          allow="fullscreen; autoplay; encrypted-media; picture-in-picture"
        />
      </div>
      {phase === "loaded" && (
        <p style={{ fontSize: "0.75rem", color: "#6B7280", marginTop: "0.5rem" }}>
          Content loaded. Use the button below if it doesn&apos;t respond.
        </p>
      )}
    </div>
  );
}
