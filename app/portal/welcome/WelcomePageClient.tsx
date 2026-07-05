"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { DriverSession } from "@/lib/auth";

interface Props {
  session: DriverSession;
}

type Lang = "en" | "zu";

const COPY: Record<Lang, {
  welcome: (name: string) => string;
  sub: string;
  watchMessage: string;
  startLearning: string;
  skipVideo: string;
  skip: string;
  langNote: string;
}> = {
  en: {
    welcome: (name) => `Welcome, ${name}.`,
    sub: "Your training programme is ready. Watch this short message from your team, then we will get you started.",
    watchMessage: "Watch this short message from your team.",
    startLearning: "Start learning →",
    skipVideo: "Skip video & start learning →",
    skip: "Skip",
    langNote: "Available in English and Zulu",
  },
  zu: {
    welcome: (name) => `Sawubona, ${name}.`,
    sub: "Uhlelo lwakho lokuqeqesha selulungile. Buka lo mzwilili omfushane othunyelwe yithimba lakho, bese siqala.",
    watchMessage: "Buka lo mzwilili omfushane othunyelwe yithimba lakho.",
    startLearning: "Qala ukufunda →",
    skipVideo: "Yeqa ividiyo uqale ukufunda →",
    skip: "Yeqa",
    langNote: "Iyatholakala ngesiNgisi nangesiZulu",
  },
};

export default function WelcomePageClient({ session }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoUrl = searchParams.get("video")
    ? decodeURIComponent(searchParams.get("video")!)
    : null;

  const [videoEnded, setVideoEnded] = useState(false);
  const [skipped, setSkipped] = useState(false);

  const lang: Lang =
    session.languagePreference === "zu" ? "zu" : "en";
  const copy = COPY[lang];

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
          background: "linear-gradient(135deg, #14b8a6, #0d9488)",
          borderRadius: "0.75rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 900,
          color: "#fff",
          fontSize: "1.125rem",
          letterSpacing: "-0.5px",
        }}
      >
        B
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
            fontFamily: "var(--font-dm-sans), sans-serif",
          }}
        >
          {copy.welcome(session.firstName)}
        </h1>
        <p
          style={{
            marginTop: "0.5rem",
            fontSize: "0.9375rem",
            color: "rgba(255,255,255,0.65)",
            lineHeight: 1.5,
          }}
        >
          {videoUrl ? copy.sub : copy.startLearning.replace(" →", ".")}
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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          width: "100%",
          maxWidth: "22rem",
        }}
      >
        <button
          onClick={proceed}
          style={{
            width: "100%",
            padding: "0.875rem 1.5rem",
            background: "linear-gradient(135deg, #14b8a6, #0d9488)",
            color: "#fff",
            border: "none",
            borderRadius: "0.625rem",
            fontSize: "1rem",
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: "0.01em",
            fontFamily: "var(--font-dm-sans), sans-serif",
          }}
        >
          {videoUrl && !videoEnded ? copy.skipVideo : copy.startLearning}
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
            {copy.skip}
          </button>
        )}
      </div>

      {/* Language note */}
      <p
        style={{
          fontSize: "0.75rem",
          color: "rgba(255,255,255,0.2)",
          textAlign: "center",
          margin: 0,
        }}
      >
        {copy.langNote}
      </p>
    </div>
  );
}
