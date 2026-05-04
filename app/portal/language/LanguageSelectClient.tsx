"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Lang = "en" | "zu";

const LABELS: Record<Lang, { native: string; english: string; flag: string }> = {
  en: { native: "English", english: "English", flag: "🇿🇦" },
  zu: { native: "IsiZulu", english: "Zulu", flag: "🇿🇦" },
};

const COPY = {
  en: {
    heading: "Choose your language",
    sub: "You can change this later in your profile.",
    cta: "Continue",
  },
  zu: {
    heading: "Khetha ulimi lwakho",
    sub: "Ungakushintsha lokhu kamuva ephrofayelini yakho.",
    cta: "Qhubeka",
  },
};

export default function LanguageSelectClient() {
  const router = useRouter();
  const [selected, setSelected] = useState<Lang | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const copy = selected ? COPY[selected] : COPY.en;

  async function handleContinue() {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/portal/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language_preference: selected }),
      });
      if (!res.ok) throw new Error("Failed to save language preference");
      router.push("/portal/welcome");
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "linear-gradient(160deg, #0d1526 0%, #0a1020 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.25rem",
        gap: "2.5rem",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #14b8a6, #0d9488)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.125rem",
            fontWeight: 800,
            color: "#fff",
          }}
        >
          B
        </div>
        <span
          style={{
            fontFamily: "var(--font-dm-sans), sans-serif",
            fontWeight: 800,
            fontSize: "1.25rem",
            color: "#F9FAFB",
            letterSpacing: "-0.01em",
          }}
        >
          BetterDriver
        </span>
      </div>

      {/* Heading */}
      <div style={{ textAlign: "center", maxWidth: "22rem" }}>
        <h1
          style={{
            fontFamily: "var(--font-dm-sans), sans-serif",
            fontWeight: 800,
            fontSize: "1.75rem",
            color: "#F9FAFB",
            margin: "0 0 0.5rem",
            lineHeight: 1.2,
          }}
        >
          {copy.heading}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.9375rem", margin: 0 }}>
          {copy.sub}
        </p>
      </div>

      {/* Language cards */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          width: "100%",
          maxWidth: "22rem",
        }}
      >
        {(Object.keys(LABELS) as Lang[]).map((lang) => {
          const isSelected = selected === lang;
          return (
            <button
              key={lang}
              onClick={() => setSelected(lang)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "1.25rem 1.5rem",
                background: isSelected
                  ? "linear-gradient(135deg, rgba(20,184,166,0.18), rgba(20,184,166,0.08))"
                  : "rgba(255,255,255,0.04)",
                border: isSelected
                  ? "2px solid #14b8a6"
                  : "2px solid rgba(255,255,255,0.08)",
                borderRadius: "1rem",
                cursor: "pointer",
                transition: "all 0.15s ease",
                textAlign: "left",
                width: "100%",
              }}
            >
              <span style={{ fontSize: "2rem", lineHeight: 1 }}>{LABELS[lang].flag}</span>
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans), sans-serif",
                    fontWeight: 700,
                    fontSize: "1.0625rem",
                    color: isSelected ? "#14b8a6" : "#F9FAFB",
                    margin: "0 0 0.125rem",
                  }}
                >
                  {LABELS[lang].native}
                </p>
                <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)", margin: 0 }}>
                  {LABELS[lang].english}
                </p>
              </div>
              {isSelected && (
                <div
                  style={{
                    marginLeft: "auto",
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "#14b8a6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <p style={{ color: "#f87171", fontSize: "0.875rem", margin: 0, textAlign: "center" }}>
          {error}
        </p>
      )}

      {/* CTA */}
      <button
        onClick={handleContinue}
        disabled={!selected || saving}
        style={{
          width: "100%",
          maxWidth: "22rem",
          padding: "0.9375rem 1.5rem",
          background: selected
            ? "linear-gradient(135deg, #14b8a6, #0d9488)"
            : "rgba(255,255,255,0.08)",
          color: selected ? "#fff" : "rgba(255,255,255,0.3)",
          border: "none",
          borderRadius: "0.75rem",
          fontSize: "1rem",
          fontWeight: 700,
          cursor: selected ? "pointer" : "not-allowed",
          transition: "all 0.15s ease",
          letterSpacing: "0.01em",
        }}
      >
        {saving ? "Saving..." : copy.cta}
      </button>
    </div>
  );
}
