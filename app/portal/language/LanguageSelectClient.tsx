"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Lang = "en" | "zu";

// Both names shown simultaneously so a Zulu-speaking driver recognises
// their option without needing to read English first.
const LANGUAGES: { id: Lang; primary: string; secondary: string; greeting: string }[] = [
  {
    id: "en",
    primary: "English",
    secondary: "English",
    greeting: "Hello",
  },
  {
    id: "zu",
    primary: "IsiZulu",
    secondary: "Zulu",
    greeting: "Sawubona",
  },
];

// Copy shown on the page itself — displayed in both languages simultaneously
// so the driver can read their own language before making a choice.
const HEADING_EN = "Choose your language";
const HEADING_ZU = "Khetha ulimi lwakho";
const SUB_EN = "Select the language you prefer for your training.";
const SUB_ZU = "Khetha ulimi oluthandayo ukuze uqeqeshe.";
const CTA: Record<Lang, string> = {
  en: "Continue in English",
  zu: "Qhubeka ngesiZulu",
};
const SAVING: Record<Lang, string> = {
  en: "Saving…",
  zu: "Kulondolozwa…",
};
const ERROR: Record<Lang, string> = {
  en: "Something went wrong. Please try again.",
  zu: "Kukhona okungahambanga kahle. Zama futhi.",
};

export default function LanguageSelectClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoParam = searchParams.get("video")
    ? `?video=${encodeURIComponent(searchParams.get("video")!)}`
    : "";

  const [selected, setSelected] = useState<Lang | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleContinue() {
    if (!selected) return;
    setSaving(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/portal/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language_preference: selected }),
      });
      if (!res.ok) throw new Error("save failed");
      router.push(`/portal/welcome${videoParam}`);
    } catch {
      setErrorMsg(selected ? ERROR[selected] : ERROR.en);
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
        gap: "0",
      }}
    >
      {/* Logo mark */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #14b8a6, #0d9488)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.25rem",
          fontWeight: 800,
          color: "#fff",
          marginBottom: "1.75rem",
          boxShadow: "0 0 0 8px rgba(20,184,166,0.1)",
        }}
      >
        B
      </div>

      {/* Dual-language heading — both shown at once */}
      <div style={{ textAlign: "center", maxWidth: "22rem", marginBottom: "2rem" }}>
        <h1
          style={{
            fontFamily: "var(--font-dm-sans), sans-serif",
            fontWeight: 800,
            fontSize: "1.625rem",
            color: "#F9FAFB",
            margin: "0 0 0.25rem",
            lineHeight: 1.2,
          }}
        >
          {HEADING_EN}
        </h1>
        <h2
          style={{
            fontFamily: "var(--font-dm-sans), sans-serif",
            fontWeight: 700,
            fontSize: "1.25rem",
            color: "rgba(255,255,255,0.45)",
            margin: "0 0 0.875rem",
            lineHeight: 1.2,
          }}
        >
          {HEADING_ZU}
        </h2>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.875rem", margin: 0 }}>
          {SUB_EN} &nbsp;·&nbsp; {SUB_ZU}
        </p>
      </div>

      {/* Language option cards */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.875rem",
          width: "100%",
          maxWidth: "22rem",
          marginBottom: "1.5rem",
        }}
      >
        {LANGUAGES.map((lang) => {
          const isSelected = selected === lang.id;
          return (
            <button
              key={lang.id}
              onClick={() => setSelected(lang.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "1.25rem 1.5rem",
                background: isSelected
                  ? "linear-gradient(135deg, rgba(20,184,166,0.2), rgba(20,184,166,0.08))"
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
              {/* Greeting pill — shows the word "Hello" / "Sawubona" */}
              <div
                style={{
                  minWidth: 56,
                  padding: "0.375rem 0.625rem",
                  background: isSelected ? "rgba(20,184,166,0.2)" : "rgba(255,255,255,0.06)",
                  borderRadius: "0.5rem",
                  textAlign: "center",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-dm-sans), sans-serif",
                    fontWeight: 700,
                    fontSize: "0.8125rem",
                    color: isSelected ? "#14b8a6" : "rgba(255,255,255,0.5)",
                  }}
                >
                  {lang.greeting}
                </span>
              </div>

              {/* Language names */}
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans), sans-serif",
                    fontWeight: 700,
                    fontSize: "1.0625rem",
                    color: isSelected ? "#14b8a6" : "#F9FAFB",
                    margin: "0 0 0.125rem",
                  }}
                >
                  {lang.primary}
                </p>
                <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.35)", margin: 0 }}>
                  {lang.secondary}
                </p>
              </div>

              {/* Selected checkmark */}
              {isSelected && (
                <div
                  style={{
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
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="#fff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Error message */}
      {errorMsg && (
        <p
          style={{
            color: "#f87171",
            fontSize: "0.875rem",
            margin: "0 0 1rem",
            textAlign: "center",
          }}
        >
          {errorMsg}
        </p>
      )}

      {/* Continue button */}
      <button
        onClick={handleContinue}
        disabled={!selected || saving}
        style={{
          width: "100%",
          maxWidth: "22rem",
          padding: "0.9375rem 1.5rem",
          background: selected
            ? "linear-gradient(135deg, #14b8a6, #0d9488)"
            : "rgba(255,255,255,0.07)",
          color: selected ? "#fff" : "rgba(255,255,255,0.25)",
          border: "none",
          borderRadius: "0.75rem",
          fontSize: "1rem",
          fontWeight: 700,
          cursor: selected ? "pointer" : "not-allowed",
          transition: "all 0.15s ease",
          letterSpacing: "0.01em",
        }}
      >
        {saving ? (selected ? SAVING[selected] : SAVING.en) : selected ? CTA[selected] : `${CTA.en} / ${CTA.zu}`}
      </button>

      {/* Reassurance note */}
      <p
        style={{
          marginTop: "1.25rem",
          fontSize: "0.75rem",
          color: "rgba(255,255,255,0.2)",
          textAlign: "center",
          maxWidth: "18rem",
        }}
      >
        You can change this later in your profile. &nbsp;·&nbsp; Ungakushintsha kamuva ephrofayelini yakho.
      </p>
    </div>
  );
}
