"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { DriverSession } from "@/lib/auth";

interface Props {
  session: DriverSession;
}

export default function WelcomePageClient({ session }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoUrl = searchParams.get("video") ? decodeURIComponent(searchParams.get("video")!) : null;
  const [videoEnded, setVideoEnded] = useState(false);
  const [skipped, setSkipped] = useState(false);

  const proceed = () => router.replace("/portal");

  useEffect(() => {
    if (videoEnded || skipped) {
      const timer = setTimeout(proceed, 800);
      return () => clearTimeout(timer);
    }
  }, [videoEnded, skipped]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "linear-gradient(160deg, #0d1526 0%, #0a2a1a 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        gap: "1.5rem",
      }}
    >
      {/* Logo */}
      <div
        style={{
          width: "3rem",
          height: "3rem",
          background: "linear-gradient(135deg, #f59e0b, #d97706)",
          borderRadius: "0.75rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 900,
          color: "#0d1526",
          fontSize: "1.125rem",
          letterSpacing: "-0.5px",
        }}
      >
        BD
      </div>

      {/* Welcome heading */}
      <div style={{ textAlign: "center", maxWidth: "22rem" }}>
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "#ffffff",
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          Welcome, {session.firstName}.
        </h1>
        <p
          style={{
            marginTop: "0.5rem",
            fontSize: "0.9375rem",
            color: "rgba(255,255,255,0.65)",
            lineHeight: 1.5,
          }}
        >
          Your training programme is ready. Watch this short message from your team, then
          we&apos;ll get you started.
        </p>
      </div>

      {/* Invite video */}
      {videoUrl ? (
        <div
          style={{
            width: "100%",
            maxWidth: "22rem",
            borderRadius: "0.75rem",
            overflow: "hidden",
            background: "#000",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          <video
            src={videoUrl}
            controls
            autoPlay
            playsInline
            style={{ width: "100%", display: "block" }}
            onEnded={() => setVideoEnded(true)}
          />
        </div>
      ) : null}

      {/* CTA */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%", maxWidth: "22rem" }}>
        <button
          onClick={proceed}
          style={{
            width: "100%",
            padding: "0.875rem 1.5rem",
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            color: "#0d1526",
            border: "none",
            borderRadius: "0.625rem",
            fontSize: "1rem",
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: "0.01em",
          }}
        >
          {videoUrl && !videoEnded ? "Skip video & start learning →" : "Start learning →"}
        </button>

        {videoUrl && !videoEnded && (
          <button
            onClick={() => setSkipped(true)}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.4)",
              fontSize: "0.8125rem",
              cursor: "pointer",
              padding: "0.25rem",
            }}
          >
            Skip
          </button>
        )}
      </div>

      {/* Language note */}
      <p
        style={{
          fontSize: "0.75rem",
          color: "rgba(255,255,255,0.25)",
          textAlign: "center",
          margin: 0,
        }}
      >
        Available in English and Zulu
      </p>
    </div>
  );
}
